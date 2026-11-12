import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { PeriodeDto, TarikSaldoDto } from './dto/pendapatan.dto.js';
import { PendapatanService } from './pendapatan.service.js';

/** Pendapatan dan saldo penyedia. Hanya data mitra yang sedang login. */
@Controller('mitra')
@HanyaPeran('MITRA')
export class PendapatanController {
  constructor(private readonly pendapatan: PendapatanService) {}

  /** GET /mitra/pendapatan?periode=bulan-ini|bulan-lalu|tiga-bulan */
  @Get('pendapatan')
  ringkasan(@PenggunaSaatIni() p: PenggunaToken, @Query() q: PeriodeDto) {
    return this.pendapatan.pendapatan(p.id, q.periode);
  }

  @Get('saldo')
  saldo(@PenggunaSaatIni() p: PenggunaToken) {
    return this.pendapatan.saldo(p.id);
  }

  /** Tarik seluruh saldo, atau {jumlah} kalau diisi. 400 kalau saldo kosong,
   *  jumlah melebihi saldo, atau rekening belum diisi. */
  @Post('saldo/tarik')
  tarik(@PenggunaSaatIni() p: PenggunaToken, @Body() dto: TarikSaldoDto) {
    return this.pendapatan.tarik(p.id, dto);
  }
}
