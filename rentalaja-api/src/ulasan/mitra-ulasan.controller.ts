import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { BalasUlasanDto } from './dto/balas-ulasan.dto.js';
import { UlasanService } from './ulasan.service.js';

/** Sisi penyedia: membaca dan membalas ulasan unit miliknya. */
@Controller('mitra/ulasan')
@HanyaPeran('MITRA')
export class MitraUlasanController {
  constructor(private readonly ulasan: UlasanService) {}

  @Get()
  daftar(@PenggunaSaatIni() p: PenggunaToken) {
    return this.ulasan.daftarMilikMitra(p.id);
  }

  /** Balasan boleh diubah; kiriman berikutnya menimpa yang lama. */
  @Post(':id/balas')
  @HttpCode(200)
  balas(@PenggunaSaatIni() p: PenggunaToken, @Param('id') id: string, @Body() dto: BalasUlasanDto) {
    return this.ulasan.balas(p.id, id, dto);
  }
}
