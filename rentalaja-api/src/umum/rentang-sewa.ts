import { BadRequestException } from '@nestjs/common';
import type { RentangSewaDto } from './dto/rentang-sewa.dto.js';
import { awalHariWita, bacaJam, dariIsoWita, HARI, JAM, MENIT } from './waktu-wita.js';

export const JAM_AMBIL_DEFAULT = '09.00';

export type RentangSewa = {
  mulai: Date;
  /** Tanggal unit dikembalikan: mulai + jumlahHari x 24 jam. */
  selesai: Date;
  jumlahHari: number;
};

/** Mengubah query yang sudah lolos DTO menjadi rentang waktu sungguhan.
 *  Yang tidak bisa diperiksa DTO (tanggal yang tidak ada, tanggal lampau)
 *  diperiksa di sini. Hari ini masih diterima. */
export function bacaRentangSewa(dto: RentangSewaDto, sekarang: number): RentangSewa {
  const hari = dariIsoWita(dto.mulai);
  if (hari === null) throw new BadRequestException(`Tanggal ${dto.mulai} tidak ada di kalender.`);
  if (hari < awalHariWita(sekarang)) throw new BadRequestException('Tanggal mulai sudah lewat.');

  const jam = bacaJam(dto.jam ?? JAM_AMBIL_DEFAULT);
  if (!jam) throw new BadRequestException('Jam ambil tidak valid.');

  const mulai = hari + jam[0] * JAM + jam[1] * MENIT;
  return {
    mulai: new Date(mulai),
    selesai: new Date(mulai + dto.durasi * HARI),
    jumlahHari: dto.durasi,
  };
}
