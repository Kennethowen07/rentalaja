import { Body, Controller, Param, Patch } from '@nestjs/common';
import { HanyaPeran, PenggunaSaatIni, type PenggunaToken } from '../auth/penjaga.js';
import { UbahUnitDto } from './dto/ubah-unit.dto.js';
import { UnitMitraService } from './unit-mitra.service.js';

/** Pengelolaan unit oleh penyedia. Unit mitra lain dijawab 404. */
@Controller('mitra/unit')
@HanyaPeran('MITRA')
export class UnitMitraController {
  constructor(private readonly unit: UnitMitraService) {}

  /** PATCH /mitra/unit/:id  { hargaPerHari?, servis?, sampai? }
   *  409 kalau servis bentrok dengan pesanan atau unit sedang disewa. */
  @Patch(':id')
  ubah(@PenggunaSaatIni() p: PenggunaToken, @Param('id') id: string, @Body() dto: UbahUnitDto) {
    return this.unit.ubah(p.id, id, dto);
  }
}
