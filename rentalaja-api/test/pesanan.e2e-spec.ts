/**
 * Fase 3: pesan + bayar penuh, lalu penyedia menerima atau menolak, atau
 * penyewa membatalkan. Data uji milik file ini sendiri. Database: rentalaja_test.
 *
 * Mitra A:
 *   unit-satu    kosong
 *   unit-dua     kosong
 *   unit-blokir  blokir manual hari+5 -> hari+7
 *   unit-basi    pesanan MENUNGGU hari+3 -> hari+5 yang dibuat 2 jam lalu (kedaluwarsa)
 *   unit-lama    dibuat di blok "Denda dan dana": pesanan lampau untuk aturan
 *                waktu (telat, 24 jam pelepasan, klaim, batas balas)
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
import { HARI, JAM, keIsoWita, MENIT, pukulWita } from '../src/umum/waktu-wita.js';

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

/** Body pesanan WNI yang sah, dengan total yang benar menurut rumus server,
 *  dokumen jaminan lengkap, dan verifikasi wajah selesai. */
function body(unit: string, mulai: string, durasi: number, lain: Record<string, unknown> = {}) {
  return {
    unit,
    mulai,
    durasi,
    diantar: true,
    titik: 'Jl. Pantai Batu Bolong No. 12, Canggu',
    metode: 'QRIS',
    totalDisetujui: rincianHarga(HARGA[unit], durasi).total,
    asal: 'WNI',
    dokumen: { identitas: 'ktp-penyewa.jpg', sim: 'sim-penyewa.jpg' },
    verifikasiWajah: true,
    ...lain,
  };
}

const pesan = (siapa: string, b: object) => minta().post('/pesanan').set(auth(siapa)).send(b);

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
    expect(r.body).toMatchObject({
      asal: 'WNI', kewarganegaraan: null, dokumen: ['IDENTITAS', 'SIM'], wajahTerverifikasi: true, denda: 0,
    });
    const tersimpan = await db.pesanan.findUniqueOrThrow({ where: { kode }, include: { dokumen: true } });
    expect(tersimpan.wajahTerverifikasiPada).not.toBeNull();
    expect(tersimpan.dokumen.map((d) => [d.jenis, d.url]).sort()).toEqual([
      ['IDENTITAS', 'ktp-penyewa.jpg'], ['SIM', 'sim-penyewa.jpg'],
    ]);
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

describe('Dokumen dan verifikasi wajah (KYC)', () => {
  const wna = {
    asal: 'WNA',
    kewarganegaraan: 'Australia',
    dokumen: { identitas: 'paspor.jpg', sim: 'sim-asal.jpg', idp: 'idp.jpg' },
  };

  it('WNA dengan paspor, SIM asal, dan IDP diterima', async () => {
    const r = await pesan('penyewa-2', body('unit-dua', tanggal(60), 1, wna));
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      asal: 'WNA', kewarganegaraan: 'Australia', dokumen: ['IDENTITAS', 'SIM', 'IDP'], wajahTerverifikasi: true,
    });
  });

  it('asal kosong dianggap WNI', async () => {
    const { asal: _, ...tanpaAsal } = body('unit-dua', tanggal(62), 1);
    const r = await pesan('penyewa-2', tanpaAsal);
    expect(r.status).toBe(201);
    expect(r.body.asal).toBe('WNI');
  });

  it.each([
    ['WNA tanpa kewarganegaraan', { ...wna, kewarganegaraan: undefined }],
    ['WNA tanpa IDP', { ...wna, dokumen: { identitas: 'paspor.jpg', sim: 'sim-asal.jpg' } }],
    ['WNI dengan IDP', { dokumen: { identitas: 'ktp.jpg', sim: 'sim.jpg', idp: 'idp.jpg' } }],
    ['WNI dengan kewarganegaraan', { kewarganegaraan: 'Indonesia' }],
    ['tanpa dokumen', { dokumen: undefined }],
    ['tanpa SIM', { dokumen: { identitas: 'ktp.jpg' } }],
    ['identitas berisi spasi saja', { dokumen: { identitas: '   ', sim: 'sim.jpg' } }],
    ['dokumen dengan field tak dikenal', { dokumen: { identitas: 'ktp.jpg', sim: 'sim.jpg', npwp: 'x' } }],
    ['verifikasi wajah belum selesai', { verifikasiWajah: false }],
    ['tanpa verifikasi wajah', { verifikasiWajah: undefined }],
    ['asal tak dikenal', { asal: 'LAINNYA' }],
  ])('menolak %s (400) tanpa menulis apa pun', async (_, lain) => {
    const sebelum = await db.pesanan.count();
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(64), 1, lain));
    expect(r.status).toBe(400);
    expect(await db.pesanan.count()).toBe(sebelum);
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

describe('Otorisasi', () => {
  it('daftar dan detail pesanan butuh token; daftar hanya untuk penyewa', async () => {
    expect((await minta().get('/pesanan')).status).toBe(401);
    expect((await minta().get(`/pesanan/${kodeBasi}`)).status).toBe(401);
    expect((await minta().get('/pesanan').set(auth('mitra-a'))).status).toBe(403);
  });

  it('membatalkan hanya untuk penyewa; menerima dan menolak hanya untuk mitra', async () => {
    expect((await minta().post(`/pesanan/${kodeBasi}/batal`)).status).toBe(401);
    expect((await minta().post(`/pesanan/${kodeBasi}/batal`).set(auth('mitra-a'))).status).toBe(403);
    for (const aksi of ['terima', 'tolak']) {
      expect((await minta().post(`/mitra/pesanan/${kodeBasi}/${aksi}`)).status).toBe(401);
      expect((await minta().post(`/mitra/pesanan/${kodeBasi}/${aksi}`).set(auth('penyewa-1'))).status).toBe(403);
    }
  });

  it('kode berisi karakter NUL dijawab 404, bukan 500', async () => {
    expect((await minta().get('/pesanan/RA-BASI%00').set(auth('penyewa-1'))).status).toBe(404);
    expect((await minta().post('/pesanan/RA-BASI%00/batal').set(auth('penyewa-1'))).status).toBe(404);
    expect((await minta().post('/mitra/pesanan/RA-BASI%00/terima').set(auth('mitra-a'))).status).toBe(404);
  });
});

describe('Dokumen dan verifikasi wajah: kasus tepi', () => {
  const wna = {
    asal: 'WNA',
    kewarganegaraan: 'Jerman',
    dokumen: { identitas: 'paspor.jpg', sim: 'sim-asal.jpg', idp: 'idp.jpg' },
  };
  const jumlahBaris = () => Promise.all([db.pesanan.count(), db.dokumenPenyewa.count(), db.pembayaran.count()]);

  it('null pada kewarganegaraan dan idp untuk WNI dianggap tidak diisi', async () => {
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(70), 1, {
      kewarganegaraan: null, dokumen: { identitas: 'ktp.jpg', sim: 'sim.jpg', idp: null },
    }));
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ asal: 'WNI', kewarganegaraan: null, dokumen: ['IDENTITAS', 'SIM'] });
  });

  it('spasi di tepi kewarganegaraan dan nama berkas dibuang sebelum disimpan', async () => {
    const r = await pesan('penyewa-2', body('unit-dua', tanggal(72), 1, {
      ...wna, kewarganegaraan: '  Jerman ', dokumen: { identitas: ' paspor.jpg ', sim: 'sim.jpg', idp: ' idp.jpg' },
    }));
    expect(r.status).toBe(201);
    expect(r.body.kewarganegaraan).toBe('Jerman');
    const d = await db.dokumenPenyewa.findMany({ where: { pesanan: { kode: r.body.kode } }, orderBy: { jenis: 'asc' } });
    expect(d.map((x) => x.url)).toEqual(['paspor.jpg', 'sim.jpg', 'idp.jpg']);
  });

  it('penyedia unit melihat asal, kewarganegaraan, dan jenis dokumen; mitra lain 404', async () => {
    const dibuat = await pesan('penyewa-2', body('unit-dua', tanggal(74), 1, wna));
    expect(dibuat.status).toBe(201);
    const r = await minta().get(`/pesanan/${dibuat.body.kode}`).set(auth('mitra-a'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      asal: 'WNA', kewarganegaraan: 'Jerman', dokumen: ['IDENTITAS', 'SIM', 'IDP'], wajahTerverifikasi: true,
      penyewa: { nama: 'penyewa-2' },
    });
    // URL berkas dokumen tidak ikut dikirim, hanya jenisnya.
    expect(JSON.stringify(r.body)).not.toContain('paspor.jpg');
    expect((await minta().get(`/pesanan/${dibuat.body.kode}`).set(auth('mitra-b'))).status).toBe(404);
  });

  it.each([
    ['dokumen berupa array', { dokumen: [{ identitas: 'ktp.jpg', sim: 'sim.jpg' }] }],
    ['dokumen berupa teks', { dokumen: 'ktp.jpg' }],
    ['dokumen null', { dokumen: null }],
    ['verifikasiWajah berupa teks "true"', { verifikasiWajah: 'true' }],
    ['asal huruf kecil', { ...wna, asal: 'wna' }],
    ['WNA dengan kewarganegaraan null', { ...wna, kewarganegaraan: null }],
    ['WNA dengan kewarganegaraan spasi saja', { ...wna, kewarganegaraan: '   ' }],
    ['kewarganegaraan lebih dari 60 karakter', { ...wna, kewarganegaraan: 'x'.repeat(61) }],
    ['WNA dengan IDP null', { ...wna, dokumen: { ...wna.dokumen, idp: null } }],
    ['WNA dengan IDP spasi saja', { ...wna, dokumen: { ...wna.dokumen, idp: '  ' } }],
    ['WNI dengan IDP kosong', { dokumen: { identitas: 'ktp.jpg', sim: 'sim.jpg', idp: '' } }],
    ['nama berkas lebih dari 500 karakter', { dokumen: { identitas: 'x'.repeat(501), sim: 'sim.jpg' } }],
    ['nama berkas berisi karakter NUL', { dokumen: { identitas: 'ktp\u0000.jpg', sim: 'sim.jpg' } }],
    ['titik berisi karakter NUL', { titik: 'Jl. Pantai\u0000 No. 1' }],
    ['kewarganegaraan berisi karakter NUL', { ...wna, kewarganegaraan: 'Jer\u0000man' }],
    ['slug unit berisi karakter NUL', { unit: 'unit-dua\u0000' }],
  ])('menolak %s (400) tanpa menulis apa pun', async (_, lain) => {
    const sebelum = await jumlahBaris();
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(76), 1, lain));
    expect(r.status).toBe(400);
    expect(await jumlahBaris()).toEqual(sebelum);
  });

  it('pesanan yang gagal karena slot terisi tidak meninggalkan dokumen maupun pembayaran', async () => {
    const sebelum = await jumlahBaris();
    // tanggal(74) sudah dipesan di atas.
    const r = await pesan('penyewa-1', body('unit-dua', tanggal(74), 1, wna));
    expect(r.status).toBe(409);
    expect(await jumlahBaris()).toEqual(sebelum);
  });
});

describe('Denda dan dana', () => {
  // Semua di unit-lama (mitra A), dibuat langsung di database dengan waktu
  // lampau supaya aturan waktu diuji tanpa menunggu. Harga dibekukan 90.000;
  // harga unit lalu dinaikkan ke 120.000 untuk memastikan denda memakai
  // harga di pesanan, bukan harga unit saat ini.
  const HARGA_BEKU = 90_000;
  const kode = {
    telat: 'RA-L-TELAT', kembaliTelat: 'RA-L-KEMBALI-TELAT', baru23: 'RA-L-23J', lama25: 'RA-L-25J',
    klaimBuka: 'RA-L-KLAIM-BUKA', klaimTutup: 'RA-L-KLAIM-TUTUP', klaimBaru: 'RA-L-KLAIM-BARU',
    segar: 'RA-L-59M', basi: 'RA-L-61M',
  };
  const jadwalTelat = jam9(-2);

  beforeAll(async () => {
    const mitraA = await db.mitra.findFirstOrThrow({ where: { nama: 'Rental A' } });
    const penyewa = await db.pengguna.findUniqueOrThrow({ where: { email: 'penyewa-2@uji.test' } });
    const u = await db.unit.create({
      data: {
        mitraId: mitraA.id, slug: 'unit-lama', nama: 'unit-lama', plat: 'DK unit-lama', kategori: 'MOTOR',
        jenis: 'Skutik 110cc', spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: HARGA_BEKU, area: 'Canggu',
      },
    });
    const buat = (k: string, mulai: Date, selesai: Date, lain: Record<string, unknown>) => {
      const h = rincianHarga(HARGA_BEKU, Math.ceil((selesai.getTime() - mulai.getTime()) / HARI));
      return db.pesanan.create({
        data: {
          kode: k, unitId: u.id, penyewaId: penyewa.id, mulai, selesai, hargaPerHari: h.perHari,
          jumlahHari: h.jumlahHari, subtotal: h.subtotal, biayaLayanan: h.biayaLayanan, total: h.total,
          diantar: false, titik: 'Kantor', dibuatPada: new Date(mulai.getTime() - HARI), ...lain,
        },
      });
    };
    /** SELESAI, kembali tepat waktu `lalu` ms yang lalu (jadwal selesai 1 jam setelahnya). */
    const kembaliTepat = (k: string, lalu: number) => {
      const kembali = sekarang - lalu;
      return buat(k, new Date(kembali - 2 * HARI), new Date(kembali + JAM), {
        status: 'SELESAI', diterimaPada: new Date(kembali - 3 * HARI), kembaliPada: new Date(kembali),
      });
    };

    // Berjalan, jadwal kembali 2 hari lalu pukul 09.00, belum kembali.
    await buat(kode.telat, jam9(-4), jadwalTelat, { status: 'BERJALAN', diterimaPada: jam9(-5) });
    // Kembali 26 jam setelah jadwal (2 hari telat, dibulatkan ke atas), 9 hari lalu.
    await buat(kode.kembaliTelat, jam9(-12), jam9(-10), {
      status: 'SELESAI', diterimaPada: jam9(-13), kembaliPada: new Date(jam9(-10).getTime() + 26 * JAM),
    });
    await kembaliTepat(kode.baru23, 23 * JAM);
    await kembaliTepat(kode.lama25, 25 * JAM);
    const klaimBuka = await kembaliTepat(kode.klaimBuka, 3 * HARI);
    const klaimTutup = await kembaliTepat(kode.klaimTutup, 3 * HARI);
    const klaimBaru = await kembaliTepat(kode.klaimBaru, 2 * JAM);
    await db.klaimKerusakan.createMany({
      data: [
        { pesananId: klaimBuka.id, nominal: 150_000, keterangan: 'Spion patah' },
        { pesananId: klaimTutup.id, nominal: 150_000, keterangan: 'Lecet', diselesaikanPada: new Date(sekarang - JAM) },
        // Klaim selesai sebelum 24 jam lewat: dana tetap menunggu 24 jam penuh.
        { pesananId: klaimBaru.id, nominal: 150_000, keterangan: 'Lecet', diselesaikanPada: new Date(sekarang - JAM) },
      ],
    });
    // Menunggu: 59 menit (masih bisa dibalas) dan 1 jam lebih 1 detik (kedaluwarsa).
    await buat(kode.segar, jam9(30), jam9(31), { dibuatPada: new Date(sekarang - 59 * MENIT) });
    await buat(kode.basi, jam9(33), jam9(34), { dibuatPada: new Date(sekarang - JAM - 1000) });

    await db.unit.update({ where: { id: u.id }, data: { hargaPerHari: 120_000 } });
  });

  const detail = (k: string, siapa = 'penyewa-2') => minta().get(`/pesanan/${k}`).set(auth(siapa));

  it('unit telat: denda = harga beku x hari telat dibulatkan ke atas, dana tetap ditahan', async () => {
    const r = await detail(kode.telat);
    const hari = Math.ceil((Date.now() - jadwalTelat.getTime()) / HARI);
    expect(r.body).toMatchObject({ status: 'telat', statusDana: 'ditahan', denda: HARGA_BEKU * hari });
    // Denda tidak menyentuh harga maupun pembayaran.
    expect(r.body.harga).toEqual(rincianHarga(HARGA_BEKU, 2));
  });

  it('unit yang kembali telat: denda berhenti di kembaliPada dan tidak menahan dana', async () => {
    const r = await detail(kode.kembaliTelat);
    expect(r.body).toMatchObject({ status: 'selesai', statusDana: 'dilepas', denda: 2 * HARGA_BEKU });
    expect(r.body.harga.total).toBe(rincianHarga(HARGA_BEKU, 2).total);
  });

  it('kembali tepat waktu: denda 0', async () => {
    expect((await detail(kode.lama25)).body.denda).toBe(0);
  });

  it('dana dilepas 24 jam setelah unit kembali', async () => {
    expect((await detail(kode.baru23)).body.statusDana).toBe('ditahan');
    expect((await detail(kode.lama25)).body.statusDana).toBe('dilepas');
  });

  it('klaim kerusakan menahan dana sampai diselesaikan, lalu aturan 24 jam berlaku', async () => {
    expect((await detail(kode.klaimBuka)).body.statusDana).toBe('ditahan_klaim');
    expect((await detail(kode.klaimTutup)).body.statusDana).toBe('dilepas');
    expect((await detail(kode.klaimBaru)).body.statusDana).toBe('ditahan');
  });

  it('daftar penyewa memuat denda yang sama dengan detail', async () => {
    const r = await minta().get('/pesanan').set(auth('penyewa-2'));
    const denda = Object.fromEntries(r.body.map((p: { kode: string; denda: number }) => [p.kode, p.denda]));
    expect(denda[kode.kembaliTelat]).toBe(2 * HARGA_BEKU);
    expect(denda[kode.telat]).toBe((await detail(kode.telat)).body.denda);
    expect(denda[kode.segar]).toBe(0);
  });

  it('panel mitra: denda di daftar pesanan, unit, dan beranda', async () => {
    const harap = (await detail(kode.telat, 'mitra-a')).body.denda;
    expect(harap).toBeGreaterThan(0);

    const selesai = await minta().get('/mitra/pesanan?status=selesai').set(auth('mitra-a'));
    const kembali = selesai.body.find((p: { kode: string }) => p.kode === kode.kembaliTelat);
    expect(kembali).toMatchObject({ denda: 2 * HARGA_BEKU, statusDana: 'dilepas' });

    const berjalan = await minta().get('/mitra/pesanan?status=berjalan').set(auth('mitra-a'));
    expect(berjalan.body.find((p: { kode: string }) => p.kode === kode.telat)).toMatchObject({
      status: 'telat', denda: harap, statusDana: 'ditahan',
    });

    const unit = await minta().get('/mitra/unit').set(auth('mitra-a'));
    expect(unit.body.find((u: { slug: string }) => u.slug === 'unit-lama')).toMatchObject({
      status: 'telat', keluar: { kodePesanan: kode.telat, denda: harap },
    });

    const beranda = await minta().get('/mitra/beranda').set(auth('mitra-a'));
    expect(beranda.body.unitKeluar.daftar.find((u: { kodePesanan: string }) => u.kodePesanan === kode.telat))
      .toMatchObject({ telat: true, denda: harap });

    // Mitra lain tidak melihat pesanan ini sama sekali.
    const b = await minta().get('/mitra/pesanan').set(auth('mitra-b'));
    expect(b.body.some((p: { kode: string }) => p.kode.startsWith('RA-L-'))).toBe(false);
    expect((await detail(kode.telat, 'mitra-b')).status).toBe(404);
  });

  it('batas balas: 59 menit masih bisa diterima, lewat 1 jam tidak', async () => {
    const segar = await minta().post(`/mitra/pesanan/${kode.segar}/terima`).set(auth('mitra-a'));
    expect(segar.status).toBe(200);
    expect(segar.body.status).toBe('berjalan');

    const basi = await minta().post(`/mitra/pesanan/${kode.basi}/terima`).set(auth('mitra-a'));
    expect(basi.status).toBe(409);
    const lihat = await detail(kode.basi);
    expect(lihat.body).toMatchObject({ status: 'kedaluwarsa', statusDana: 'dikembalikan', denda: 0 });
    // Penyewa juga tidak bisa membatalkan yang sudah batal otomatis.
    expect((await minta().post(`/pesanan/${kode.basi}/batal`).set(auth('penyewa-2'))).status).toBe(409);
  });

  it('pesanan kedaluwarsa: daftar mitra dan detail memberi waktu batal yang sama', async () => {
    // Baris di database masih MENUNGGU dengan dibatalkanPada null (tidak ada
    // cron). Waktu batalnya diturunkan: dibuatPada + 1 jam, di semua endpoint.
    const baris = await db.pesanan.findUniqueOrThrow({ where: { kode: kode.basi } });
    expect(baris).toMatchObject({ status: 'MENUNGGU', dibatalkanPada: null });
    const harap = new Date(baris.dibuatPada.getTime() + JAM).toISOString();

    const dariDetail = (await detail(kode.basi, 'mitra-a')).body;
    const batal = await minta().get('/mitra/pesanan?status=batal').set(auth('mitra-a'));
    const dariDaftar = batal.body.find((p: { kode: string }) => p.kode === kode.basi);
    expect(dariDetail).toMatchObject({ status: 'kedaluwarsa', alasanBatal: 'KEDALUWARSA', dibatalkanPada: harap });
    expect(dariDaftar).toMatchObject({ status: 'kedaluwarsa', alasanBatal: 'KEDALUWARSA', dibatalkanPada: harap });
  });
});
