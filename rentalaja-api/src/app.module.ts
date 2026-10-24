import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { KalenderModule } from './kalender/kalender.module.js';
import { MitraModule } from './mitra/mitra.module.js';
import { PencarianModule } from './pencarian/pencarian.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UnitModule } from './unit/unit.module.js';

@Module({
  imports: [
    // Global: DATABASE_URL, JWT_SECRET, dan PORT dibaca dari .env di mana pun.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PencarianModule,
    UnitModule,
    MitraModule,
    KalenderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
