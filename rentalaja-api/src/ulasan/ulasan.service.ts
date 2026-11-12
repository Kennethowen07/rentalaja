import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { kodeSqlState, SQLSTATE } from '../prisma/kesalahan-db.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BalasUlasanDto } from './dto/balas-ulasan.dto.js';
import type { BuatUlasanDto } from './dto/buat-ulasan.dto.js';

const ISI = {
  unit: { select: { nama: true, slug: true } },
  penyewa: { select: { nama: true } },
  pesanan: { select: { kode: true } },
} satisfies Prisma.UlasanInclude;

type UlasanLengkap = Prisma.UlasanGetPayload<{ include: typeof ISI }>;

/** Bentuknya mengikuti Ulasan di rentalaja-web/lib/mitra/tipe.ts. */
function bentuk(u: UlasanLengkap) {
  return {
    id: u.id,
    kodePesanan: u.pesanan.kode,
    nama: u.penyewa.nama,
    unit: u.unit.nama,
    unitSlug: u.unit.slug,
    // Decimal(2,1) di database; ke klien sebagai angka biasa (4.5).
    skor: u.skor.toNumber(),
    tanggal: u.dibuatPada,
    isi: u.isi,
    balasan: u.balasan,
    dibalasPada: u.dibalasPada,
  };
}

@Injectable()
export class UlasanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Penyewa mengulas pesanannya sendiri yang sudah SELESAI. Satu ulasan per
   * pesanan dijaga indeks unik ulasan_pesanan_id_key di database, bukan cek
   * "cari dulu": dua kiriman bersamaan tetap hanya menghasilkan satu baris.
   */
  async buat(penyewaId: string, kode: string, dto: BuatUlasanDto) {
    const p = await this.prisma.pesanan.findFirst({
      where: { kode, penyewaId },
      select: { id: true, status: true, unitId: true },
    });
    // 404, bukan 403, untuk pesanan orang lain: kodenya bisa ditebak.
    if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
    if (p.status !== 'SELESAI') {
      throw new ConflictException('Ulasan hanya bisa ditulis setelah pesanan selesai.');
    }

    try {
      const u = await this.prisma.ulasan.create({
        data: { pesananId: p.id, unitId: p.unitId, penyewaId, skor: dto.skor, isi: dto.isi },
        include: ISI,
      });
      return bentuk(u);
    } catch (e) {
      if (kodeSqlState(e) === SQLSTATE.UNIK_DILANGGAR) {
        throw new ConflictException('Pesanan ini sudah kamu ulas.');
      }
      throw e;
    }
  }

  /** Daftar ulasan untuk unit milik mitra ini, terbaru di atas, plus ringkasan
   *  sepanjang waktu (rata-rata, total, distribusi bintang 5 sampai 1). */
  async daftarMilikMitra(penggunaId: string) {
    const mitra = await this.prisma.mitra.findUnique({ where: { pemilikId: penggunaId }, select: { id: true } });
    if (!mitra) throw new ForbiddenException('Akun ini belum terdaftar sebagai mitra.');

    const baris = await this.prisma.ulasan.findMany({
      where: { unit: { mitraId: mitra.id } },
      include: ISI,
      orderBy: { dibuatPada: 'desc' },
    });
    const daftar = baris.map(bentuk);

    const total = daftar.length;
    const jumlahSkor = daftar.reduce((n, u) => n + u.skor, 0);
    return {
      daftar,
      ringkasan: {
        // Satu angka di belakang koma, sama dengan tampilan "4,9".
        rata: total === 0 ? 0 : Math.round((jumlahSkor / total) * 10) / 10,
        total,
        // Skor setengah dibulatkan ke bawah: 4,5 masuk kelompok 4 bintang.
        distribusi: [5, 4, 3, 2, 1].map((bintang) => ({
          bintang,
          jumlah: daftar.filter((u) => Math.floor(u.skor) === bintang).length,
        })),
      },
    };
  }

  /**
   * Balasan penyedia. Boleh diubah: kiriman berikutnya menimpa balasan lama
   * dan memperbarui dibalasPada, seperti umumnya marketplace. Hanya ulasan
   * untuk unit milik mitra ini; selain itu 404.
   */
  async balas(penggunaId: string, id: string, dto: BalasUlasanDto) {
    const hasil = await this.prisma.ulasan.updateMany({
      where: { id, unit: { mitra: { pemilikId: penggunaId } } },
      data: { balasan: dto.balasan, dibalasPada: new Date() },
    });
    if (hasil.count === 0) throw new NotFoundException('Ulasan tidak ditemukan.');
    const u = await this.prisma.ulasan.findUniqueOrThrow({ where: { id }, include: ISI });
    return bentuk(u);
  }
}
