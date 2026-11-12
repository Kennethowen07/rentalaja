import { IsIn, IsOptional } from 'class-validator';

/** Tab di layar Serah terima, sama dengan rentalaja-web/lib/mitra/tab-serah.ts.
 *  Tiap tab memuat satu status jadwal. */
export const TAB_SERAH = ['hari-ini', 'menunggu-foto', 'selesai'] as const;
export type TabSerah = (typeof TAB_SERAH)[number];

export class FilterSerahTerimaDto {
  /** Kosong berarti "hari-ini", sama dengan frontend. */
  @IsOptional()
  @IsIn(TAB_SERAH, { message: `tab harus salah satu dari: ${TAB_SERAH.join(', ')}.` })
  tab?: TabSerah;
}
