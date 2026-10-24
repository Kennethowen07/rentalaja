import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { rincianHarga } from '../umum/harga.js';
import { ratingUnit, unitTerisi } from '../umum/ketersediaan.js';
import { bacaRentangSewa } from '../umum/rentang-sewa.js';
import { bentukUnitPublik } from '../unit/unit.service.js';
import type { CariDto } from './dto/cari.dto.js';

@Injectable()
export class PencarianService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Semua unit beserta status kosong di satu rentang. Unit yang terisi tetap
   * dikembalikan (dengan kosong: false), karena layar pencarian menampilkannya
   * redup di bawah. Itulah "momen ganti tanggal" di design brief: mengganti
   * rentang memindahkan unit antara kosong dan terisi.
   */
  async cari(q: CariDto) {
    const sewa = bacaRentangSewa(q, Date.now());

    const daftar = await this.prisma.unit.findMany({
      where: q.kategori ? { kategori: q.kategori === 'mobil' ? 'MOBIL' : 'MOTOR' } : {},
      include: { mitra: { select: { nama: true } } },
    });
    const [terisi, rating] = await Promise.all([
      unitTerisi(this.prisma, sewa.mulai, sewa.selesai),
      ratingUnit(this.prisma, daftar.map((u) => u.id)),
    ]);

    const unit = daftar
      .map((u) => ({
        ...bentukUnitPublik(u, rating.get(u.id)),
        kosong: !terisi.has(u.id),
        harga: rincianHarga(u.hargaPerHari, sewa.jumlahHari),
      }))
      // Kosong dulu, lalu harga terendah, sama dengan layar pencarian.
      .sort(
        (a, b) =>
          Number(b.kosong) - Number(a.kosong) ||
          a.hargaPerHari - b.hargaPerHari ||
          a.nama.localeCompare(b.nama),
      );

    return {
      sewa,
      area: q.area ?? null,
      jumlahUnit: unit.length,
      jumlahKosong: unit.filter((u) => u.kosong).length,
      unit,
    };
  }
}
