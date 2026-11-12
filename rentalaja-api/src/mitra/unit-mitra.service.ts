import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { adalahSlotTerisi } from '../prisma/kesalahan-db.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { awalHariWita, dariIsoWita, HARI } from '../umum/waktu-wita.js';
import type { UbahUnitDto } from './dto/ubah-unit.dto.js';
import { MitraService } from './mitra.service.js';

/** Servis tanpa tanggal: hari ini, besok, dan lusa (sampai tengah malam WITA). */
const HARI_SERVIS_DEFAULT = 2;

@Injectable()
export class UnitMitraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mitra: MitraService,
  ) {}

  /**
   * Ubah harga dan/atau status servis satu unit milik mitra ini.
   *
   * Harga: hanya unit yang diubah. Pesanan yang sudah ada menyimpan harga
   * bekunya sendiri (dijaga trigger pesanan_beku), jadi tidak ikut berubah.
   *
   * Servis: dicatat sebagai BlokirUnit SERVIS mulai sekarang. Bentrok dengan
   * pesanan ditolak database (trigger blokir_jaga_slot, SQLSTATE 23P01),
   * bukan dicek dulu di sini, supaya pesanan yang masuk bersamaan tetap aman.
   * Yang dicek di sini hanya unit yang masih di tangan penyewa padahal jadwal
   * kembalinya sudah lewat (telat): rentang pesanannya sudah berakhir, jadi
   * trigger tidak melihatnya.
   *
   * Semua tulisan berjalan setelah baris unit dikunci (FOR UPDATE, kunci yang
   * sama dengan trigger slot). Tanpa itu dua PATCH servis bersamaan sama-sama
   * tidak melihat servis yang lain, dan unit berakhir dengan dua jadwal servis.
   */
  async ubah(penggunaId: string, unitId: string, dto: UbahUnitDto) {
    if (dto.hargaPerHari === undefined && dto.servis === undefined) {
      throw new BadRequestException('Kirim hargaPerHari atau servis.');
    }
    if (dto.sampai !== undefined && dto.servis !== true) {
      throw new BadRequestException('sampai hanya dipakai bersama servis=true.');
    }

    const mitra = await this.mitra.milik(penggunaId);
    // 404 juga untuk unit mitra lain, supaya id unit orang lain tidak bocor.
    const unit = await this.prisma.unit.findFirst({ where: { id: unitId, mitraId: mitra.id }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan.');

    const sekarang = Date.now();
    let akhirServis = 0;
    if (dto.servis === true) {
      if (dto.sampai !== undefined) {
        const hari = dariIsoWita(dto.sampai);
        if (hari === null) throw new BadRequestException(`Tanggal ${dto.sampai} tidak ada di kalender.`);
        akhirServis = hari + HARI;
      } else {
        akhirServis = awalHariWita(sekarang) + (HARI_SERVIS_DEFAULT + 1) * HARI;
      }
      if (akhirServis <= sekarang) throw new BadRequestException('Tanggal selesai servis sudah lewat.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 FROM unit WHERE id = ${unitId} FOR UPDATE`;

        if (dto.servis === true) {
          // Dicek setelah kunci: menerima pesanan juga mengunci baris unit
          // lewat trigger, jadi hasilnya tidak bisa basi di tengah jalan.
          const keluar = await tx.pesanan.findFirst({
            where: { unitId, status: 'BERJALAN', kembaliPada: null, mulai: { lte: new Date(sekarang) } },
            select: { kode: true },
          });
          if (keluar) {
            throw new ConflictException(
              `Unit sedang disewa (pesanan ${keluar.kode}). Catat unit kembali dulu sebelum servis.`,
            );
          }
        }
        if (dto.hargaPerHari !== undefined) {
          await tx.unit.update({ where: { id: unitId }, data: { hargaPerHari: dto.hargaPerHari } });
        }
        if (dto.servis !== undefined) {
          // Satu unit hanya punya satu jadwal servis ke depan. Bagian yang
          // sudah lewat tetap disimpan sebagai riwayat, supaya kalender
          // hari-hari kemarin tetap menunjukkan servis: servis yang sedang
          // berjalan diubah tanggal selesainya (diperpanjang/dipendekkan, atau
          // dipotong sampai sekarang kalau servis=false), tidak dihapus.
          // Waktu dibaca lagi setelah kunci, karena request ini mungkin
          // menunggu PATCH lain selesai lebih dulu.
          const kini = new Date();
          await tx.blokirUnit.deleteMany({ where: { unitId, jenis: 'SERVIS', mulai: { gte: kini } } });
          const { count: berjalan } = await tx.blokirUnit.updateMany({
            where: { unitId, jenis: 'SERVIS', mulai: { lt: kini }, selesai: { gt: kini } },
            data: { selesai: dto.servis ? new Date(akhirServis) : kini },
          });
          if (dto.servis && berjalan === 0) {
            await tx.blokirUnit.create({
              data: { unitId, jenis: 'SERVIS', mulai: kini, selesai: new Date(akhirServis) },
            });
          }
        }
      });
    } catch (e) {
      if (adalahSlotTerisi(e)) {
        throw new ConflictException(
          'Unit sudah dipesan di rentang servis itu. Pilih tanggal selesai servis yang lebih awal.',
        );
      }
      throw e;
    }

    // Bentuk jawabannya sama dengan satu baris GET /mitra/unit.
    const daftar = await this.mitra.daftarUnit(penggunaId);
    return daftar.find((u) => u.id === unitId)!;
  }
}
