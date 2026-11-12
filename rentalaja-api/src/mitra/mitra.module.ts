import { Module } from '@nestjs/common';
import { MitraController } from './mitra.controller.js';
import { MitraService } from './mitra.service.js';
import { UnitMitraController } from './unit-mitra.controller.js';
import { UnitMitraService } from './unit-mitra.service.js';

@Module({
  controllers: [MitraController, UnitMitraController],
  providers: [MitraService, UnitMitraService],
  // Dipakai module lain (kalender, pendapatan) untuk menemukan mitra pengguna yang login.
  exports: [MitraService],
})
export class MitraModule {}
