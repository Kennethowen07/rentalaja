import { Module } from '@nestjs/common';
import { MitraUlasanController } from './mitra-ulasan.controller.js';
import { UlasanController } from './ulasan.controller.js';
import { UlasanService } from './ulasan.service.js';

/** Ulasan penyewa atas pesanan selesai dan balasan penyedia. */
@Module({
  controllers: [UlasanController, MitraUlasanController],
  providers: [UlasanService],
})
export class UlasanModule {}
