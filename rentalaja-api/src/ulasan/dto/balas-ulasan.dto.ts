import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

/** Body POST /mitra/ulasan/:id/balas. */
export class BalasUlasanDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 1000, { message: 'balasan harus 1 sampai 1000 karakter.' })
  balasan!: string;
}
