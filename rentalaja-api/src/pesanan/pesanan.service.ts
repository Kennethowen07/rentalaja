import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PenggunaToken } from '../auth/penjaga.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  adalahAturanDilanggar,
  adalahSlotTerisi,
  kodeSqlState,
  SQLSTATE,
} from '../prisma/kesalahan-db.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { rincianHarga } from '../umum/harga.js';
import { bacaRentangSewa } from '../umum/rentang-sewa.js';
import {
  BATAS_BALAS_MS,
  statusDana,
  statusTurunan,
  type StatusTampil,
} from '../umum/status-pesanan.js';
import type { BuatPesananDto } from './dto/buat-pesanan.dto.js';

const ISI = {
  unit: {
    select: { slug: true, nama: true, foto: true, plat: true, mitra: { select: { nama: true } } },
  },
  penyewa: { select: { nama: true, telepon: true } },
  pembayaran: { select: { jumlah: true, metode: true, dibayarPada: true } },
  klaim: { select: { diselesaikanPada: true } },
} satisfies Prisma.PesananInclude;

type PesananLengkap = Prisma.PesananGetPayload<{ include: typeof ISI }>;

/** Jawaban ketika aksi ditolak karena pesanan sudah tidak menunggu. */
const SUDAH: Record<StatusTampil, string> = {
  menunggu: 'Pesanan masih menunggu balasan penyedia.',
  kedaluwarsa: 'Pesanan sudah batal otomatis karena penyedia tidak membalas dalam 1 jam.',
  berjalan: 'Pesanan sudah diterima penyedia.',
  telat: 'Pesanan sudah diterima penyedia.',
  selesai: 'Pesanan sudah selesai.',
  ditolak: 'Pesanan sudah ditolak penyedia.',
  dibatalkan: 'Pesanan sudah dibatalkan.',
};

/** Pesanan yang boleh dilihat dan diubah pengguna ini: penyewa hanya
 *  pesanannya sendiri, mitra hanya pesanan untuk unit miliknya. */
function milik(p: PenggunaToken): Prisma.PesananWhereInput {
  return p.peran === 'MITRA' ? { unit: { mitra: { pemilikId: p.id } } } : { penyewaId: p.id };
}

/** "RA-284207". Bentrok dengan kode yang sudah ada ditangani dengan coba ulang. */
function buatKode(): string {
  return `RA-${randomInt(100_000, 1_000_000)}`;
}

@Injectable()
export class PesananService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pesan dan bayar penuh dalam satu langkah (backend.md bagian 4).
   *
   * Pesanan dan pembayarannya ditulis dalam satu transaksi, jadi tidak pernah
   * ada pesanan MENUNGGU yang belum dibayar. Kalau ada, baris itu akan
   * mengunci slot unit selama 1 jam tanpa uang yang masuk.
   *
   * Pembayarannya SIMULASI: belum ada payment gateway, jadi baris pembayaran
   * dicatat langsung dengan jumlah = total. Yang tetap dijaga sungguhan adalah
   * jumlahnya, lewat trigger pembayaran_sesuai_total di database.
   */
  async buat(penyewaId: string, dto: BuatPesananDto) {
    const sekarang = Date.now();
    const sewa = bacaRentangSewa(dto, sekarang);
    // Pencarian menerima hari ini walau jamnya sudah lewat; pesanan tidak.
    if (sewa.mulai.getTime() <= sekarang) {
      throw new BadRequestException('Jam ambil sudah lewat. Pilih jam atau tanggal lain.');
    }

    const unit = await this.prisma.unit.findUnique({
      where: { slug: dto.unit },
      select: { id: true, hargaPerHari: true },
    });
    if (!unit) throw new NotFoundException(`Unit "${dto.unit}" tidak ditemukan.`);

    const harga = rincianHarga(unit.hargaPerHari, sewa.jumlahHari);
    if (dto.totalDisetujui !== harga.total) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Harga berubah sejak terakhir kamu lihat. Periksa total baru sebelum membayar.',
        harga,
      });
    }

    for (let coba = 1; ; coba++) {
      try {
        const kode = await this.prisma.$transaction(async (tx) => {
          const p = await tx.pesanan.create({
            data: {
              kode: buatKode(),
              unitId: unit.id,
              penyewaId,
              mulai: sewa.mulai,
              selesai: sewa.selesai,
              hargaPerHari: harga.perHari,
              jumlahHari: harga.jumlahHari,
              subtotal: harga.subtotal,
              biayaLayanan: harga.biayaLayanan,
              total: harga.total,
              diantar: dto.diantar,
              titik: dto.titik,
            },
          });
          await tx.pembayaran.create({
            data: { pesananId: p.id, jumlah: p.total, metode: dto.metode, dibayarPada: new Date() },
          });
          return p.kode;
        });
        return this.detail({ id: penyewaId, peran: 'PENYEWA' }, kode);
      } catch (e) {
        // Ditolak database saat menulis, bukan dicek lebih dulu: dua penyewa
        // yang memesan slot yang sama bersamaan tidak bisa lolos dua-duanya.
        if (adalahSlotTerisi(e)) {
          throw new ConflictException(
            'Unit ini sudah dipesan orang lain atau diblokir penyedia di rentang itu. Pilih tanggal atau unit lain.',
          );
        }
        // Satu-satunya kolom unik yang bisa bentrok di sini adalah kode.
        if (kodeSqlState(e) === SQLSTATE.UNIK_DILANGGAR && coba < 5) continue;
        throw e;
      }
    }
  }

  async daftarMilikPenyewa(penyewaId: string) {
    const baris = await this.prisma.pesanan.findMany({
      where: { penyewaId },
      include: ISI,
      orderBy: { dibuatPada: 'desc' },
    });
    const sekarang = Date.now();
    return baris.map((p) => this.bentuk(p, 'PENYEWA', sekarang));
  }

  /** 404, bukan 403, untuk pesanan orang lain: kode pesanan pendek dan
   *  bisa ditebak, jadi jawabannya tidak boleh membocorkan bahwa kode itu ada. */
  async detail(pengguna: PenggunaToken, kode: string) {
    const p = await this.prisma.pesanan.findFirst({ where: { kode, ...milik(pengguna) }, include: ISI });
    if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
    return this.bentuk(p, pengguna.peran, Date.now());
  }

  terima(mitra: PenggunaToken, kode: string) {
    return this.balasMenunggu(mitra, kode, { status: 'BERJALAN', diterimaPada: new Date() });
  }

  tolak(mitra: PenggunaToken, kode: string) {
    return this.balasMenunggu(mitra, kode, { status: 'DITOLAK', ditolakPada: new Date() });
  }

  /** Penyewa hanya bisa membatalkan selama pesanan masih menunggu. Kebijakan
   *  pembatalan setelah penyedia menerima (berapa yang dikembalikan) belum
   *  diputuskan, jadi tidak dikarang di sini. */
  batal(penyewa: PenggunaToken, kode: string) {
    return this.balasMenunggu(
      penyewa,
      kode,
      { status: 'DIBATALKAN', alasanBatal: 'DIBATALKAN_PENYEWA', dibatalkanPada: new Date() },
      { berjalan: 'Pesanan yang sudah diterima penyedia belum bisa dibatalkan lewat aplikasi.' },
    );
  }

  /**
   * Satu-satunya jalan keluar dari MENUNGGU. Syaratnya (milik pengguna ini,
   * masih MENUNGGU, belum lewat batas balas) ditaruh di WHERE update itu
   * sendiri, jadi dua aksi bersamaan (penyedia menerima saat penyewa
   * membatalkan) tidak bisa sama-sama berhasil: yang kedua mengubah 0 baris.
   */
  private async balasMenunggu(
    pengguna: PenggunaToken,
    kode: string,
    data: Prisma.PesananUpdateManyMutationInput,
    pesanKhusus: Partial<Record<StatusTampil, string>> = {},
  ) {
    let berubah = 0;
    try {
      const hasil = await this.prisma.pesanan.updateMany({
        where: {
          kode,
          ...milik(pengguna),
          status: 'MENUNGGU',
          dibuatPada: { gt: new Date(Date.now() - BATAS_BALAS_MS) },
        },
        data,
      });
      berubah = hasil.count;
    } catch (e) {
      // Trigger pesanan_jaga_slot menolak penerimaan yang lewat batas balas
      // menurut jam database, untuk kasus tepat di detik terakhir.
      if (!adalahAturanDilanggar(e)) throw e;
    }

    if (berubah === 0) {
      const p = await this.prisma.pesanan.findFirst({ where: { kode, ...milik(pengguna) } });
      if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
      const status = statusTurunan(p, Date.now());
      // Masih "menunggu" di jam aplikasi tapi ditolak database: batasnya
      // lewat di antara keduanya.
      const sebab = status === 'menunggu' ? 'kedaluwarsa' : status;
      throw new ConflictException(pesanKhusus[sebab] ?? SUDAH[sebab]);
    }
    return this.detail(pengguna, kode);
  }

  private bentuk(p: PesananLengkap, sebagai: PenggunaToken['peran'], sekarang: number) {
    const status = statusTurunan(p, sekarang);
    const batasBalas = new Date(p.dibuatPada.getTime() + BATAS_BALAS_MS);
    return {
      kode: p.kode,
      status,
      statusDana: statusDana(p, p.klaim, sekarang),
      /** Hanya untuk status menunggu: setelah ini pesanan batal otomatis. */
      batasBalasPada: status === 'menunggu' ? batasBalas : null,
      unit: {
        slug: p.unit.slug,
        nama: p.unit.nama,
        foto: p.unit.foto,
        // Plat dibuka ke penyewa setelah penyedia menerima pesanannya.
        plat: sebagai === 'MITRA' || p.diterimaPada !== null ? p.unit.plat : null,
      },
      penyedia: { nama: p.unit.mitra.nama },
      // Kontak penyewa hanya untuk penyedia unit ini.
      ...(sebagai === 'MITRA' ? { penyewa: p.penyewa } : {}),
      mulai: p.mulai,
      selesai: p.selesai,
      harga: {
        perHari: p.hargaPerHari,
        jumlahHari: p.jumlahHari,
        subtotal: p.subtotal,
        biayaLayanan: p.biayaLayanan,
        total: p.total,
      },
      diantar: p.diantar,
      titik: p.titik,
      pembayaran: p.pembayaran,
      dibuatPada: p.dibuatPada,
      diterimaPada: p.diterimaPada,
      ditolakPada: p.ditolakPada,
      dibatalkanPada: status === 'kedaluwarsa' ? batasBalas : p.dibatalkanPada,
      kembaliPada: p.kembaliPada,
      alasanBatal: status === 'kedaluwarsa' ? 'KEDALUWARSA' : p.alasanBatal,
    };
  }
}
