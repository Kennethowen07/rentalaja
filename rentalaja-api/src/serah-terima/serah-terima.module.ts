import { Module } from '@nestjs/common';
import { SerahTerimaController } from './serah-terima.controller.js';
import { SerahTerimaService } from './serah-terima.service.js';

/** Serah terima unit (antar/ambil, kondisi, foto) dan klaim kerusakan. */
@Module({
  controllers: [SerahTerimaController],
  providers: [SerahTerimaService],
})
export class SerahTerimaModule {}
