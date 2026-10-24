import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

/**
 * Rentang sewa di query string: ?mulai=2026-10-28&durasi=5&jam=09.00.
 * Konvensinya sama dengan rentalaja-web/lib/sewa.ts.
 *
 * Bedanya disengaja: frontend memulihkan URL yang cacat secara diam-diam
 * (tanggal lampau jadi besok), sedangkan API menolaknya dengan 400. Halaman
 * boleh memaafkan URL yang diketik orang; API harus jujur kepada pemanggilnya.
 */
export class RentangSewaDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'mulai harus berformat YYYY-MM-DD.' })
  mulai!: string;

  @Type(() => Number)
  @IsInt({ message: 'durasi harus bilangan bulat.' })
  @Min(1, { message: 'durasi minimal 1 hari.' })
  @Max(60, { message: 'durasi maksimal 60 hari.' })
  durasi!: number;

  /** Jam ambil WITA. Kosong berarti 09.00, sama dengan form pemesanan. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}[.:]\d{2}$/, { message: 'jam harus berformat HH.mm, mis. 09.00.' })
  jam?: string;
}
