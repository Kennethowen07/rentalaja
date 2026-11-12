import { IsIn, IsString, Length } from 'class-validator';

export const JENIS_SERAH = ['antar', 'ambil'] as const;
export type JenisSerahTampil = (typeof JENIS_SERAH)[number];

/** Parameter path /mitra/serah-terima/:kode/:jenis. */
export class ParamSerahTerimaDto {
  @IsString()
  @Length(1, 40)
  kode!: string;

  @IsIn(JENIS_SERAH, { message: `jenis harus salah satu dari: ${JENIS_SERAH.join(', ')}.` })
  jenis!: JenisSerahTampil;
}
