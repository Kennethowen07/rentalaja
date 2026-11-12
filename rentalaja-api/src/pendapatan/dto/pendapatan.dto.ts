import { IsIn, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';

/** Tab periode di layar Pendapatan mitra. */
export const PERIODE = ['bulan-ini', 'bulan-lalu', 'tiga-bulan'] as const;
export type Periode = (typeof PERIODE)[number];

/** Batas satu pencairan: kolom pencairan.jumlah bertipe INTEGER Postgres.
 *  Saldo di atas ini ditarik bertahap, bukan dibiarkan jadi error 500. */
export const MAKS_PENCAIRAN = 2_147_483_647;

export class PeriodeDto {
  /** Kosong berarti bulan-ini. */
  @IsOptional()
  @IsIn(PERIODE, { message: `periode harus salah satu dari: ${PERIODE.join(', ')}.` })
  periode?: Periode;
}

export class TarikSaldoDto {
  /** Tidak dikirim berarti tarik seluruh saldo. Batas atasnya (tidak melebihi
   *  saldo) diperiksa service di dalam transaksi, bukan di sini. */
  // Sengaja tanpa @Type(() => Number): body-nya JSON, jadi angka sudah
  // angka. Konversi paksa membuat {jumlah: true} jadi 1 dan menarik Rp1.
  // Sengaja bukan @IsOptional: itu juga melewatkan null, dan {jumlah: null}
  // (mis. kolom isian yang kosong) lalu diam-diam menarik SELURUH saldo.
  @ValidateIf((_o, nilai) => nilai !== undefined)
  @IsInt({ message: 'jumlah harus bilangan bulat rupiah.' })
  @Min(1, { message: 'jumlah minimal Rp1.' })
  @Max(MAKS_PENCAIRAN, { message: `jumlah maksimal Rp${MAKS_PENCAIRAN} per pencairan.` })
  jumlah?: number;
}
