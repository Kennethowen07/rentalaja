import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { RentangSewaDto } from '../../umum/dto/rentang-sewa.dto.js';

export class CariDto extends RentangSewaDto {
  @IsOptional()
  @IsIn(['motor', 'mobil'], { message: 'kategori harus motor atau mobil.' })
  kategori?: 'motor' | 'mobil';

  /**
   * Area ANTAR yang diminta penyewa, bukan lokasi unit. Diterima dan
   * dikembalikan apa adanya, tapi belum menyaring hasil: belum ada data
   * jangkauan antar per penyedia. Menyaring berdasarkan lokasi unit akan
   * salah arti, karena unit di Kerobokan bisa saja diantar ke Canggu.
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;
}
