import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, WajibMasuk, type PenggunaToken } from '../auth/penjaga.js';
import { BuatPesananDto } from './dto/buat-pesanan.dto.js';
import { PesananService } from './pesanan.service.js';

@Controller('pesanan')
export class PesananController {
  constructor(private readonly pesanan: PesananService) {}

  /** Pesan dan bayar penuh. 409 kalau slotnya sudah terisi atau harganya
   *  berbeda dengan totalDisetujui. */
  @Post()
  @HanyaPeran('PENYEWA')
  buat(@PenggunaSaatIni() p: PenggunaToken, @Body() dto: BuatPesananDto) {
    return this.pesanan.buat(p.id, dto);
  }

  @Get()
  @HanyaPeran('PENYEWA')
  daftar(@PenggunaSaatIni() p: PenggunaToken) {
    return this.pesanan.daftarMilikPenyewa(p.id);
  }

  /** Penyewa pemesan atau mitra pemilik unit. Selain itu 404. */
  @Get(':kode')
  @WajibMasuk()
  detail(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.pesanan.detail(p, kode);
  }

  @Post(':kode/batal')
  @HttpCode(200)
  @HanyaPeran('PENYEWA')
  batal(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.pesanan.batal(p, kode);
  }
}
