import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

export type Kesehatan = { status: 'ok' | 'gagal'; database: 'ok' | 'gagal' };

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /** Benar-benar bertanya ke database, bukan sekadar menjawab "hidup".
   *  Server yang jalan tapi tidak bisa menjangkau Postgres dilaporkan gagal. */
  async cekKesehatan(): Promise<Kesehatan> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      return { status: 'gagal', database: 'gagal' };
    }
  }
}
