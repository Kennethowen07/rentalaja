import { BadRequestException, Injectable } from '@nestjs/common';
import { MitraService } from '../mitra/mitra.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { okupansi, type JenisOkupansi } from '../umum/ketersediaan.js';
import { awalHariWita, dariIsoWita, HARI, keIsoWita } from '../umum/waktu-wita.js';
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

    const units = await this.prisma.unit.findMany({
      where: { mitraId: mitra.id },
      select: { id: true, nama: true, plat: true },
      orderBy: [{ nama: 'asc' }, { plat: 'asc' }],
    });
    const isi = await okupansi(
      this.prisma,
      units.map((u) => u.id),
      new Date(awal),
      new Date(akhir),
      sekarang,
    );

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
          return {
            tanggal: keIsoWita(d),
            keadaan: menang?.keadaan ?? ('kosong' as const),
            kodePesanan: sumber?.kodePesanan ?? null,
          };
        }),
      })),
    };
  }
}
