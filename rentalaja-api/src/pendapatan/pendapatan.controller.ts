import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { PeriodeDto, TarikSaldoDto } from './dto/pendapatan.dto.js';
import { UbahRekeningDto } from './dto/rekening.dto.js';
import { PendapatanService } from './pendapatan.service.js';
import { RekeningService } from './rekening.service.js';

/** Pendapatan, saldo, dan rekening penyedia. Hanya data mitra yang sedang login. */
@Controller('mitra')
@HanyaPeran('MITRA')
export class PendapatanController {
  constructor(
    private readonly pendapatan: PendapatanService,
    private readonly rekening: RekeningService,
  ) {}

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
   *  jumlah melebihi saldo, atau rekening belum diisi; 409 kalau rekening
   *  baru diubah dan masih dalam kunci 24 jam. */
  @Post('saldo/tarik')
  tarik(@PenggunaSaatIni() p: PenggunaToken, @Body() dto: TarikSaldoDto) {
    return this.pendapatan.tarik(p.id, dto);
  }

  /** Rekening tujuan tarik saldo, nomornya tersamar. null kalau belum diisi. */
  @Get('rekening')
  lihatRekening(@PenggunaSaatIni() p: PenggunaToken) {
    return this.rekening.lihat(p.id);
  }

  /** Isi atau ganti rekening: {bank, nomor, namaPemilik, kataSandi}.
   *  403 kalau kata sandi salah, 400 kalau nama tidak sama dengan nama akun. */
  @Put('rekening')
  ubahRekening(@PenggunaSaatIni() p: PenggunaToken, @Body() dto: UbahRekeningDto) {
    return this.rekening.ubah(p.id, dto);
  }
}
