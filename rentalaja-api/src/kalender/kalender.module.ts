import { Module } from '@nestjs/common';
import { MitraModule } from '../mitra/mitra.module.js';
import { KalenderController } from './kalender.controller.js';
import { KalenderService } from './kalender.service.js';

@Module({
  imports: [MitraModule],
  controllers: [KalenderController],
  providers: [KalenderService],
})
export class KalenderModule {}
