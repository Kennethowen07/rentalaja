import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ChatModule } from './chat/chat.module.js';
import { KalenderModule } from './kalender/kalender.module.js';
import { MitraModule } from './mitra/mitra.module.js';
import { PencarianModule } from './pencarian/pencarian.module.js';
import { PendapatanModule } from './pendapatan/pendapatan.module.js';
import { PesananModule } from './pesanan/pesanan.module.js';
import { FilterKesalahanDb } from './prisma/filter-kesalahan-db.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SerahTerimaModule } from './serah-terima/serah-terima.module.js';
import { UlasanModule } from './ulasan/ulasan.module.js';
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
    PesananModule,
    SerahTerimaModule,
    UlasanModule,
    PendapatanModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // NUL di parameter URL dijawab 400, bukan 500. Lihat filter-kesalahan-db.ts.
    { provide: APP_FILTER, useClass: FilterKesalahanDb },
  ],
})
export class AppModule {}
