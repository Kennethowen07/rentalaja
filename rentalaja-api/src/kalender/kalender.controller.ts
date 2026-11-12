import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { BuatBlokirDto } from './dto/blokir.dto.js';
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

  /** Blokir manual. 409 kalau menimpa tanggal yang sudah ada pesanannya,
   *  404 kalau unitnya bukan milik mitra ini. */
  @Post('blokir')
  blokir(@PenggunaSaatIni() p: PenggunaToken, @Body() dto: BuatBlokirDto) {
    return this.kalender.buatBlokir(p.id, dto);
  }

  @Delete('blokir/:id')
  @HttpCode(204)
  async hapusBlokir(@PenggunaSaatIni() p: PenggunaToken, @Param('id') id: string) {
    await this.kalender.hapusBlokir(p.id, id);
  }
}
