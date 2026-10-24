/**
 * Endpoint baca Fase 2: login, pencarian, detail unit, dan panel mitra.
 *
 * Memakai data uji kecil milik file ini, bukan seed, supaya setiap keadaan
 * yang diuji bisa ditunjuk dengan pasti. Semua tanggal relatif terhadap hari
 * ini (WITA). Database: rentalaja_test.
 *
 * Mitra A (yang diuji):
 *   unit-keluar  pesanan BERJALAN kemarin 09.00 -> besok 09.00
 *   unit-bebas   pesanan MENUNGGU segar hari+3 -> hari+5, blokir manual hari+6 -> hari+8
 *   unit-telat   pesanan BERJALAN hari-3 -> hari-1, belum kembali
 * Mitra B: satu unit, satu pesanan. Tidak boleh terlihat oleh mitra A.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { keIsoWita, MENIT, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const jam9 = (geser: number) => new Date(pukulWita(sekarang, geser, 9));
const tanggal = (geser: number) => keIsoWita(pukulWita(sekarang, geser, 12));

let app: INestApplication;
let tokenMitraA: string;
let tokenMitraB: string;
let tokenPenyewa: string;
let nomor = 0;

async function masuk(email: string) {
  const r = await request(app.getHttpServer()).post('/auth/masuk').send({ email, kataSandi: KATA_SANDI });
  return r.body.token as string;
}

async function siapkanData() {
  await db.$executeRawUnsafe(
    'TRUNCATE pengguna, mitra, unit, blokir_unit, pesanan, pembayaran, ulasan RESTART IDENTITY CASCADE',
  );
  const hash = await bcrypt.hash(KATA_SANDI, 4);
  const pengguna = (email: string, peran: 'MITRA' | 'PENYEWA') =>
    db.pengguna.create({ data: { email, kataSandiHash: hash, nama: email.split('@')[0], telepon: '0', peran } });

  const pemilikA = await pengguna('mitra-a@uji.test', 'MITRA');
  const pemilikB = await pengguna('mitra-b@uji.test', 'MITRA');
  const penyewa = await pengguna('penyewa@uji.test', 'PENYEWA');
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  const unit = (mitraId: string, slug: string, harga: number) =>
    db.unit.create({
      data: {
        mitraId, slug, nama: slug, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'Skutik 110cc',
        spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: harga, area: 'Canggu',
      },
    });
  const keluar = await unit(mitraA.id, 'unit-keluar', 70_000);
  const bebas = await unit(mitraA.id, 'unit-bebas', 60_000);
  const telat = await unit(mitraA.id, 'unit-telat', 80_000);
  const milikB = await unit(mitraB.id, 'unit-milik-b', 50_000);

  const pesan = (unitId: string, harga: number, a: number, b: number, status: 'MENUNGGU' | 'BERJALAN') =>
    db.pesanan.create({
      data: {
        kode: `RA-UJI-${++nomor}`, unitId, penyewaId: penyewa.id, mulai: jam9(a), selesai: jam9(b), status,
        hargaPerHari: harga, jumlahHari: b - a, subtotal: harga * (b - a), biayaLayanan: 0,
        total: harga * (b - a), diantar: false, titik: 'Kantor',
        dibuatPada: new Date(sekarang - 10 * MENIT),
      },
    });
  await pesan(keluar.id, 70_000, -1, 1, 'BERJALAN');
  await pesan(bebas.id, 60_000, 3, 5, 'MENUNGGU');
  await pesan(telat.id, 80_000, -3, -1, 'BERJALAN');
  await pesan(milikB.id, 50_000, 0, 2, 'BERJALAN');
  await db.blokirUnit.create({ data: { unitId: bebas.id, jenis: 'MANUAL', mulai: jam9(6), selesai: jam9(8) } });
}

beforeAll(async () => {
  await siapkanData();
  const modul = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modul.createNestApplication();
  // Sama dengan main.ts, supaya validasi yang diuji adalah validasi sungguhan.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  tokenMitraA = await masuk('mitra-a@uji.test');
  tokenMitraB = await masuk('mitra-b@uji.test');
  tokenPenyewa = await masuk('penyewa@uji.test');
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

const minta = () => request(app.getHttpServer());

describe('Login', () => {
  it('kata sandi salah dan email tak terdaftar dijawab dengan pesan yang sama', async () => {
    const salah = await minta().post('/auth/masuk').send({ email: 'mitra-a@uji.test', kataSandi: 'keliru' });
    const takAda = await minta().post('/auth/masuk').send({ email: 'tidak-ada@uji.test', kataSandi: 'keliru' });
    expect(salah.status).toBe(401);
    expect(takAda.status).toBe(401);
    expect(salah.body.message).toBe(takAda.body.message);
  });

  it('email tidak peka huruf besar dan mengembalikan profil beserta mitranya', async () => {
    const r = await minta().post('/auth/masuk').send({ email: '  Mitra-A@UJI.test ', kataSandi: KATA_SANDI });
    expect(r.status).toBe(200);
    expect(r.body.pengguna).toMatchObject({ peran: 'MITRA', mitra: { nama: 'Rental A' } });
    expect(r.body.pengguna.kataSandiHash).toBeUndefined();
  });

  it('GET /auth/saya butuh token yang sah', async () => {
    expect((await minta().get('/auth/saya')).status).toBe(401);
    expect((await minta().get('/auth/saya').set('Authorization', 'Bearer palsu')).status).toBe(401);
    const r = await minta().get('/auth/saya').set('Authorization', `Bearer ${tokenPenyewa}`);
    expect(r.body).toMatchObject({ email: 'penyewa@uji.test', peran: 'PENYEWA' });
  });
});

describe('Penjaga panel mitra', () => {
  it('401 tanpa token, 403 untuk penyewa', async () => {
    expect((await minta().get('/mitra/beranda')).status).toBe(401);
    const r = await minta().get('/mitra/beranda').set('Authorization', `Bearer ${tokenPenyewa}`);
    expect(r.status).toBe(403);
  });

  it('mitra A hanya melihat unit dan pesanan miliknya sendiri', async () => {
    const unit = await minta().get('/mitra/unit').set('Authorization', `Bearer ${tokenMitraA}`);
    expect(unit.body.map((u: { slug: string }) => u.slug).sort()).toEqual(['unit-bebas', 'unit-keluar', 'unit-telat']);

    const pesananB = await minta().get('/mitra/pesanan').set('Authorization', `Bearer ${tokenMitraB}`);
    expect(pesananB.body).toHaveLength(1);
    expect(pesananB.body[0].unit.plat).toBe('DK unit-milik-b');
  });
});

describe('Panel mitra', () => {
  const sebagaiA = (url: string) => minta().get(url).set('Authorization', `Bearer ${tokenMitraA}`);

  it('status unit diturunkan dari pesanan dan blokir saat ini', async () => {
    const r = await sebagaiA('/mitra/unit');
    const status = Object.fromEntries(r.body.map((u: { slug: string; status: string }) => [u.slug, u.status]));
    expect(status).toEqual({ 'unit-keluar': 'keluar', 'unit-bebas': 'kosong', 'unit-telat': 'telat' });
  });

  it('pesanan dikelompokkan memakai status turunan', async () => {
    const menunggu = await sebagaiA('/mitra/pesanan?status=menunggu');
    expect(menunggu.body).toHaveLength(1);
    expect(menunggu.body[0].batasBalasPada).not.toBeNull();

    const berjalan = await sebagaiA('/mitra/pesanan?status=berjalan');
    expect(berjalan.body.map((p: { status: string }) => p.status).sort()).toEqual(['berjalan', 'telat']);
  });

  it('beranda menghitung unit keluar termasuk yang telat', async () => {
    const r = await sebagaiA('/mitra/beranda');
    expect(r.body.unitKeluar).toMatchObject({ jumlah: 2, totalUnit: 3 });
    expect(r.body.mingguIni).toHaveLength(7);
    expect(r.body.mingguIni[0]).toEqual({ tanggal: tanggal(0), jumlah: 2 });
  });

  it('kalender memakai urutan menang yang benar', async () => {
    const r = await sebagaiA(`/mitra/kalender?mulai=${tanggal(0)}&hari=8`);
    const sel = (slug: string, geser: number) =>
      r.body.unit.find((u: { nama: string }) => u.nama === slug).sel[geser].keadaan;

    expect(sel('unit-keluar', 0)).toBe('disewa');
    expect(sel('unit-telat', 0)).toBe('telat');
    expect(sel('unit-bebas', 3)).toBe('dipesan');
    expect(sel('unit-bebas', 6)).toBe('diblokir');
    expect(sel('unit-bebas', 0)).toBe('kosong');
  });

  it('menolak status pesanan yang tidak dikenal', async () => {
    expect((await sebagaiA('/mitra/pesanan?status=aneh')).status).toBe(400);
  });
});

describe('Pencarian', () => {
  it('unit yang sedang dipakai ditandai terisi dan diurutkan ke bawah', async () => {
    const r = await minta().get(`/pencarian?mulai=${tanggal(0)}&durasi=1`);
    expect(r.status).toBe(200);
    const kosong = Object.fromEntries(r.body.unit.map((u: { slug: string; kosong: boolean }) => [u.slug, u.kosong]));
    expect(kosong['unit-keluar']).toBe(false);
    expect(kosong['unit-bebas']).toBe(true);
    // Semua yang kosong berada di atas semua yang terisi.
    const urutan = r.body.unit.map((u: { kosong: boolean }) => u.kosong);
    expect(urutan).toEqual([...urutan].sort((a: boolean, b: boolean) => Number(b) - Number(a)));
  });

  it('pesanan menunggu yang masih segar membuat unit terisi', async () => {
    const r = await minta().get(`/pencarian?mulai=${tanggal(3)}&durasi=2`);
    const bebas = r.body.unit.find((u: { slug: string }) => u.slug === 'unit-bebas');
    expect(bebas.kosong).toBe(false);
  });

  it('harga adalah harga per hari x durasi, ditambah biaya layanan 3%', async () => {
    const r = await minta().get(`/pencarian?mulai=${tanggal(10)}&durasi=3`);
    const bebas = r.body.unit.find((u: { slug: string }) => u.slug === 'unit-bebas');
    expect(bebas.harga).toEqual({
      perHari: 60_000, jumlahHari: 3, subtotal: 180_000, biayaLayanan: 5_400, total: 185_400,
    });
    expect(bebas.plat).toBeUndefined();
  });

  it.each([
    ['tanggal yang tidak ada', 'mulai=2026-02-31&durasi=1'],
    ['durasi nol', `mulai=${tanggal(1)}&durasi=0`],
    ['tanggal lampau', `mulai=${tanggal(-2)}&durasi=1`],
    ['parameter tak dikenal', `mulai=${tanggal(1)}&durasi=1&total=1000`],
  ])('menolak %s dengan 400', async (_, query) => {
    expect((await minta().get(`/pencarian?${query}`)).status).toBe(400);
  });
});

describe('Detail unit', () => {
  it('kalender 7 hari mencerminkan pesanan menunggu dan blokir', async () => {
    const r = await minta().get(`/unit/unit-bebas?mulai=${tanggal(2)}&durasi=1`);
    expect(r.status).toBe(200);
    const kosong = r.body.kalender.map((h: { kosong: boolean }) => h.kosong);
    // Strip mulai hari+2. Pesanan menunggu menempati hari+3 sampai hari+5
    // (berakhir pukul 09.00 hari+5, jadi hari itu ikut tersentuh), blokir
    // menempati hari+6 sampai hari+8.
    expect(kosong[0]).toBe(true);
    expect(kosong[1]).toBe(false);
    expect(kosong[4]).toBe(false);
    // Rentang yang diminta (hari+2 09.00 -> hari+3 09.00) bersambung tepat
    // dengan pesanan menunggu, jadi masih kosong.
    expect(r.body.kosong).toBe(true);
  });

  it('404 untuk slug yang tidak ada', async () => {
    expect((await minta().get(`/unit/tidak-ada?mulai=${tanggal(1)}&durasi=1`)).status).toBe(404);
  });
});
