import { Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { PenggunaSaatIni, WajibMasuk, type PenggunaToken } from '../auth/penjaga.js';
import { SerahTerimaService } from './serah-terima.service.js';

/**
 * Persetujuan pengembalian lebih awal. Satu path untuk kedua pihak: penyewa
 * pemesan dan mitra pemilik unit masing-masing mengisi persetujuannya
 * sendiri (peran dari token). Pesanan orang lain dijawab 404.
 */
@Controller('pesanan')
@WajibMasuk()
export class KembaliAwalController {
  constructor(private readonly serahTerima: SerahTerimaService) {}

  @Post(':kode/kembali-awal')
  @HttpCode(200)
  setuju(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.serahTerima.setujuKembaliAwal(p, kode);
  }

  @Delete(':kode/kembali-awal')
  batal(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.serahTerima.batalKembaliAwal(p, kode);
  }
}
