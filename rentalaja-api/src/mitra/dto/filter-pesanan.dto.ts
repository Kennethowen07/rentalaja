import { IsIn, IsOptional } from 'class-validator';

/** Tab di layar Pesanan mitra. Pengelompokannya memakai status TURUNAN,
 *  jadi pesanan menunggu yang kedaluwarsa otomatis pindah ke "batal". */
export const KELOMPOK_PESANAN = ['menunggu', 'berjalan', 'selesai', 'batal'] as const;
export type KelompokPesanan = (typeof KELOMPOK_PESANAN)[number];

export class FilterPesananDto {
  @IsOptional()
  @IsIn(KELOMPOK_PESANAN, { message: `status harus salah satu dari: ${KELOMPOK_PESANAN.join(', ')}.` })
  status?: KelompokPesanan;
}
