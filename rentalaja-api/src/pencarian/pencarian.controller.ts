import { Controller, Get, Query } from '@nestjs/common';
import { CariDto } from './dto/cari.dto.js';
import { PencarianService } from './pencarian.service.js';

@Controller('pencarian')
export class PencarianController {
  constructor(private readonly pencarian: PencarianService) {}

  /** GET /pencarian?mulai=2026-10-28&durasi=3&kategori=motor */
  @Get()
  cari(@Query() q: CariDto) {
    return this.pencarian.cari(q);
  }
}
