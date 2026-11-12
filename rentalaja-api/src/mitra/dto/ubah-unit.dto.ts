import { IsBoolean, IsInt, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';

/** Harga terendah per hari yang boleh dipasang penyedia. */
export const HARGA_MINIMUM = 10_000;

/** Batas atas hanya penjaga angka: total pesanan disimpan sebagai INTEGER
 *  Postgres (maks ~2,1 miliar), dan durasi sewa paling lama 60 hari, jadi
 *  25 juta x 60 hari + 3% biaya layanan masih muat. Bukan aturan bisnis. */
export const HARGA_MAKSIMUM = 25_000_000;

/** Seperti @IsOptional, tapi hanya field yang TIDAK DIKIRIM yang dilewati.
 *  null tetap divalidasi (dan ditolak 400): kalau dilewati, {hargaPerHari: null}
 *  sampai ke Prisma dan jadi 500, dan {servis: null} diam-diam mematikan servis. */
const BolehTidakDikirim = () => ValidateIf((_o, nilai) => nilai !== undefined);

/**
 * Body PATCH /mitra/unit/:id. Minimal satu dari hargaPerHari atau servis.
 * Keduanya boleh dikirim bersamaan.
 */
export class UbahUnitDto {
  /** Hanya berlaku untuk pesanan baru. Pesanan lama memakai harga yang
   *  dibekukan saat dipesan (trigger pesanan_beku). */
  @BolehTidakDikirim()
  @IsInt({ message: 'hargaPerHari harus bilangan bulat rupiah.' })
  @Min(HARGA_MINIMUM, { message: `hargaPerHari minimal Rp${HARGA_MINIMUM}.` })
  @Max(HARGA_MAKSIMUM, { message: `hargaPerHari maksimal Rp${HARGA_MAKSIMUM}.` })
  hargaPerHari?: number;

  /** true = mulai servis sekarang, false = akhiri servis. */
  @BolehTidakDikirim()
  @IsBoolean()
  servis?: boolean;

  /** Hari terakhir servis (WITA), termasuk. Hanya bersama servis=true.
   *  Kosong berarti sampai akhir hari lusa (2 hari dari hari ini). */
  @BolehTidakDikirim()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'sampai harus berformat YYYY-MM-DD.' })
  sampai?: string;
}
