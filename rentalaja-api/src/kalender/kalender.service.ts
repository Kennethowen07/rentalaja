import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MitraService } from '../mitra/mitra.service.js';
import { adalahSlotTerisi } from '../prisma/kesalahan-db.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { okupansi, type JenisOkupansi } from '../umum/ketersediaan.js';
import { awalHariWita, dariIsoWita, HARI, keIsoWita } from '../umum/waktu-wita.js';
import type { BuatBlokirDto } from './dto/blokir.dto.js';
import type { KalenderDto } from './dto/kalender.dto.js';

export type KeadaanSel = 'disewa' | 'telat' | 'dipesan' | 'diblokir' | 'servis' | 'kosong';

/** Urutan menang status sel, sesuai backend.md bagian 4 dan frontend:
 *  pesanan berjalan, lewat jadwal, pesanan menunggu, blokir manual, servis. */
const URUTAN: { jenis: JenisOkupansi; keadaan: KeadaanSel }[] = [
  { jenis: 'berjalan', keadaan: 'disewa' },
  { jenis: 'telat', keadaan: 'telat' },
  { jenis: 'menunggu', keadaan: 'dipesan' },
  { jenis: 'manual', keadaan: 'diblokir' },
  { jenis: 'servis', keadaan: 'servis' },
];

const HARI_DEFAULT = 14;

/** Batas akhir kalender: lewat tahun 9999, toISOString() menulis tahun enam
 *  digit ("+010000-01-01") dan tanggal di jawaban jadi rusak. */
const AKHIR_KALENDER = dariIsoWita('9999-12-31')! + HARI;

@Injectable()
export class KalenderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mitra: MitraService,
  ) {}

  async kalender(penggunaId: string, q: KalenderDto) {
    const mitra = await this.mitra.milik(penggunaId);
    const sekarang = Date.now();

    const awal = q.mulai ? dariIsoWita(q.mulai) : awalHariWita(sekarang);
    if (awal === null) throw new BadRequestException(`Tanggal ${q.mulai} tidak ada di kalender.`);
    const jumlahHari = q.hari ?? HARI_DEFAULT;
    const akhir = awal + jumlahHari * HARI;
    if (akhir > AKHIR_KALENDER) throw new BadRequestException('Kalender paling jauh sampai 9999-12-31.');

    const units = await this.prisma.unit.findMany({
      where: { mitraId: mitra.id },
      select: { id: true, nama: true, plat: true },
      orderBy: [{ nama: 'asc' }, { plat: 'asc' }],
    });
    const unitIds = units.map((u) => u.id);
    const [isi, daftarBlokir] = await Promise.all([
      okupansi(this.prisma, unitIds, new Date(awal), new Date(akhir), sekarang),
      // okupansi() tidak membawa id blokir. Tanpa id, sel yang diblokir
      // tidak bisa dibuka lagi lewat DELETE /mitra/kalender/blokir/:id.
      this.prisma.blokirUnit.findMany({
        where: { unitId: { in: unitIds }, mulai: { lt: new Date(akhir) }, selesai: { gt: new Date(awal) } },
        select: { id: true, unitId: true, jenis: true, mulai: true, selesai: true },
        orderBy: [{ mulai: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const hari = Array.from({ length: jumlahHari }, (_, i) => awal + i * HARI);

    return {
      mulai: keIsoWita(awal),
      hari: hari.map(keIsoWita),
      unit: units.map((u) => ({
        ...u,
        sel: hari.map((d) => {
          const diHariIni = isi.filter((o) => o.unitId === u.id && o.mulai < d + HARI && o.selesai > d);
          const menang = URUTAN.find((r) => diHariIni.some((o) => o.jenis === r.jenis));
          const sumber = menang && diHariIni.find((o) => o.jenis === menang.jenis);
          // Hanya sel yang dimenangkan blokir yang membawa id blokir; sel
          // pesanan tetap pesanan walau ada blokir di bawahnya.
          const jenisBlokir = menang?.jenis === 'manual' ? 'MANUAL' : menang?.jenis === 'servis' ? 'SERVIS' : null;
          const blokir = jenisBlokir
            ? daftarBlokir.find(
                (b) => b.unitId === u.id && b.jenis === jenisBlokir && b.mulai.getTime() < d + HARI && b.selesai.getTime() > d,
              )
            : undefined;
          return {
            tanggal: keIsoWita(d),
            keadaan: menang?.keadaan ?? ('kosong' as const),
            kodePesanan: sumber?.kodePesanan ?? null,
            blokirId: blokir?.id ?? null,
          };
        }),
      })),
    };
  }

  /**
   * Blokir manual satu unit dari awal hari `mulai` sampai akhir hari
   * `selesai` (WITA). Bentrok dengan pesanan ditolak database (trigger
   * blokir_jaga_slot, SQLSTATE 23P01), tidak dicek dulu di sini: pesanan
   * yang masuk di detik yang sama tetap tidak bisa tertimpa.
   */
  async buatBlokir(penggunaId: string, dto: BuatBlokirDto) {
    const mitra = await this.mitra.milik(penggunaId);
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, mitraId: mitra.id },
      select: { id: true },
    });
    // 404 juga untuk unit mitra lain, supaya id unit orang lain tidak bocor.
    if (!unit) throw new NotFoundException('Unit tidak ditemukan.');

    const mulai = dariIsoWita(dto.mulai);
    if (mulai === null) throw new BadRequestException(`Tanggal ${dto.mulai} tidak ada di kalender.`);
    const hariSelesai = dariIsoWita(dto.selesai);
    if (hariSelesai === null) throw new BadRequestException(`Tanggal ${dto.selesai} tidak ada di kalender.`);
    if (hariSelesai < mulai) throw new BadRequestException('selesai tidak boleh sebelum mulai.');
    const selesai = hariSelesai + HARI;
    if (selesai <= Date.now()) throw new BadRequestException('Tanggal blokir sudah lewat.');

    try {
      const b = await this.prisma.blokirUnit.create({
        data: {
          unitId: unit.id,
          jenis: 'MANUAL',
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          catatan: dto.catatan || null,
        },
      });
      return {
        id: b.id,
        unitId: b.unitId,
        jenis: b.jenis,
        mulai: b.mulai,
        selesai: b.selesai,
        /** Hari pertama dan terakhir yang diblokir (WITA), keduanya termasuk. */
        tanggalMulai: keIsoWita(b.mulai.getTime()),
        tanggalSelesai: keIsoWita(b.selesai.getTime() - 1),
        catatan: b.catatan,
      };
    } catch (e) {
      if (adalahSlotTerisi(e)) {
        throw new ConflictException('Blokir tidak bisa menimpa tanggal yang sudah ada pesanannya.');
      }
      throw e;
    }
  }

  /** Hapus blokir milik mitra ini. Menghapus hanya membebaskan slot, jadi
   *  tidak ada aturan slot yang bisa dilanggar. Blokir mitra lain: 404. */
  async hapusBlokir(penggunaId: string, id: string) {
    const mitra = await this.mitra.milik(penggunaId);
    const { count } = await this.prisma.blokirUnit.deleteMany({
      where: { id, unit: { mitraId: mitra.id } },
    });
    if (count === 0) throw new NotFoundException('Blokir tidak ditemukan.');
  }
}
