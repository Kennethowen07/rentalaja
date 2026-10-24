import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

/** Hash nyata dari nilai yang tidak pernah dipakai. Dibandingkan saat email
 *  tidak terdaftar, supaya waktu jawab sama dengan saat kata sandi salah dan
 *  penyerang tidak bisa menebak email mana yang terdaftar dari lamanya. */
const HASH_PENGALIH = bcrypt.hashSync('pengalih-waktu-tidak-dipakai', 10);

const GAGAL_MASUK = 'Email atau kata sandi salah.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async masuk(email: string, kataSandi: string) {
    const pengguna = await this.prisma.pengguna.findUnique({ where: { email } });
    const cocok = await bcrypt.compare(kataSandi, pengguna?.kataSandiHash ?? HASH_PENGALIH);
    // Satu pesan untuk dua kasus: email tak terdaftar dan kata sandi salah.
    if (!pengguna || !cocok) throw new UnauthorizedException(GAGAL_MASUK);

    const token = await this.jwt.signAsync({ sub: pengguna.id, peran: pengguna.peran });
    return { token, pengguna: await this.profil(pengguna.id) };
  }

  async profil(id: string) {
    const p = await this.prisma.pengguna.findUnique({
      where: { id },
      select: { id: true, nama: true, email: true, peran: true, mitra: { select: { id: true, nama: true } } },
    });
    if (!p) throw new NotFoundException('Akun tidak ditemukan.');
    return p;
  }
}
