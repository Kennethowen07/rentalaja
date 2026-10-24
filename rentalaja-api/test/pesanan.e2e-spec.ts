/**
 * Fase 3: pesan + bayar penuh, lalu penyedia menerima atau menolak, atau
 * penyewa membatalkan. Data uji milik file ini sendiri. Database: rentalaja_test.
 *
 * Mitra A:
 *   unit-satu    kosong
 *   unit-dua     kosong
 *   unit-blokir  blokir manual hari+5 -> hari+7
 *   unit-basi    pesanan MENUNGGU hari+3 -> hari+5 yang dibuat 2 jam lalu (kedaluwarsa)
 * Mitra B: unit-b. Tidak boleh bisa membalas pesanan unit mitra A.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { rincianHarga } from '../src/umum/harga.js';
import { JAM, keIsoWita, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const jam9 = (geser: number) => new Date(pukulWita(sekarang, geser, 9));
const tanggal = (geser: number) => keIsoWita(pukulWita(sekarang, geser, 12));

const HARGA: Record<string, number> = {
  'unit-satu': 70_000,
  'unit-dua': 60_000,
  'unit-blokir': 50_000,
  'unit-basi': 80_000,
  'unit-b': 40_000,
};

let app: INestApplication;
const token: Record<string, string> = {};
let kodeBasi: string;

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });

/** Body pesanan yang sah, dengan total yang benar menurut rumus server. */
function body(unit: string, mulai: string, durasi: number, lain: Record<string, unknown> = {}) {
  return {
    unit,
    mulai,
    durasi,
    diantar: true,
    titik: 'Jl. Pantai Batu Bolong No. 12, Canggu',
    metode: 'QRIS',
    totalDisetujui: rincianHarga(HARGA[unit], durasi).total,
    ...lain,
  };
}

const pesan = (siapa: string, b: object) => minta().post('/pesanan').set(auth(siapa)).send(b);

async function siapkanData() {
  await db.$executeRawUnsafe(
    'TRUNCATE pengguna, mitra, unit, blokir_unit, pesanan, pembayaran, ulasan RESTART IDENTITY CASCADE',
  );
  const hash = await bcrypt.hash(KATA_SANDI, 4);
  const pengguna = (email: string, peran: 'MITRA' | 'PENYEWA') =>
    db.pengguna.create({ data: { email, kataSandiHash: hash, nama: email.split('@')[0], telepon: '0812', peran } });

  const pemilikA = await pengguna('mitra-a@uji.test', 'MITRA');
  const pemilikB = await pengguna('mitra-b@uji.test', 'MITRA');
  const penyewa1 = await pengguna('penyewa-1@uji.test', 'PENYEWA');
  await pengguna('penyewa-2@uji.test', 'PENYEWA');
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  const unit = (mitraId: string, slug: string) =>
    db.unit.create({
      data: {
        mitraId, slug, nama: slug, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'Skutik 110cc',
        spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: HARGA[slug], area: 'Canggu',
      },
    });
  await unit(mitraA.id, 'unit-satu');
  await unit(mitraA.id, 'unit-dua');
  const blokir = await unit(mitraA.id, 'unit-blokir');
  const basi = await unit(mitraA.id, 'unit-basi');
  await unit(mitraB.id, 'unit-b');

  await db.blokirUnit.create({ data: { unitId: blokir.id, jenis: 'MANUAL', mulai: jam9(5), selesai: jam9(7) } });
  const h = rincianHarga(HARGA['unit-basi'], 2);
  const p = await db.pesanan.create({
    data: {
      kode: 'RA-BASI', unitId: basi.id, penyewaId: penyewa1.id, mulai: jam9(3), selesai: jam9(5),
      hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal, biayaLayanan: h.biayaLayanan,
      total: h.total, diantar: false, titik: 'Kantor', dibuatPada: new Date(sekarang - 2 * JAM),
    },
  });
  kodeBasi = p.kode;
}

beforeAll(async () => {
  await siapkanData();
  const modul = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modul.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  for (const siapa of ['mitra-a', 'mitra-b', 'penyewa-1', 'penyewa-2']) {
    const r = await minta().post('/auth/masuk').send({ email: `${siapa}@uji.test`, kataSandi: KATA_SANDI });
    token[siapa] = r.body.token;
  }
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

describe('Membuat pesanan', () => {
  let kode: string;

  it('menghasilkan pesanan menunggu yang sudah dibayar penuh, dana ditahan', async () => {
    const r = await pesan('penyewa-1', body('unit-satu', tanggal(2), 2));
    expect(r.status).toBe(201);
    kode = r.body.kode;
    expect(kode).toMatch(/^RA-\d{6}$/);
    expect(r.body.status).toBe('menunggu');
    expect(r.body.statusDana).toBe('ditahan');
    expect(r.body.harga).toEqual({
      perHari: 70_000, jumlahHari: 2, subtotal: 140_000, biayaLayanan: 4_200, total: 144_200,
    });
    expect(r.body.pembayaran).toMatchObject({ jumlah: 144_200, metode: 'QRIS' });
    expect(new Date(r.body.batasBalasPada).getTime() - new Date(r.body.dibuatPada).getTime()).toBe(JAM);
    // Plat belum dibuka, dan penyewa tidak menerima data kontak dirinya sendiri.
    expect(r.body.unit.plat).toBeNull();
    expect(r.body.penyewa).toBeUndefined();
  });

  it('unit yang baru dipesan langsung tampil terisi di pencarian', async () => {
    const r = await minta().get(`/pencarian?mulai=${tanggal(2)}&durasi=2`);
    const satu = r.body.unit.find((u: { slug: string }) => u.slug === 'unit-satu');
    expect(satu.kosong).toBe(false);
  });

  it('slot yang tumpang tindih ditolak 409', async () => {
    const r = await pesan('penyewa-2', body('unit-satu', tanggal(3), 1));
    expect(r.status).toBe(409);
  });

  it('dua pesanan bersamaan untuk slot yang sama: tepat satu yang lolos', async () => {
    const hasil = await Promise.all([
      pesan('penyewa-1', body('unit-dua', tanggal(10), 3)),
      pesan('penyewa-2', body('unit-dua', tanggal(11), 1)),
    ]);
    expect(hasil.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('total yang berbeda dengan harga server ditolak, dengan harga yang benar', async () => {
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(40), 2, { totalDisetujui: 120_000 }));
    expect(r.status).toBe(409);
    expect(r.body.harga.total).toBe(123_600);
    const dibuat = await db.pesanan.count({ where: { unit: { slug: 'unit-dua' }, mulai: jam9(40) } });
    expect(dibuat).toBe(0);
  });

  it('rentang yang diblokir penyedia ditolak 409', async () => {
    const r = await pesan('penyewa-1', body('unit-blokir', tanggal(6), 1));
    expect(r.status).toBe(409);
  });

  it('jam ambil hari ini yang sudah lewat ditolak 400', async () => {
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(0), 1, { jam: '00.00' }));
    expect(r.status).toBe(400);
  });

  it('hanya penyewa yang bisa memesan', async () => {
    const tanpa = await minta().post('/pesanan').send(body('unit-dua', tanggal(50), 1));
    const mitra = await pesan('mitra-a', body('unit-dua', tanggal(50), 1));
    expect(tanpa.status).toBe(401);
    expect(mitra.status).toBe(403);
  });

  it('unit yang tidak ada dijawab 404', async () => {
    const r = await pesan('penyewa-1', { ...body('unit-dua', tanggal(50), 1), unit: 'tidak-ada' });
    expect(r.status).toBe(404);
  });

  it.each([
    ['metode tak dikenal', { metode: 'TUNAI' }],
    ['titik berisi spasi saja', { titik: '     ' }],
    ['field yang tidak dikenal', { biayaLayanan: 0 }],
    ['diantar bukan boolean', { diantar: 'ya' }],
  ])('menolak body dengan %s (400)', async (_, lain) => {
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(50), 1, lain));
    expect(r.status).toBe(400);
  });

  describe('lalu penyedia membalas', () => {
    it('mitra lain tidak bisa menerima pesanan ini (404)', async () => {
      const r = await minta().post(`/mitra/pesanan/${kode}/terima`).set(auth('mitra-b'));
      expect(r.status).toBe(404);
    });

    it('penyedia menerima: berjalan, plat terbuka untuk penyewa', async () => {
      const r = await minta().post(`/mitra/pesanan/${kode}/terima`).set(auth('mitra-a'));
      expect(r.status).toBe(200);
      expect(r.body.status).toBe('berjalan');
      expect(r.body.diterimaPada).not.toBeNull();
      expect(r.body.penyewa.nama).toBe('penyewa-1');

      const lihat = await minta().get(`/pesanan/${kode}`).set(auth('penyewa-1'));
      expect(lihat.body.unit.plat).toBe('DK unit-satu');
      expect(lihat.body.statusDana).toBe('ditahan');
    });

    it('menerima dua kali ditolak 409', async () => {
      const r = await minta().post(`/mitra/pesanan/${kode}/terima`).set(auth('mitra-a'));
      expect(r.status).toBe(409);
      expect(r.body.message).toBe('Pesanan sudah diterima penyedia.');
    });

    it('penyewa tidak bisa membatalkan pesanan yang sudah diterima', async () => {
      const r = await minta().post(`/pesanan/${kode}/batal`).set(auth('penyewa-1'));
      expect(r.status).toBe(409);
      expect(r.body.message).toMatch(/belum bisa dibatalkan/);
    });

    it('penyewa lain tidak bisa melihat atau membatalkannya (404)', async () => {
      const lihat = await minta().get(`/pesanan/${kode}`).set(auth('penyewa-2'));
      const batal = await minta().post(`/pesanan/${kode}/batal`).set(auth('penyewa-2'));
      expect(lihat.status).toBe(404);
      expect(batal.status).toBe(404);
    });
  });
});

describe('Penolakan dan pembatalan', () => {
  it('penyedia menolak: dana dikembalikan dan slotnya bisa dipesan lagi', async () => {
    const dibuat = await pesan('penyewa-1', body('unit-dua', tanggal(20), 2));
    const r = await minta().post(`/mitra/pesanan/${dibuat.body.kode}/tolak`).set(auth('mitra-a'));
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ditolak');
    expect(r.body.statusDana).toBe('dikembalikan');

    const lagi = await pesan('penyewa-2', body('unit-dua', tanggal(20), 2));
    expect(lagi.status).toBe(201);
  });

  it('penyewa membatalkan pesanan yang masih menunggu', async () => {
    const dibuat = await pesan('penyewa-1', body('unit-dua', tanggal(30), 1));
    const r = await minta().post(`/pesanan/${dibuat.body.kode}/batal`).set(auth('penyewa-1'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      status: 'dibatalkan', alasanBatal: 'DIBATALKAN_PENYEWA', statusDana: 'dikembalikan',
    });

    const lagi = await minta().post(`/pesanan/${dibuat.body.kode}/batal`).set(auth('penyewa-1'));
    expect(lagi.status).toBe(409);
    // Yang sudah dibatalkan penyewa tidak bisa lagi diterima penyedia.
    const terima = await minta().post(`/mitra/pesanan/${dibuat.body.kode}/terima`).set(auth('mitra-a'));
    expect(terima.status).toBe(409);
  });
});

describe('Batas balas 1 jam', () => {
  it('pesanan yang kedaluwarsa tidak bisa diterima maupun ditolak', async () => {
    const terima = await minta().post(`/mitra/pesanan/${kodeBasi}/terima`).set(auth('mitra-a'));
    const tolak = await minta().post(`/mitra/pesanan/${kodeBasi}/tolak`).set(auth('mitra-a'));
    expect(terima.status).toBe(409);
    expect(tolak.status).toBe(409);
    expect(terima.body.message).toMatch(/batal otomatis/);
  });

  it('penyewa melihatnya batal otomatis dengan dana dikembalikan', async () => {
    const r = await minta().get(`/pesanan/${kodeBasi}`).set(auth('penyewa-1'));
    expect(r.body).toMatchObject({
      status: 'kedaluwarsa', alasanBatal: 'KEDALUWARSA', statusDana: 'dikembalikan', batasBalasPada: null,
    });
  });

  it('slotnya bisa dipesan orang lain, dan baris lamanya dicatat batal', async () => {
    const r = await pesan('penyewa-2', body('unit-basi', tanggal(3), 2));
    expect(r.status).toBe(201);
    const lama = await db.pesanan.findUniqueOrThrow({ where: { kode: kodeBasi } });
    expect(lama.status).toBe('DIBATALKAN');
    expect(lama.alasanBatal).toBe('KEDALUWARSA');
  });
});

describe('Daftar pesanan', () => {
  it('GET /pesanan hanya berisi pesanan penyewa itu sendiri', async () => {
    const [satu, dua] = await Promise.all([
      minta().get('/pesanan').set(auth('penyewa-1')),
      minta().get('/pesanan').set(auth('penyewa-2')),
    ]);
    const kodeSatu = new Set(satu.body.map((p: { kode: string }) => p.kode));
    const milikSatu = await db.pesanan.count({ where: { penyewa: { email: 'penyewa-1@uji.test' } } });
    expect(satu.body).toHaveLength(milikSatu);
    expect(dua.body.some((p: { kode: string }) => kodeSatu.has(p.kode))).toBe(false);
  });

  it('pesanan baru muncul di daftar menunggu penyedia', async () => {
    const dibuat = await pesan('penyewa-1', body('unit-satu', tanggal(45), 1));
    const r = await minta().get('/mitra/pesanan?status=menunggu').set(auth('mitra-a'));
    expect(r.body.map((p: { kode: string }) => p.kode)).toContain(dibuat.body.kode);
    const b = await minta().get('/mitra/pesanan?status=menunggu').set(auth('mitra-b'));
    expect(b.body).toHaveLength(0);
  });
});
