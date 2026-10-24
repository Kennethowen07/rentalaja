import { Controller, Get, Param, Query } from '@nestjs/common';
import { RentangSewaDto } from '../umum/dto/rentang-sewa.dto.js';
import { UnitService } from './unit.service.js';

@Controller('unit')
export class UnitController {
  constructor(private readonly unit: UnitService) {}

  /** GET /unit/honda-scoopy-2023?mulai=2026-10-28&durasi=3 */
  @Get(':slug')
  detail(@Param('slug') slug: string, @Query() q: RentangSewaDto) {
    return this.unit.detail(slug, q);
  }
}
