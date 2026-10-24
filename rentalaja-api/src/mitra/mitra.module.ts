import { Module } from '@nestjs/common';
import { MitraController } from './mitra.controller.js';
import { MitraService } from './mitra.service.js';

@Module({
  controllers: [MitraController],
  providers: [MitraService],
  // Dipakai module lain (kalender) untuk menemukan mitra pengguna yang login.
  exports: [MitraService],
})
export class MitraModule {}
