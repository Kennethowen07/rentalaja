import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { MitraService } from '../mitra/mitra.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { bankDari, JEDA_REKENING_MS, labelRekening, namaCocok, salahNomor } from '../umum/rekening.js';
import type { UbahRekeningDto } from './dto/rekening.dto.js';

type BarisRekening = {
  bankRekening: string | null;
  nomorRekening: string | null;
  namaRekening: string | null;
  rekeningDiubahPada: Date | null;
};

/** Bentuk yang dikirim API. Nomor lengkap TIDAK PERNAH ikut. */
export function bentukRekening(m: BarisRekening, sekarang: number) {
  if (!m.bankRekening || !m.nomorRekening || !m.namaRekening || !m.rekeningDiubahPada) return null;
  const bisaTarik = m.rekeningDiubahPada.getTime() + JEDA_REKENING_MS;
  return {
    bank: m.bankRekening,
    namaBank: bankDari(m.bankRekening)?.nama ?? m.bankRekening,
    /** "···4471" */
    nomorSamar: `···${m.nomorRekening.slice(-4)}`,
    namaPemilik: m.namaRekening,
    /** "BCA ···4471", label siap tampil. */
    label: labelRekening(m.bankRekening, m.nomorRekening),
    diubahPada: m.rekeningDiubahPada,
    /** Tarik saldo dikunci sampai waktu ini setelah rekening diubah. */
    bisaTarikPada: new Date(bisaTarik),
    terkunci: sekarang < bisaTarik,
  };
}

@Injectable()
export class RekeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mitra: MitraService,
  ) {}

  async lihat(penggunaId: string) {
    const m = await this.mitra.milik(penggunaId);
    return { rekening: bentukRekening(m, Date.now()) };
  }

  /**
   * Isi atau ganti rekening. Urutan cek sengaja: kata sandi dulu, supaya
   * orang tanpa kata sandi tidak bisa memakai endpoint ini untuk menebak
   * nama pemilik akun lewat pesan "nama tidak cocok".
   */
  async ubah(penggunaId: string, dto: UbahRekeningDto) {
    const m = await this.mitra.milik(penggunaId);
    const pemilik = await this.prisma.pengguna.findUniqueOrThrow({
      where: { id: penggunaId },
      select: { nama: true, kataSandiHash: true },
    });
    if (!(await bcrypt.compare(dto.kataSandi, pemilik.kataSandiHash))) {
      // 403, bukan 401: sesinya sah, yang salah konfirmasinya. 401 membuat
      // klien mengira token habis dan mengeluarkan pengguna.
      throw new ForbiddenException('Kata sandi salah.');
    }
    const salah = salahNomor(dto.bank, dto.nomor);
    if (salah) throw new BadRequestException(salah);
    if (!namaCocok(dto.namaPemilik, pemilik.nama)) {
      throw new BadRequestException(
        'Rekening harus atas nama pemilik akun. Nama pemilik rekening tidak sama dengan nama akun.',
      );
    }

    // Kirim ulang rekening yang sama persis tidak membuka ulang kunci 24 jam.
    const sama =
      m.bankRekening === dto.bank && m.nomorRekening === dto.nomor && m.namaRekening === dto.namaPemilik;
    const baru = sama
      ? m
      : await this.prisma.mitra.update({
          where: { id: m.id },
          data: {
            bankRekening: dto.bank,
            nomorRekening: dto.nomor,
            namaRekening: dto.namaPemilik,
            rekeningDiubahPada: new Date(),
          },
        });
    return { rekening: bentukRekening(baru, Date.now()) };
  }
}
