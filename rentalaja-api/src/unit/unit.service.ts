import { Injectable, NotFoundException } from '@nestjs/common';
import type { Unit } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RentangSewaDto } from '../umum/dto/rentang-sewa.dto.js';
import { okupansi, ratingUnit, unitTerisi } from '../umum/ketersediaan.js';
import { bacaRentangSewa } from '../umum/rentang-sewa.js';
import { awalHariWita, HARI, keIsoWita } from '../umum/waktu-wita.js';

type UnitDenganMitra = Unit & { mitra: { nama: string } };

/** Bentuk unit yang boleh dilihat publik. Plat sengaja tidak ikut: itu
 *  urusan penyedia dan penyewa yang sudah memesan, bukan pengunjung. */
export function bentukUnitPublik(u: UnitDenganMitra, rating?: { rata: number; jumlah: number }) {
  return {
    id: u.id,
    slug: u.slug,
    nama: u.nama,
    kategori: u.kategori,
    jenis: u.jenis,
    tahun: u.tahun,
    spesifikasi: u.spesifikasi,
    area: u.area,
    foto: u.foto,
    hargaPerHari: u.hargaPerHari,
    penyedia: { nama: u.mitra.nama },
    /** null = belum ada ulasan, bukan nol bintang. */
    rating: rating?.rata ?? null,
    jumlahUlasan: rating?.jumlah ?? 0,
  };
}

/**
 * Harga sewa saja: harga per hari x jumlah hari.
 *
 * Biaya layanan penyewa dan total SENGAJA belum ada. Besarannya belum
 * diputuskan pemilik proyek (backend.md bagian 4), jadi endpoint baca tidak
 * boleh menampilkan angka yang nanti ternyata berbeda dengan yang ditagih.
 */
export function hargaSewa(perHari: number, jumlahHari: number) {
  return { perHari, jumlahHari, subtotal: perHari * jumlahHari };
}

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async detail(slug: string, q: RentangSewaDto) {
    const sekarang = Date.now();
    const sewa = bacaRentangSewa(q, sekarang);

    const unit = await this.prisma.unit.findUnique({
      where: { slug },
      include: { mitra: { select: { nama: true, area: true, _count: { select: { unit: true } } } } },
    });
    if (!unit) throw new NotFoundException(`Unit "${slug}" tidak ditemukan.`);

    // Strip kalender 7 hari mulai dari hari ambil.
    const awal = awalHariWita(sewa.mulai.getTime());
    const [terisi, isiKalender, rating] = await Promise.all([
      unitTerisi(this.prisma, sewa.mulai, sewa.selesai),
      okupansi(this.prisma, [unit.id], new Date(awal), new Date(awal + 7 * HARI), sekarang),
      ratingUnit(this.prisma, [unit.id]),
    ]);

    const kalender = Array.from({ length: 7 }, (_, i) => {
      const hari = awal + i * HARI;
      // "telat" tidak dihitung, sama dengan database yang juga tidak
      // menolak pesanan setelah jadwal kembali (lihat ketersediaan.ts).
      const terpakai = isiKalender.some(
        (o) => o.jenis !== 'telat' && o.mulai < hari + HARI && o.selesai > hari,
      );
      return { tanggal: keIsoWita(hari), kosong: !terpakai };
    });

    return {
      unit: bentukUnitPublik(unit, rating.get(unit.id)),
      sewa,
      kosong: !terisi.has(unit.id),
      harga: hargaSewa(unit.hargaPerHari, sewa.jumlahHari),
      kalender,
      penyedia: { nama: unit.mitra.nama, area: unit.mitra.area, jumlahUnit: unit.mitra._count.unit },
    };
  }
}
