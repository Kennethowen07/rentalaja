import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

/** 1 sampai 5 dengan langkah 0,5. Database menjaga hal yang sama lewat CHECK
 *  ulasan_skor_setengah_bintang; ini supaya klien mendapat 400 yang jelas. */
export const SKOR_SAH = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

/** Body POST /pesanan/:kode/ulasan. */
export class BuatUlasanDto {
  @IsIn(SKOR_SAH, { message: 'skor harus 1 sampai 5 dengan langkah 0,5.' })
  skor!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 2000, { message: 'isi ulasan harus 3 sampai 2000 karakter.' })
  isi!: string;
}
