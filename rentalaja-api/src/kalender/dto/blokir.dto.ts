import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Body POST /mitra/kalender/blokir. Satuannya hari kalender WITA, sama
 * dengan sel kalender: mulai dan selesai sama-sama termasuk, jadi
 * {mulai: "2026-11-20", selesai: "2026-11-20"} memblokir satu hari penuh.
 */
export class BuatBlokirDto {
  @IsString()
  @Length(1, 64)
  unitId!: string;

  @IsString()
  @Matches(TANGGAL, { message: 'mulai harus berformat YYYY-MM-DD.' })
  mulai!: string;

  @IsString()
  @Matches(TANGGAL, { message: 'selesai harus berformat YYYY-MM-DD.' })
  selesai!: string;

  /** Spasi di tepi dibuang; catatan yang tinggal kosong disimpan sebagai null. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(0, 200, { message: 'catatan paling panjang 200 karakter.' })
  catatan?: string;
}
