import { Controller, Get, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { FilterPesananDto } from './dto/filter-pesanan.dto.js';
import { MitraService } from './mitra.service.js';

/** Semua endpoint di sini hanya untuk pengguna berperan MITRA, dan hanya
 *  mengembalikan data milik mitra yang sedang login. */
@Controller('mitra')
@HanyaPeran('MITRA')
export class MitraController {
  constructor(private readonly mitra: MitraService) {}

  @Get('saya')
  saya(@PenggunaSaatIni() p: PenggunaToken) {
    return this.mitra.saya(p.id);
  }

  @Get('beranda')
  beranda(@PenggunaSaatIni() p: PenggunaToken) {
    return this.mitra.beranda(p.id);
  }

  @Get('unit')
  unit(@PenggunaSaatIni() p: PenggunaToken) {
    return this.mitra.daftarUnit(p.id);
  }

  /** GET /mitra/pesanan?status=menunggu */
  @Get('pesanan')
  pesanan(@PenggunaSaatIni() p: PenggunaToken, @Query() q: FilterPesananDto) {
    return this.mitra.daftarPesanan(p.id, q.status);
  }
}
