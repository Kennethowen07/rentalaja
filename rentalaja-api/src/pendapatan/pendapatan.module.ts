import { Module } from '@nestjs/common';
import { MitraModule } from '../mitra/mitra.module.js';
import { PendapatanController } from './pendapatan.controller.js';
import { PendapatanService } from './pendapatan.service.js';
import { RekeningService } from './rekening.service.js';

/** Pendapatan penyedia: saldo turunan, rekening, dan tarik saldo (pencairan). */
@Module({
  imports: [MitraModule],
  controllers: [PendapatanController],
  providers: [PendapatanService, RekeningService],
})
export class PendapatanModule {}
