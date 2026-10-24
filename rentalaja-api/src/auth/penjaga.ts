/**
 * Penjaga endpoint: siapa yang login (JWT) dan apa perannya.
 *
 * Pemakaian di controller:
 *   @HanyaPeran('MITRA')
 *   @Get('beranda')
 *   beranda(@PenggunaSaatIni() p: PenggunaToken) { ... }
 */

import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Peran } from '../generated/prisma/enums.js';

/** Isi token yang sudah diverifikasi. */
export type PenggunaToken = { id: string; peran: Peran };

type RequestBerpengguna = Request & { pengguna?: PenggunaToken };

const KUNCI_PERAN = 'peran-diizinkan';

@Injectable()
export class PenjagaJwt implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestBerpengguna>();
    const [skema, token] = (req.headers.authorization ?? '').split(' ');
    if (skema !== 'Bearer' || !token) {
      throw new UnauthorizedException('Masuk dulu untuk membuka halaman ini.');
    }
    try {
      const isi = await this.jwt.verifyAsync<{ sub: string; peran: Peran }>(token);
      req.pengguna = { id: isi.sub, peran: isi.peran };
      return true;
    } catch {
      throw new UnauthorizedException('Sesi tidak berlaku. Silakan masuk lagi.');
    }
  }
}

@Injectable()
export class PenjagaPeran implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const diizinkan = this.reflector.getAllAndOverride<Peran[] | undefined>(KUNCI_PERAN, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!diizinkan) return true;
    const { pengguna } = ctx.switchToHttp().getRequest<RequestBerpengguna>();
    if (!pengguna || !diizinkan.includes(pengguna.peran)) {
      throw new ForbiddenException('Akun ini tidak punya akses ke halaman ini.');
    }
    return true;
  }
}

/** Wajib login, tanpa syarat peran. */
export const WajibMasuk = () => UseGuards(PenjagaJwt);

/** Wajib login DAN berperan tertentu. 401 kalau belum login, 403 kalau
 *  perannya salah, supaya klien bisa membedakan keduanya. */
export const HanyaPeran = (...peran: Peran[]) =>
  applyDecorators(SetMetadata(KUNCI_PERAN, peran), UseGuards(PenjagaJwt, PenjagaPeran));

export const PenggunaSaatIni = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const p = ctx.switchToHttp().getRequest<RequestBerpengguna>().pengguna;
  if (!p) throw new UnauthorizedException();
  return p;
});
