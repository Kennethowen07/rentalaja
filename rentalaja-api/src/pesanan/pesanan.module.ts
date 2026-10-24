import { Module } from '@nestjs/common';
import { MitraPesananController } from './mitra-pesanan.controller.js';
import { PesananController } from './pesanan.controller.js';
import { PesananService } from './pesanan.service.js';

@Module({
  controllers: [PesananController, MitraPesananController],
  providers: [PesananService],
})
export class PesananModule {}
