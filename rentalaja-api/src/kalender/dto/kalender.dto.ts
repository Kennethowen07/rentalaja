import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class KalenderDto {
  /** Hari pertama kalender. Kosong berarti hari ini (WITA). Boleh di masa
   *  lalu: penyedia perlu melihat riwayat. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'mulai harus berformat YYYY-MM-DD.' })
  mulai?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31, { message: 'Kalender paling panjang 31 hari sekali minta.' })
  hari?: number;
}
