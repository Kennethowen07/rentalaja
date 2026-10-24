import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { PesananService } from './pesanan.service.js';

/** Balasan penyedia untuk pesanan yang menunggu. Hanya untuk unit miliknya;
 *  pesanan mitra lain dijawab 404. */
@Controller('mitra/pesanan')
@HanyaPeran('MITRA')
export class MitraPesananController {
  constructor(private readonly pesanan: PesananService) {}

  @Post(':kode/terima')
  @HttpCode(200)
  terima(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.pesanan.terima(p, kode);
  }

  /** Dana penyewa otomatis tercatat dikembalikan (status dana diturunkan). */
  @Post(':kode/tolak')
  @HttpCode(200)
  tolak(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.pesanan.tolak(p, kode);
  }
}
