import { Module } from '@nestjs/common';
import { PencarianController } from './pencarian.controller.js';
import { PencarianService } from './pencarian.service.js';

@Module({
  controllers: [PencarianController],
  providers: [PencarianService],
})
export class PencarianModule {}
