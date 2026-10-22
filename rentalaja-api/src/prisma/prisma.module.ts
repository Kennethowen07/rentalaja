import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/** Global supaya setiap module bisa menyuntikkan PrismaService tanpa
 *  mengimpor PrismaModule satu per satu. Hanya ada satu koneksi pool. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
