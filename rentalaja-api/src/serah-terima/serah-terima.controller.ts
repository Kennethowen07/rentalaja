import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { CatatSerahTerimaDto } from './dto/catat-serah-terima.dto.js';
import { FilterSerahTerimaDto } from './dto/filter-serah-terima.dto.js';
import { ParamSerahTerimaDto } from './dto/param-serah-terima.dto.js';
import { SerahTerimaService } from './serah-terima.service.js';

/** Serah terima dan klaim kerusakan, hanya untuk mitra pemilik unit.
 *  Pesanan milik mitra lain dijawab 404. */
@Controller('mitra')
@HanyaPeran('MITRA')
export class SerahTerimaController {
  constructor(private readonly serahTerima: SerahTerimaService) {}

  /** GET /mitra/serah-terima?tab=hari-ini|menunggu-foto|selesai */
  @Get('serah-terima')
  daftar(@PenggunaSaatIni() p: PenggunaToken, @Query() q: FilterSerahTerimaDto) {
    return this.serahTerima.daftar(p.id, q.tab);
  }

  /** PUT /mitra/serah-terima/RA-284102/antar. Idempoten per (pesanan, jenis). */
  @Put('serah-terima/:kode/:jenis')
  catat(
    @PenggunaSaatIni() p: PenggunaToken,
    @Param() param: ParamSerahTerimaDto,
    @Body() dto: CatatSerahTerimaDto,
  ) {
    return this.serahTerima.catat(p.id, param.kode, param.jenis, dto);
  }

  /** Tandai klaim kerusakan selesai; dana lalu dilepas sesuai jadwalnya. */
  @Post('klaim/:kode/selesai')
  @HttpCode(200)
  selesaikanKlaim(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.serahTerima.selesaikanKlaim(p.id, kode);
  }
}
