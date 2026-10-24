import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class MasukDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email tidak valid.' })
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Kata sandi wajib diisi.' })
  // bcrypt hanya membaca 72 byte pertama; batas ini juga mencegah kiriman
  // raksasa yang sengaja membuat hashing lambat.
  @MaxLength(72)
  kataSandi!: string;
}
