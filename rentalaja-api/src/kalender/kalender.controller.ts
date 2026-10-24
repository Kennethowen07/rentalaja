import { Controller, Get, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { KalenderDto } from './dto/kalender.dto.js';
import { KalenderService } from './kalender.service.js';

@Controller('mitra/kalender')
@HanyaPeran('MITRA')
export class KalenderController {
  constructor(private readonly kalender: KalenderService) {}

  /** GET /mitra/kalender?mulai=2026-10-24&hari=14 */
  @Get()
  lihat(@PenggunaSaatIni() p: PenggunaToken, @Query() q: KalenderDto) {
    return this.kalender.kalender(p.id, q);
  }
}
