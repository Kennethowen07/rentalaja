import { Module } from '@nestjs/common';
import { KembaliAwalController } from './kembali-awal.controller.js';
import { SerahTerimaController } from './serah-terima.controller.js';
import { SerahTerimaService } from './serah-terima.service.js';

/** Serah terima unit (antar/ambil, kondisi, foto), klaim kerusakan, dan
 *  persetujuan pengembalian lebih awal. */
@Module({
  controllers: [SerahTerimaController, KembaliAwalController],
  providers: [SerahTerimaService],
})
export class SerahTerimaModule {}
