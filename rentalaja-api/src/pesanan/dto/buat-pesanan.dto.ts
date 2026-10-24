import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsString, Length, Min } from 'class-validator';
import { RentangSewaDto } from '../../umum/dto/rentang-sewa.dto.js';

export const METODE_BAYAR = ['BCA_VA', 'QRIS', 'EWALLET'] as const;

/**
 * Body POST /pesanan. Rentang sewanya memakai aturan yang sama dengan
 * pencarian (mulai, durasi, jam), jadi unit yang tampil kosong di pencarian
 * dipesan dengan rentang yang persis sama.
 */
export class BuatPesananDto extends RentangSewaDto {
  /** Slug unit, sama dengan yang ada di URL /unit/:slug. */
  @IsString()
  @Length(1, 120)
  unit!: string;

  /** true = diantar ke titik, false = ambil sendiri di rental. */
  @IsBoolean()
  diantar!: boolean;

  /** Alamat antar, atau nama tempat ambil. Spasi di tepi dibuang sebelum
   *  panjangnya diperiksa, supaya "   " tidak lolos sebagai alamat. */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 200, { message: 'titik harus 3 sampai 200 karakter.' })
  titik!: string;

  @IsIn(METODE_BAYAR, { message: `metode harus salah satu dari ${METODE_BAYAR.join(', ')}.` })
  metode!: (typeof METODE_BAYAR)[number];

  /**
   * Total yang terakhir dilihat penyewa di layar. Bukan sumber harga: server
   * tetap menghitung sendiri, lalu menolak kalau angkanya berbeda (misalnya
   * penyedia baru saja mengubah harga). Tanpa ini penyewa bisa ditagih angka
   * yang tidak pernah ia lihat.
   */
  @IsInt()
  @Min(1)
  totalDisetujui!: number;
}
