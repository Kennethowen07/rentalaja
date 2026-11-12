import { Body, Controller, Param, Post } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { BuatUlasanDto } from './dto/buat-ulasan.dto.js';
import { UlasanService } from './ulasan.service.js';

/** Sisi penyewa: mengulas pesanan sendiri yang sudah selesai. */
@Controller('pesanan')
export class UlasanController {
  constructor(private readonly ulasan: UlasanService) {}

  /** 201 saat tercatat, 409 kalau pesanan belum selesai atau sudah diulas. */
  @Post(':kode/ulasan')
  @HanyaPeran('PENYEWA')
  buat(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string, @Body() dto: BuatUlasanDto) {
    return this.ulasan.buat(p.id, kode, dto);
  }
}
