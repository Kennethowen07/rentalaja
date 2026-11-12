import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

/** Body POST /chat/:kode. */
export class KirimPesanDto {
  /** Spasi dan baris kosong di tepi dibuang dulu, jadi pesan berisi spasi
   *  saja ditolak. Batasnya sama dengan CHECK pesan_chat_isi_valid.
   *  Karakter NUL ditolak di sini karena PostgreSQL tidak bisa menyimpannya
   *  di kolom teks (tanpa ini jawabannya 500). */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 2000, { message: 'isi pesan harus 1 sampai 2000 karakter.' })
  @Matches(/^[^\0]*$/, { message: 'isi pesan tidak boleh berisi karakter NUL.' })
  isi!: string;
}
