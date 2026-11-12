import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PenggunaToken } from '../auth/penjaga.js';
import type { Prisma } from '../generated/prisma/client.js';
import { adalahAturanDilanggar } from '../prisma/kesalahan-db.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { milikPengguna, pesananBerkode } from '../pesanan/akses-pesanan.js';
import { BATAS_BALAS_MS, statusTurunan, type StatusTampil } from '../umum/status-pesanan.js';

/** Pesanan yang sudah batal tetap bisa dibaca riwayat chatnya, tapi tidak
 *  bisa dikirimi pesan baru. Kedaluwarsa = batal otomatis. */
const TERTUTUP: StatusTampil[] = ['ditolak', 'dibatalkan', 'kedaluwarsa'];

const PESANAN_CHAT = {
  unit: { select: { nama: true, plat: true, mitra: { select: { nama: true } } } },
  penyewa: { select: { nama: true } },
} satisfies Prisma.PesananInclude;

type PesananChat = Prisma.PesananGetPayload<{ include: typeof PESANAN_CHAT }>;

type BarisPesan = { id: string; pengirimId: string; isi: string; dikirimPada: Date; dibacaPada: Date | null };

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daftar percakapan, yang terbaru di atas.
   *
   * Penyewa: semua pesanannya. Mitra: pesanan unit miliknya yang masih
   * menunggu (belum kedaluwarsa) atau sedang berjalan, ditambah pesanan apa
   * pun yang sudah punya pesan, supaya riwayat lama tidak hilang begitu
   * pesanan selesai.
   */
  async daftar(pengguna: PenggunaToken) {
    const sekarang = Date.now();
    const where: Prisma.PesananWhereInput =
      pengguna.peran === 'MITRA'
        ? {
            ...milikPengguna(pengguna),
            OR: [
              { status: 'BERJALAN' },
              { status: 'MENUNGGU', dibuatPada: { gt: new Date(sekarang - BATAS_BALAS_MS) } },
              { pesanChat: { some: {} } },
            ],
          }
        : milikPengguna(pengguna);

    const baris = await this.prisma.pesanan.findMany({
      where,
      include: {
        ...PESANAN_CHAT,
        pesanChat: { orderBy: [{ dikirimPada: 'desc' }, { id: 'desc' }], take: 1 },
        _count: {
          select: { pesanChat: { where: { pengirimId: { not: pengguna.id }, dibacaPada: null } } },
        },
      },
    });

    return baris
      .map((p) => {
        const terakhir = p.pesanChat[0] ?? null;
        return {
          ...this.kepala(p, pengguna, sekarang),
          pesanTerakhir: terakhir ? this.bentukPesan(terakhir, p, pengguna) : null,
          belumDibaca: p._count.pesanChat,
          /** Dasar urutan: pesan terakhir, atau waktu pesanan dibuat kalau
           *  belum ada pesan sama sekali. */
          aktivitasTerakhir: terakhir?.dikirimPada ?? p.dibuatPada,
        };
      })
      .sort((a, b) => b.aktivitasTerakhir.getTime() - a.aktivitasTerakhir.getTime());
  }

  /**
   * Semua pesan satu percakapan, urut waktu kirim. Membuka percakapan
   * menandai pesan dari lawan bicara sebagai dibaca; pesan sendiri tidak
   * disentuh, jadi tanda "dibaca" tetap milik penerimanya.
   */
  async buka(pengguna: PenggunaToken, kode: string) {
    const p = await this.cari(pengguna, kode);
    const sekarang = Date.now();
    await this.prisma.pesanChat.updateMany({
      where: { pesananId: p.id, pengirimId: { not: pengguna.id }, dibacaPada: null },
      data: { dibacaPada: new Date(sekarang) },
    });
    const pesan = await this.prisma.pesanChat.findMany({
      where: { pesananId: p.id },
      orderBy: [{ dikirimPada: 'asc' }, { id: 'asc' }],
    });
    return {
      ...this.kepala(p, pengguna, sekarang),
      pesan: pesan.map((m) => this.bentukPesan(m, p, pengguna)),
    };
  }

  /** 409 untuk pesanan yang ditolak, dibatalkan, atau kedaluwarsa. */
  async kirim(pengguna: PenggunaToken, kode: string, isi: string) {
    const p = await this.cari(pengguna, kode);
    const status = statusTurunan(p, Date.now());
    if (TERTUTUP.includes(status)) {
      throw new ConflictException('Pesanan ini sudah batal. Riwayat chat tetap bisa dibaca, tapi pesan baru tidak bisa dikirim.');
    }
    try {
      const m = await this.prisma.pesanChat.create({
        data: { pesananId: p.id, pengirimId: pengguna.id, isi },
      });
      return this.bentukPesan(m, p, pengguna);
    } catch (e) {
      // CHECK pesan_chat_isi_valid: lapis kedua kalau DTO terlewati.
      if (adalahAturanDilanggar(e)) throw new BadRequestException('isi pesan harus 1 sampai 2000 karakter.');
      throw e;
    }
  }

  /** 404, bukan 403, untuk pesanan orang lain: sama dengan detail pesanan,
   *  jawabannya tidak boleh membocorkan bahwa kode itu ada. */
  private async cari(pengguna: PenggunaToken, kode: string): Promise<PesananChat> {
    const p = await this.prisma.pesanan.findFirst({
      where: pesananBerkode(pengguna, kode),
      include: PESANAN_CHAT,
    });
    if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
    return p;
  }

  /** Bagian yang sama di daftar dan isi percakapan. */
  private kepala(p: PesananChat, pengguna: PenggunaToken, sekarang: number) {
    const status = statusTurunan(p, sekarang);
    return {
      kode: p.kode,
      status,
      bisaKirim: !TERTUTUP.includes(status),
      lawan: {
        peran: pengguna.peran === 'MITRA' ? ('penyewa' as const) : ('penyedia' as const),
        nama: pengguna.peran === 'MITRA' ? p.penyewa.nama : p.unit.mitra.nama,
      },
      unit: p.unit.nama,
      // Sama dengan detail pesanan: plat dibuka ke penyewa setelah diterima.
      plat: pengguna.peran === 'MITRA' || p.diterimaPada !== null ? p.unit.plat : null,
    };
  }

  private bentukPesan(m: BarisPesan, p: PesananChat, pengguna: PenggunaToken) {
    return {
      id: m.id,
      isi: m.isi,
      dari: m.pengirimId === p.penyewaId ? ('penyewa' as const) : ('penyedia' as const),
      dariSaya: m.pengirimId === pengguna.id,
      dikirimPada: m.dikirimPada,
      dibacaPada: m.dibacaPada,
    };
  }
}
