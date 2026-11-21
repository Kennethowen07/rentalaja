import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { KODE_BANK } from '../../umum/rekening.js';

const rapikan = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Body PUT /mitra/rekening. Semua wajib; tidak ada ubah sebagian. */
export class UbahRekeningDto {
  @IsIn(KODE_BANK, { message: `bank harus salah satu dari: ${KODE_BANK.join(', ')}.` })
  bank!: string;

  /** Spasi dan tanda hubung dibuang dulu ("123-456 4471" boleh diketik). */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
  @IsString({ message: 'nomor harus berupa teks angka.' })
  @Matches(/^[0-9]{8,18}$/, { message: 'nomor rekening harus 8 sampai 18 angka.' })
  nomor!: string;

  /** Nama pemilik rekening persis seperti di buku tabungan. Harus sama
   *  dengan nama akun (dicek service). */
  @Transform(rapikan)
  @IsString({ message: 'namaPemilik harus berupa teks.' })
  @MinLength(2, { message: 'namaPemilik minimal 2 karakter.' })
  @MaxLength(100, { message: 'namaPemilik maksimal 100 karakter.' })
  namaPemilik!: string;

  /** Konfirmasi ulang. Batas 72: bcrypt hanya membaca 72 byte pertama. */
  @IsString({ message: 'kataSandi wajib diisi.' })
  @MinLength(1, { message: 'kataSandi wajib diisi.' })
  @MaxLength(72)
  kataSandi!: string;
}
