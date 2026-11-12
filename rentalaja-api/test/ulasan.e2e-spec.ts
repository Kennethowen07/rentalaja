/**
 * Ulasan penyewa dan balasan penyedia. Data uji milik file ini sendiri;
 * jalankan dengan database test sendiri, mis.
 *   NAMA_DB_TEST=rentalaja_test_a npx vitest run --config ./vitest.config.e2e.ts test/ulasan.e2e-spec.ts
 *
 * Mitra A, unit-a:
 *   RA-SELESAI   penyewa-1, selesai
 *   RA-SELESAI2  penyewa-1, selesai (untuk ringkasan lebih dari satu ulasan)
 *   RA-SELESAI3  penyewa-2, selesai
 *   RA-JALAN     penyewa-1, masih berjalan
 *   RA-BATAL     penyewa-1, dibatalkan
 * Mitra B, unit-b:
 *   RA-LAIN      penyewa-2, selesai
 * mitra-baru: akun berperan MITRA tapi belum punya baris mitra.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { StatusPesanan } from '../src/generated/prisma/enums.js';
import { rincianHarga } from '../src/umum/harga.js';
import { HARI, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const jam9 = (geser: number) => new Date(pukulWita(sekarang, geser, 9));

let app: INestApplication;
const token: Record<string, string> = {};

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });
const ulas = (siapa: string, kode: string, body: object) =>
  minta().post(`/pesanan/${kode}/ulasan`).set(auth(siapa)).send(body);
const daftarMitra = (siapa: string) => minta().get('/mitra/ulasan').set(auth(siapa));

async function siapkanData() {
  await db.$executeRawUnsafe(
    'TRUNCATE pengguna, mitra, pencairan, unit, blokir_unit, pesanan, pembayaran, dokumen_penyewa, ' +
      'serah_terima, foto_serah, klaim_kerusakan, ulasan, pesan_chat RESTART IDENTITY CASCADE',
  );
  const hash = await bcrypt.hash(KATA_SANDI, 4);
  const pengguna = (email: string, peran: 'MITRA' | 'PENYEWA') =>
    db.pengguna.create({ data: { email, kataSandiHash: hash, nama: email.split('@')[0], telepon: '0812', peran } });

  const pemilikA = await pengguna('mitra-a@uji.test', 'MITRA');
  const pemilikB = await pengguna('mitra-b@uji.test', 'MITRA');
  await pengguna('mitra-baru@uji.test', 'MITRA');
  const penyewa1 = await pengguna('penyewa-1@uji.test', 'PENYEWA');
  const penyewa2 = await pengguna('penyewa-2@uji.test', 'PENYEWA');
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  const unit = (mitraId: string, slug: string) =>
    db.unit.create({
      data: {
        mitraId, slug, nama: slug, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'Skutik 110cc',
        spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: 50_000, area: 'Canggu',
      },
    });
  const a = await unit(mitraA.id, 'unit-a');
  const b = await unit(mitraB.id, 'unit-b');

  const pesanan = (kode: string, unitId: string, penyewaId: string, mulai: Date, status: StatusPesanan) => {
    const h = rincianHarga(50_000, 2);
    const akhir = new Date(mulai.getTime() + 2 * HARI);
    return db.pesanan.create({
      data: {
        kode, unitId, penyewaId, mulai, selesai: akhir, status,
        alasanBatal: status === 'DIBATALKAN' ? 'DIBATALKAN_PENYEWA' : null,
        kembaliPada: status === 'SELESAI' ? akhir : null, hargaPerHari: h.perHari, jumlahHari: h.jumlahHari,
        subtotal: h.subtotal, biayaLayanan: h.biayaLayanan, total: h.total, diantar: false, titik: 'Kantor',
        dibuatPada: new Date(mulai.getTime() - HARI), diterimaPada: new Date(mulai.getTime() - HARI),
      },
    });
  };
  await pesanan('RA-SELESAI', a.id, penyewa1.id, jam9(-10), 'SELESAI');
  await pesanan('RA-SELESAI2', a.id, penyewa1.id, jam9(-20), 'SELESAI');
  await pesanan('RA-SELESAI3', a.id, penyewa2.id, jam9(-30), 'SELESAI');
  await pesanan('RA-JALAN', a.id, penyewa1.id, jam9(-1), 'BERJALAN');
  await pesanan('RA-BATAL', a.id, penyewa1.id, jam9(5), 'DIBATALKAN');
  await pesanan('RA-LAIN', b.id, penyewa2.id, jam9(-10), 'SELESAI');
}

beforeAll(async () => {
  await siapkanData();
  const modul = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modul.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  for (const siapa of ['mitra-a', 'mitra-b', 'mitra-baru', 'penyewa-1', 'penyewa-2']) {
    const r = await minta().post('/auth/masuk').send({ email: `${siapa}@uji.test`, kataSandi: KATA_SANDI });
    token[siapa] = r.body.token;
  }
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

describe('Penyewa mengulas', () => {
  let idUlasan: string;

  it('skor di luar 1..5 atau bukan kelipatan 0,5 ditolak 400', async () => {
    for (const skor of [0.5, 4.3, 6, '4', null, 1.25, -1, 5.5]) {
      expect((await ulas('penyewa-1', 'RA-SELESAI', { skor, isi: 'Unit bersih.' })).status, String(skor)).toBe(400);
    }
    expect((await ulas('penyewa-1', 'RA-SELESAI', { isi: 'Unit bersih.' })).status).toBe(400);
  });

  it('isi wajib 3..2000 karakter setelah spasi dibuang; field asing ditolak 400', async () => {
    for (const isi of ['   ', 'ok', '  ok  ', 'x'.repeat(2001), 42]) {
      expect((await ulas('penyewa-1', 'RA-SELESAI', { skor: 5, isi })).status).toBe(400);
    }
    expect((await ulas('penyewa-1', 'RA-SELESAI', { skor: 5 })).status).toBe(400);
    // Field yang tidak dideklarasikan ditolak, bukan dipakai.
    const asing = { skor: 5, isi: 'Unit bersih.', penyewaId: 'x' };
    expect((await ulas('penyewa-1', 'RA-SELESAI', asing)).status).toBe(400);
    expect(await db.ulasan.count()).toBe(0);
  });

  it('batas isi 2000 karakter dan skor 1 diterima', async () => {
    const r = await ulas('penyewa-1', 'RA-SELESAI2', { skor: 1, isi: 'x'.repeat(2000) });
    expect(r.status).toBe(201);
    expect(r.body.isi).toHaveLength(2000);
    expect(r.body.skor).toBe(1);
    // Dihapus lagi supaya RA-SELESAI2 bisa dipakai untuk ringkasan di bawah.
    await db.ulasan.deleteMany({ where: { pesanan: { kode: 'RA-SELESAI2' } } });
  });

  it('tanpa login 401, mitra 403, pesanan orang lain atau tidak ada 404, belum selesai atau batal 409', async () => {
    const tanpaLogin = await minta().post('/pesanan/RA-SELESAI/ulasan').send({ skor: 5, isi: 'Mantap.' });
    expect(tanpaLogin.status).toBe(401);
    expect((await ulas('mitra-a', 'RA-SELESAI', { skor: 5, isi: 'Mantap.' })).status).toBe(403);
    expect((await ulas('penyewa-2', 'RA-SELESAI', { skor: 5, isi: 'Mantap.' })).status).toBe(404);
    expect((await ulas('penyewa-1', 'RA-TIDAK-ADA', { skor: 5, isi: 'Mantap.' })).status).toBe(404);
    expect((await ulas('penyewa-1', 'RA-JALAN', { skor: 5, isi: 'Mantap.' })).status).toBe(409);
    expect((await ulas('penyewa-1', 'RA-BATAL', { skor: 5, isi: 'Mantap.' })).status).toBe(409);
    expect(await db.ulasan.count()).toBe(0);
  });

  it('pesanan selesai: 201 dengan bentuk Ulasan, lalu ulasan kedua untuk pesanan yang sama 409', async () => {
    const r = await ulas('penyewa-1', 'RA-SELESAI', { skor: 4.5, isi: '  Unit bersih, diantar tepat waktu.  ' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      kodePesanan: 'RA-SELESAI',
      nama: 'penyewa-1',
      unit: 'unit-a',
      unitSlug: 'unit-a',
      skor: 4.5,
      isi: 'Unit bersih, diantar tepat waktu.',
      balasan: null,
      dibalasPada: null,
    });
    expect(Math.abs(new Date(r.body.tanggal).getTime() - Date.now())).toBeLessThan(60_000);
    idUlasan = r.body.id;

    expect((await ulas('penyewa-1', 'RA-SELESAI', { skor: 3, isi: 'Ganti pikiran.' })).status).toBe(409);
    const tersimpan = await db.ulasan.findUniqueOrThrow({ where: { id: idUlasan } });
    expect(tersimpan.skor.toNumber()).toBe(4.5);
    expect((await ulas('penyewa-2', 'RA-LAIN', { skor: 5, isi: 'Rental B oke.' })).status).toBe(201);
  });

  it('dua kiriman bersamaan untuk pesanan yang sama: hanya satu baris', async () => {
    await db.ulasan.deleteMany({ where: { pesanan: { kode: 'RA-SELESAI' } } });
    const hasil = await Promise.all([
      ulas('penyewa-1', 'RA-SELESAI', { skor: 4.5, isi: 'Unit bersih, diantar tepat waktu.' }),
      ulas('penyewa-1', 'RA-SELESAI', { skor: 4.5, isi: 'Unit bersih, diantar tepat waktu.' }),
    ]);
    expect(hasil.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.ulasan.count({ where: { pesanan: { kode: 'RA-SELESAI' } } })).toBe(1);
    idUlasan = hasil.find((r) => r.status === 201)!.body.id;
  });

  describe('Mitra membaca dan membalas', () => {
    it('tanpa login 401, penyewa 403, mitra tanpa usaha 403', async () => {
      expect((await minta().get('/mitra/ulasan')).status).toBe(401);
      expect((await daftarMitra('penyewa-1')).status).toBe(403);
      expect((await daftarMitra('mitra-baru')).status).toBe(403);
    });

    it('daftar hanya ulasan unit milik sendiri, dengan ringkasan', async () => {
      const r = await daftarMitra('mitra-a');
      expect(r.status).toBe(200);
      expect(r.body.daftar).toHaveLength(1);
      expect(r.body.daftar[0]).toMatchObject({ id: idUlasan, nama: 'penyewa-1', skor: 4.5 });
      expect(r.body.ringkasan).toEqual({
        rata: 4.5,
        total: 1,
        distribusi: [
          { bintang: 5, jumlah: 0 },
          { bintang: 4, jumlah: 1 },
          { bintang: 3, jumlah: 0 },
          { bintang: 2, jumlah: 0 },
          { bintang: 1, jumlah: 0 },
        ],
      });
      const b = await daftarMitra('mitra-b');
      expect(b.body.daftar.map((u: { kodePesanan: string }) => u.kodePesanan)).toEqual(['RA-LAIN']);
    });

    it('membalas: tanpa login 401, penyewa 403, ulasan mitra lain/tidak ada 404, isi salah 400', async () => {
      const balas = (siapa: string, balasan: unknown) =>
        minta().post(`/mitra/ulasan/${idUlasan}/balas`).set(auth(siapa)).send({ balasan });

      const tanpaLogin = await minta().post(`/mitra/ulasan/${idUlasan}/balas`).send({ balasan: 'Halo' });
      expect(tanpaLogin.status).toBe(401);
      expect((await balas('penyewa-1', 'Terima kasih')).status).toBe(403);
      expect((await balas('mitra-b', 'Terima kasih')).status).toBe(404);
      expect((await balas('mitra-baru', 'Terima kasih')).status).toBe(404);
      const tidakAda = await minta()
        .post('/mitra/ulasan/tidak-ada/balas')
        .set(auth('mitra-a'))
        .send({ balasan: 'Halo' });
      expect(tidakAda.status).toBe(404);
      expect((await balas('mitra-a', '   ')).status).toBe(400);
      expect((await balas('mitra-a', 'x'.repeat(1001))).status).toBe(400);
      expect((await balas('mitra-a', 42)).status).toBe(400);
      expect((await db.ulasan.findUniqueOrThrow({ where: { id: idUlasan } })).balasan).toBeNull();
    });

    it('balasan sendiri boleh diubah; isi dan skor ulasan tidak ikut berubah', async () => {
      const balas = (balasan: string) =>
        minta().post(`/mitra/ulasan/${idUlasan}/balas`).set(auth('mitra-a')).send({ balasan });

      const r1 = await balas('  Terima kasih sudah menyewa!  ');
      expect(r1.status).toBe(200);
      expect(r1.body.balasan).toBe('Terima kasih sudah menyewa!');
      expect(r1.body.dibalasPada).not.toBeNull();
      const r2 = await balas('Terima kasih, sampai jumpa lagi.');
      expect(r2.status).toBe(200);
      expect(r2.body.balasan).toBe('Terima kasih, sampai jumpa lagi.');
      expect(new Date(r2.body.dibalasPada).getTime()).toBeGreaterThanOrEqual(new Date(r1.body.dibalasPada).getTime());

      const d = await daftarMitra('mitra-a');
      expect(d.body.daftar[0]).toMatchObject({
        id: idUlasan,
        balasan: 'Terima kasih, sampai jumpa lagi.',
        skor: 4.5,
        isi: 'Unit bersih, diantar tepat waktu.',
      });
    });

    it('ringkasan beberapa ulasan: rata-rata 1 desimal, distribusi dibulatkan ke bawah, terbaru di atas', async () => {
      expect((await ulas('penyewa-1', 'RA-SELESAI2', { skor: 5, isi: 'Sempurna.' })).status).toBe(201);
      expect((await ulas('penyewa-2', 'RA-SELESAI3', { skor: 3, isi: 'Lumayan.' })).status).toBe(201);
      const r = await daftarMitra('mitra-a');
      expect(r.status).toBe(200);
      expect(r.body.daftar.map((u: { kodePesanan: string }) => u.kodePesanan)).toEqual([
        'RA-SELESAI3',
        'RA-SELESAI2',
        'RA-SELESAI',
      ]);
      // (4,5 + 5 + 3) / 3 = 4,1666... -> 4,2
      expect(r.body.ringkasan).toEqual({
        rata: 4.2,
        total: 3,
        distribusi: [
          { bintang: 5, jumlah: 1 },
          { bintang: 4, jumlah: 1 },
          { bintang: 3, jumlah: 1 },
          { bintang: 2, jumlah: 0 },
          { bintang: 1, jumlah: 0 },
        ],
      });
    });

    it('mitra tanpa ulasan: daftar kosong, rata 0', async () => {
      await db.ulasan.deleteMany({ where: { pesanan: { kode: 'RA-LAIN' } } });
      const r = await daftarMitra('mitra-b');
      expect(r.status).toBe(200);
      expect(r.body.daftar).toEqual([]);
      expect(r.body.ringkasan.rata).toBe(0);
      expect(r.body.ringkasan.total).toBe(0);
      expect(r.body.ringkasan.distribusi.every((d: { jumlah: number }) => d.jumlah === 0)).toBe(true);
    });
  });
});
