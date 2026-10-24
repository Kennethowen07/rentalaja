import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { MasukDto } from './dto/masuk.dto.js';
import { PenggunaSaatIni, WajibMasuk, type PenggunaToken } from './penjaga.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 200, bukan 201: masuk tidak membuat sumber daya baru. */
  @Post('masuk')
  @HttpCode(200)
  masuk(@Body() dto: MasukDto) {
    return this.auth.masuk(dto.email, dto.kataSandi);
  }

  @Get('saya')
  @WajibMasuk()
  saya(@PenggunaSaatIni() pengguna: PenggunaToken) {
    return this.auth.profil(pengguna.id);
  }
}
