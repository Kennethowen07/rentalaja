/**
 * Pendapatan, saldo, dan tarik saldo penyedia. Semua angka DITURUNKAN dari
 * pesanan, jadi data uji di bawah menentukan angka yang diharapkan.
 *
 * Mitra A (rekening BCA), unit motor 100.000/hari dan mobil 400.000/hari:
 *   P1 motor 2 hari, SELESAI, dilepas 1 menit lalu          -> dilepas, bersih 190.000
 *   P2 mobil 2 hari, SELESAI, dilepas 1 jam lalu            -> dilepas, bersih 760.000
 *   P3 motor 1 hari, SELESAI, kembali 2 jam lalu            -> ditahan (belum 24 jam), 95.000
 *   P4 motor 1 hari, SELESAI, klaim kerusakan masih terbuka -> ditahan_klaim, 95.000
 *   P5 motor 2 hari, BERJALAN                               -> ditahan, 190.000
 *   P6 motor 1 hari, SELESAI, dilepas bulan lalu            -> dilepas, bersih 95.000
 *   P7 mobil, MENUNGGU                                      -> tidak dihitung sama sekali
 * Mitra B (rekening ada, tanpa pesanan): saldo 0.
 *
 * Saldo A = 190.000 + 760.000 + 95.000 = 1.045.000, ditahan = 380.000.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { rincianHarga } from '../src/umum/harga.js';
import { dariIsoWita, HARI, JAM, keIsoWita, MENIT, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const awalBulanIni = dariIsoWita(`${keIsoWita(sekarang).slice(0, 7)}-01`)!;

let app: INestApplication;
const token: Record<string, string> = {};
let idMitraA: string;
let idMitraB: string;
let idPenyewa: string;

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });

/** Rekening sah yang diubah lama sekali, jadi kunci tarik 24 jam sudah lewat. */
const rek = (bankRekening: string, nomorRekening: string, namaRekening: string) => ({
  bankRekening, nomorRekening, namaRekening, rekeningDiubahPada: new Date(Date.now() - 30 * HARI),
});
const TANPA_REKENING = { bankRekening: null, nomorRekening: null, namaRekening: null, rekeningDiubahPada: null };
const REK_A = rek('BCA', '0281374471', 'mitra-a');
const REK_B = rek('BRI', '012345678901234', 'mitra-b');

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
  const penyewa = await pengguna('penyewa-1@uji.test', 'PENYEWA');
  idPenyewa = penyewa.id;
  // Akun MITRA yang belum punya baris mitra.
  await pengguna('mitra-tanpa@uji.test', 'MITRA');
  const mitraA = await db.mitra.create({
    data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu', ...REK_A },
  });
  idMitraA = mitraA.id;
  idMitraB = (
    await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta', ...REK_B } })
  ).id;

  const unit = (slug: string, kategori: 'MOTOR' | 'MOBIL', hargaPerHari: number) =>
    db.unit.create({
      data: {
        mitraId: mitraA.id, slug, nama: slug, plat: `DK ${slug}`, kategori, jenis: 'uji',
        spesifikasi: 'uji', tahun: 2023, hargaPerHari, area: 'Canggu',
      },
    });
  const motor = await unit('Honda Scoopy', 'MOTOR', 100_000);
  const mobil = await unit('Toyota Avanza', 'MOBIL', 400_000);

  let n = 0;
  const pesanan = async (
    u: { id: string; hargaPerHari: number },
    hari: number,
    mulai: number,
    lain: { status: 'SELESAI' | 'BERJALAN' | 'MENUNGGU'; kembaliPada?: number },
  ) => {
    const h = rincianHarga(u.hargaPerHari, hari);
    return db.pesanan.create({
      data: {
        kode: `RA-UJI${++n}`, unitId: u.id, penyewaId: penyewa.id,
        mulai: new Date(mulai), selesai: new Date(mulai + hari * HARI),
        hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal,
        biayaLayanan: h.biayaLayanan, total: h.total, diantar: false, titik: 'Kantor',
        status: lain.status,
        dibuatPada: lain.status === 'MENUNGGU' ? new Date(sekarang) : new Date(mulai - HARI),
        diterimaPada: lain.status === 'MENUNGGU' ? null : new Date(mulai - HARI),
        kembaliPada: lain.kembaliPada === undefined ? null : new Date(lain.kembaliPada),
      },
    });
  };

  // Kembali tepat 24 jam + x sebelum sekarang = dilepas x yang lalu.
  const kembaliLepas = (lalu: number) => sekarang - HARI - lalu;
  const k1 = kembaliLepas(MENIT);
  await pesanan(motor, 2, k1 - 2 * HARI, { status: 'SELESAI', kembaliPada: k1 });
  const k2 = kembaliLepas(JAM);
  await pesanan(mobil, 2, k2 - 2 * HARI, { status: 'SELESAI', kembaliPada: k2 });
  const k3 = sekarang - 2 * JAM;
  await pesanan(motor, 1, k3 - HARI, { status: 'SELESAI', kembaliPada: k3 });
  const k4 = sekarang - 3 * HARI;
  const p4 = await pesanan(motor, 1, k4 - HARI, { status: 'SELESAI', kembaliPada: k4 });
  await db.klaimKerusakan.create({ data: { pesananId: p4.id, nominal: 50_000, keterangan: 'Spion patah' } });
  await pesanan(motor, 2, sekarang - HARI, { status: 'BERJALAN' });
  const k6 = awalBulanIni - 3 * HARI;
  await pesanan(motor, 1, k6 - HARI, { status: 'SELESAI', kembaliPada: k6 });
  await pesanan(mobil, 2, pukulWita(sekarang, 5, 9), { status: 'MENUNGGU' });
}

beforeAll(async () => {
  await siapkanData();
  const modul = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modul.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  for (const siapa of ['mitra-a', 'mitra-b', 'penyewa-1', 'mitra-tanpa']) {
    const r = await minta().post('/auth/masuk').send({ email: `${siapa}@uji.test`, kataSandi: KATA_SANDI });
    token[siapa] = r.body.token;
  }
  // Menyiapkan data + menyalakan Nest bisa lewat 10 detik bawaan Vitest saat
  // mesin sibuk (beberapa stream menjalankan test bersamaan).
}, 30_000);

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

describe('Akses', () => {
  it('401 tanpa login, 403 untuk penyewa', async () => {
    expect((await minta().get('/mitra/saldo')).status).toBe(401);
    expect((await minta().get('/mitra/pendapatan')).status).toBe(401);
    expect((await minta().post('/mitra/saldo/tarik').send({})).status).toBe(401);
    expect((await minta().get('/mitra/saldo').set(auth('penyewa-1'))).status).toBe(403);
    expect((await minta().get('/mitra/pendapatan').set(auth('penyewa-1'))).status).toBe(403);
    expect((await minta().post('/mitra/saldo/tarik').set(auth('penyewa-1')).send({})).status).toBe(403);
  });

  it('403 untuk akun MITRA yang belum punya data mitra', async () => {
    expect((await minta().get('/mitra/saldo').set(auth('mitra-tanpa'))).status).toBe(403);
    expect((await minta().get('/mitra/pendapatan').set(auth('mitra-tanpa'))).status).toBe(403);
    expect((await minta().post('/mitra/saldo/tarik').set(auth('mitra-tanpa')).send({})).status).toBe(403);
  });

  it('periode yang tidak dikenal ditolak', async () => {
    const r = await minta().get('/mitra/pendapatan?periode=setahun').set(auth('mitra-a'));
    expect(r.status).toBe(400);
  });
});

describe('Saldo', () => {
  it('saldo = dana dilepas, ditahan = berjalan + belum 24 jam + klaim terbuka; menunggu tidak dihitung', async () => {
    const r = await minta().get('/mitra/saldo').set(auth('mitra-a'));
    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      saldo: 1_045_000,
      ditahan: 380_000,
      totalDilepas: 1_045_000,
      totalDicairkan: 0,
      rekening: 'BCA ···4471',
      bisaTarikPada: null,
    });
  });

  it('mitra lain tidak melihat dana mitra A', async () => {
    const r = await minta().get('/mitra/saldo').set(auth('mitra-b'));
    expect(r.body).toMatchObject({ saldo: 0, ditahan: 0 });
  });
});

describe('Pendapatan per periode', () => {
  it('bulan ini: hanya dana yang dilepas bulan ini, komisi 5%, sumber per kategori', async () => {
    const r = await minta().get('/mitra/pendapatan?periode=bulan-ini').set(auth('mitra-a'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      periode: 'bulan-ini',
      rentang: { dari: keIsoWita(awalBulanIni), sampai: keIsoWita(sekarang) },
      kotor: 1_000_000,
      biaya: 50_000,
      bersih: 950_000,
      ditahan: 380_000,
      jumlahPesanan: 2,
      sumber: [
        { kategori: 'MOTOR', label: 'Motor', nilai: 200_000 },
        { kategori: 'MOBIL', label: 'Mobil', nilai: 800_000 },
      ],
    });
    // Terbaru dulu: P1 dilepas 1 menit lalu, P2 1 jam lalu.
    expect(r.body.transaksi).toEqual([
      { id: 'masuk-RA-UJI1', judul: 'Dana masuk · Honda Scoopy', tanggal: expect.any(String), nilai: 190_000, arah: 'masuk' },
      { id: 'biaya-RA-UJI1', judul: 'Biaya layanan', tanggal: expect.any(String), nilai: 10_000, arah: 'keluar' },
      { id: 'masuk-RA-UJI2', judul: 'Dana masuk · Toyota Avanza', tanggal: expect.any(String), nilai: 760_000, arah: 'masuk' },
      { id: 'biaya-RA-UJI2', judul: 'Biaya layanan', tanggal: expect.any(String), nilai: 40_000, arah: 'keluar' },
    ]);
    expect(r.body.transaksi[0].tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('periode kosong berarti bulan ini', async () => {
    const r = await minta().get('/mitra/pendapatan').set(auth('mitra-a'));
    expect(r.body).toMatchObject({ periode: 'bulan-ini', kotor: 1_000_000 });
  });

  it('bulan lalu dan tiga bulan', async () => {
    const lalu = await minta().get('/mitra/pendapatan?periode=bulan-lalu').set(auth('mitra-a'));
    expect(lalu.body).toMatchObject({ kotor: 100_000, biaya: 5_000, bersih: 95_000, jumlahPesanan: 1 });
    expect(lalu.body.rentang.sampai).toBe(keIsoWita(awalBulanIni - 1));

    const tiga = await minta().get('/mitra/pendapatan?periode=tiga-bulan').set(auth('mitra-a'));
    expect(tiga.body).toMatchObject({ kotor: 1_100_000, biaya: 55_000, bersih: 1_045_000, jumlahPesanan: 3 });
  });
});

describe('Tarik saldo', () => {
  it('400 kalau rekening kosong', async () => {
    await db.mitra.update({ where: { id: idMitraA }, data: TANPA_REKENING });
    const r = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({});
    await db.mitra.update({ where: { id: idMitraA }, data: REK_A });
    expect(r.status).toBe(400);
    expect(await db.pencairan.count()).toBe(0);
  });

  it('400 kalau saldo 0', async () => {
    const r = await minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({});
    expect(r.status).toBe(400);
  });

  it('400 kalau jumlah melebihi saldo atau bukan bilangan bulat positif', async () => {
    const lebih = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({ jumlah: 1_045_001 });
    expect(lebih.status).toBe(400);
    const nol = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({ jumlah: 0 });
    expect(nol.status).toBe(400);
    expect(await db.pencairan.count()).toBe(0);
  });

  it('tarik sebagian, rekening disalin ke riwayat', async () => {
    const r = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({ jumlah: 45_000 });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ pencairan: { jumlah: 45_000, rekening: 'BCA ···4471' }, saldo: 1_000_000 });
    const s = await minta().get('/mitra/saldo').set(auth('mitra-a'));
    expect(s.body).toMatchObject({ saldo: 1_000_000, totalDicairkan: 45_000 });
  });

  it('lima tarikan bersamaan: hanya satu yang berhasil, saldo tidak pernah minus', async () => {
    const hasil = await Promise.all(
      Array.from({ length: 5 }, () => minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({})),
    );
    const status = hasil.map((r) => r.status).sort();
    expect(status).toEqual([201, 400, 400, 400, 400]);
    expect(hasil.find((r) => r.status === 201)!.body).toMatchObject({ pencairan: { jumlah: 1_000_000 }, saldo: 0 });

    const total = await db.pencairan.aggregate({ _sum: { jumlah: true }, _count: { _all: true } });
    expect(total._count._all).toBe(2);
    expect(total._sum.jumlah).toBe(1_045_000);
    const s = await minta().get('/mitra/saldo').set(auth('mitra-a'));
    expect(s.body).toMatchObject({ saldo: 0, ditahan: 380_000, totalDicairkan: 1_045_000 });
  });

  it('pencairan muncul di transaksi pendapatan bulan ini sebagai uang keluar', async () => {
    const r = await minta().get('/mitra/pendapatan?periode=bulan-ini').set(auth('mitra-a'));
    const cair = r.body.transaksi.filter((t: { judul: string }) => t.judul === 'Pencairan ke rekening');
    expect(cair.map((t: { nilai: number }) => t.nilai).sort((a: number, b: number) => a - b)).toEqual([45_000, 1_000_000]);
    expect(cair.every((t: { arah: string }) => t.arah === 'keluar')).toBe(true);
    // Pencairan tidak mengurangi pendapatan; ia hanya memindahkan saldo.
    expect(r.body).toMatchObject({ kotor: 1_000_000, bersih: 950_000 });
  });
});

/**
 * Aturan waktu dan status yang tidak tercakup data mitra A. Data mitra B
 * ditambahkan di sini (setelah test di atas memakai mitra B sebagai saldo 0):
 *   B1 100.000, SELESAI, dilepas 10 menit LAGI              -> ditahan 95.000
 *   B2 100.000, SELESAI, dilepas 1 menit sebelum awal bulan -> bulan lalu, 95.000
 *   B3  33.333, SELESAI, klaim diselesaikan 1 menit lalu     -> dilepas saat itu, 31.666
 *   B4 400.000 mobil, SELESAI, dilepas tepat awal bulan ini  -> bulan ini, 380.000
 *   B5 DIBATALKAN, B6 DITOLAK, B7 MENUNGGU lewat batas balas -> tidak dihitung
 *   B8 BERJALAN telat 2 hari                                 -> ditahan 95.000, denda tidak dihitung
 *   B9 BERJALAN, mulai hari+3                                -> ditahan 95.000
 * Saldo B = 95.000 + 31.666 + 380.000 = 506.666, ditahan = 285.000.
 */
describe('Aturan waktu dan status (mitra B)', () => {
  const kembaliB3 = sekarang - 5 * HARI;
  const klaimSelesai = sekarang - MENIT;

  beforeAll(async () => {
    let n = 0;
    const pesanan = async (
      harga: number,
      kategori: 'MOTOR' | 'MOBIL',
      mulai: number,
      lain: {
        status: 'SELESAI' | 'BERJALAN' | 'MENUNGGU' | 'DITOLAK' | 'DIBATALKAN';
        kembaliPada?: number;
        dibuatPada?: number;
      },
    ) => {
      const kode = `RA-B${++n}`;
      const u = await db.unit.create({
        data: {
          mitraId: idMitraB, slug: `unit-${kode}`, nama: `Unit ${kode}`, plat: `DK ${kode}`, kategori,
          jenis: 'uji', spesifikasi: 'uji', tahun: 2023, hargaPerHari: harga, area: 'Kuta',
        },
      });
      const h = rincianHarga(harga, 1);
      return db.pesanan.create({
        data: {
          kode, unitId: u.id, penyewaId: idPenyewa, mulai: new Date(mulai), selesai: new Date(mulai + HARI),
          hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal,
          biayaLayanan: h.biayaLayanan, total: h.total, diantar: false, titik: 'Kantor',
          status: lain.status,
          dibuatPada: new Date(lain.dibuatPada ?? mulai - HARI),
          diterimaPada: ['BERJALAN', 'SELESAI'].includes(lain.status) ? new Date(mulai - HARI) : null,
          kembaliPada: lain.kembaliPada === undefined ? null : new Date(lain.kembaliPada),
          alasanBatal: lain.status === 'DIBATALKAN' ? 'DIBATALKAN_PENYEWA' : null,
          dibatalkanPada: lain.status === 'DIBATALKAN' ? new Date(mulai - HARI) : null,
        },
      });
    };

    const k1 = sekarang - HARI + 10 * MENIT;
    await pesanan(100_000, 'MOTOR', k1 - HARI, { status: 'SELESAI', kembaliPada: k1 });
    const k2 = awalBulanIni - HARI - MENIT;
    await pesanan(100_000, 'MOTOR', k2 - HARI, { status: 'SELESAI', kembaliPada: k2 });
    const p3 = await pesanan(33_333, 'MOTOR', kembaliB3 - HARI, { status: 'SELESAI', kembaliPada: kembaliB3 });
    await db.klaimKerusakan.create({
      data: { pesananId: p3.id, nominal: 20_000, keterangan: 'Lecet', diselesaikanPada: new Date(klaimSelesai) },
    });
    const k4 = awalBulanIni - HARI;
    await pesanan(400_000, 'MOBIL', k4 - HARI, { status: 'SELESAI', kembaliPada: k4 });
    await pesanan(100_000, 'MOTOR', pukulWita(sekarang, 2, 9), { status: 'DIBATALKAN' });
    await pesanan(100_000, 'MOTOR', pukulWita(sekarang, 2, 9), { status: 'DITOLAK' });
    await pesanan(100_000, 'MOTOR', pukulWita(sekarang, 2, 9), { status: 'MENUNGGU', dibuatPada: sekarang - 2 * JAM });
    await pesanan(100_000, 'MOTOR', sekarang - 3 * HARI, { status: 'BERJALAN' });
    await pesanan(100_000, 'MOTOR', pukulWita(sekarang, 3, 9), { status: 'BERJALAN' });
  });

  it('saldo: 24 jam belum lewat ditahan, klaim selesai dilepas, batal/tolak/kedaluwarsa tidak dihitung, denda tidak ikut', async () => {
    const r = await minta().get('/mitra/saldo').set(auth('mitra-b'));
    expect(r.body).toEqual({
      saldo: 506_666,
      ditahan: 285_000,
      totalDilepas: 506_666,
      totalDicairkan: 0,
      rekening: 'BRI ···1234',
      bisaTarikPada: null,
    });
  });

  it('bulan ini: dana dilepas tepat tengah malam awal bulan masuk; klaim selesai dicatat di tanggal klaim selesai', async () => {
    const r = await minta().get('/mitra/pendapatan?periode=bulan-ini').set(auth('mitra-b'));
    expect(r.body).toMatchObject({
      kotor: 433_333,
      biaya: 21_667,
      bersih: 411_666,
      ditahan: 285_000,
      jumlahPesanan: 2,
      sumber: [
        { kategori: 'MOTOR', nilai: 33_333 },
        { kategori: 'MOBIL', nilai: 400_000 },
      ],
    });
    expect(r.body.transaksi).toEqual([
      { id: 'masuk-RA-B3', judul: 'Dana masuk · Unit RA-B3', tanggal: keIsoWita(klaimSelesai), nilai: 31_666, arah: 'masuk' },
      { id: 'biaya-RA-B3', judul: 'Biaya layanan', tanggal: keIsoWita(klaimSelesai), nilai: 1_667, arah: 'keluar' },
      { id: 'masuk-RA-B4', judul: 'Dana masuk · Unit RA-B4', tanggal: keIsoWita(awalBulanIni), nilai: 380_000, arah: 'masuk' },
      { id: 'biaya-RA-B4', judul: 'Biaya layanan', tanggal: keIsoWita(awalBulanIni), nilai: 20_000, arah: 'keluar' },
    ]);
  });

  it('bulan lalu: dana dilepas semenit sebelum awal bulan ini; tiga bulan: semuanya', async () => {
    const lalu = await minta().get('/mitra/pendapatan?periode=bulan-lalu').set(auth('mitra-b'));
    expect(lalu.body).toMatchObject({ kotor: 100_000, bersih: 95_000, jumlahPesanan: 1 });
    expect(lalu.body.transaksi[0]).toMatchObject({ id: 'masuk-RA-B2', tanggal: keIsoWita(awalBulanIni - MENIT) });
    expect(lalu.body.rentang.dari).toBe(`${keIsoWita(awalBulanIni - MENIT).slice(0, 7)}-01`);

    const tiga = await minta().get('/mitra/pendapatan?periode=tiga-bulan').set(auth('mitra-b'));
    expect(tiga.body).toMatchObject({ kotor: 533_333, bersih: 506_666, jumlahPesanan: 3 });
    expect(tiga.body.rentang).toEqual({ dari: keIsoWita(sekarang - 89 * HARI), sampai: keIsoWita(sekarang) });
  });

  it('jumlah tarik harus angka bulat di body JSON; rekening kosong ditolak', async () => {
    for (const jumlah of [1.5, 'abc', true, '45000', -5]) {
      const r = await minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({ jumlah });
      expect(r.status, `jumlah ${JSON.stringify(jumlah)}`).toBe(400);
    }
    expect((await minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({ catatan: 'x' })).status).toBe(400);

    await db.mitra.update({ where: { id: idMitraB }, data: TANPA_REKENING });
    const r = await minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({});
    await db.mitra.update({ where: { id: idMitraB }, data: REK_B });
    expect(r.status).toBe(400);
    expect(await db.pencairan.count({ where: { mitraId: idMitraB } })).toBe(0);
  });

  it('dua tarikan sebagian bersamaan yang jumlahnya melebihi saldo: hanya satu lolos', async () => {
    const dua = await Promise.all(
      [1, 2].map(() => minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({ jumlah: 300_000 })),
    );
    expect(dua.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(dua.find((r) => r.status === 201)!.body).toMatchObject({
      pencairan: { jumlah: 300_000, rekening: 'BRI ···1234' },
      saldo: 206_666,
    });
  });

  it('tiga tarikan 100.000 bersamaan dari saldo 206.666: tepat dua lolos, sisa 6.666', async () => {
    const tiga = await Promise.all(
      [1, 2, 3].map(() => minta().post('/mitra/saldo/tarik').set(auth('mitra-b')).send({ jumlah: 100_000 })),
    );
    expect(tiga.map((r) => r.status).sort()).toEqual([201, 201, 400]);
    const s = await minta().get('/mitra/saldo').set(auth('mitra-b'));
    expect(s.body).toMatchObject({ saldo: 6_666, totalDicairkan: 500_000, ditahan: 285_000 });
    // Saldo mitra A tidak tersentuh tarikan mitra B.
    const a = await minta().get('/mitra/saldo').set(auth('mitra-a'));
    expect(a.body).toMatchObject({ saldo: 0, totalDicairkan: 1_045_000 });
  });
});

/**
 * Temuan QA stream B. Mitra C dibuat di sini dengan saldo besar dan
 * rekening terisi, terpisah dari angka mitra A dan B di atas.
 */
describe('QA: tarik saldo', () => {
  let idMitraC: string;
  const tarikC = (body: object) => minta().post('/mitra/saldo/tarik').set(auth('mitra-c')).send(body);

  beforeAll(async () => {
    const hash = await bcrypt.hash(KATA_SANDI, 4);
    const pemilik = await db.pengguna.create({
      data: { email: 'mitra-c@uji.test', kataSandiHash: hash, nama: 'mitra-c', telepon: '0812', peran: 'MITRA' },
    });
    idMitraC = (
      await db.mitra.create({ data: { pemilikId: pemilik.id, nama: 'Rental C', area: 'Ubud', ...rek('BNI', '0123459999', 'mitra-c') } })
    ).id;
    // Dua sewa mobil mahal 60 hari: bersih 2 x 1.425.000.000 = 2.850.000.000,
    // melewati batas INTEGER Postgres (2.147.483.647) untuk satu pencairan.
    for (const k of ['C1', 'C2']) {
      const u = await db.unit.create({
        data: {
          mitraId: idMitraC, slug: `unit-${k}`, nama: `Unit ${k}`, plat: `DK ${k}`, kategori: 'MOBIL',
          jenis: 'uji', spesifikasi: 'uji', tahun: 2023, hargaPerHari: 25_000_000, area: 'Ubud',
        },
      });
      const h = rincianHarga(25_000_000, 60);
      const kembali = sekarang - 2 * HARI;
      await db.pesanan.create({
        data: {
          kode: `RA-${k}`, unitId: u.id, penyewaId: idPenyewa,
          mulai: new Date(kembali - 60 * HARI), selesai: new Date(kembali),
          hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal,
          biayaLayanan: h.biayaLayanan, total: h.total, diantar: false, titik: 'Kantor', status: 'SELESAI',
          dibuatPada: new Date(kembali - 61 * HARI), diterimaPada: new Date(kembali - 61 * HARI),
          kembaliPada: new Date(kembali),
        },
      });
    }
    const r = await minta().post('/auth/masuk').send({ email: 'mitra-c@uji.test', kataSandi: KATA_SANDI });
    token['mitra-c'] = r.body.token;
  });

  it('{jumlah: null} ditolak 400, tidak diam-diam menarik seluruh saldo', async () => {
    const r = await tarikC({ jumlah: null });
    expect(r.status).toBe(400);
    expect(await db.pencairan.count({ where: { mitraId: idMitraC } })).toBe(0);
  });

  it('saldo di atas batas INTEGER: 400 atau pencairan dibatasi, bukan 500', async () => {
    const s = await minta().get('/mitra/saldo').set(auth('mitra-c'));
    expect(s.body.saldo).toBe(2_850_000_000);
    const lebih = await tarikC({ jumlah: 2_147_483_648 });
    expect(lebih.status).toBe(400);
    // Tarik seluruh: satu pencairan dibatasi batas INTEGER, sisanya tetap di saldo.
    const r = await tarikC({});
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ pencairan: { jumlah: 2_147_483_647 }, saldo: 702_516_353 });
  });

  it('enam puluh tarikan bersamaan: tidak ada yang 500, saldo tidak pernah minus', async () => {
    // Sebelum diperbaiki, antrean sepanjang ini membuat belasan request 500
    // (P2028: transaksi Prisma lewat maxWait 2 detik bawaan).
    const hasil = await Promise.all(Array.from({ length: 60 }, () => tarikC({ jumlah: 100_000_000 })));
    expect(hasil.filter((r) => r.status >= 500).map((r) => r.body)).toEqual([]);
    expect(hasil.every((r) => [201, 400, 409].includes(r.status))).toBe(true);
    // Sisa 702.516.353 cukup untuk tepat tujuh kali 100 juta. 409 (antrean
    // habis waktu, tidak menulis apa pun) hanya muncul kalau mesin sangat sibuk.
    const lolos = hasil.filter((r) => r.status === 201).length;
    expect(lolos).toBeLessThanOrEqual(7);
    if (!hasil.some((r) => r.status === 409)) expect(lolos).toBe(7);
    const s = await minta().get('/mitra/saldo').set(auth('mitra-c'));
    expect(s.body.saldo).toBeGreaterThanOrEqual(0);
    const total = await db.pencairan.aggregate({ where: { mitraId: idMitraC }, _sum: { jumlah: true } });
    expect(s.body.saldo + (total._sum.jumlah ?? 0)).toBe(2_850_000_000);
    // Dua puluh transaksi yang antre di satu kunci bisa lewat 5 detik bawaan
    // Vitest saat mesin sibuk.
  }, 60_000);
});

/**
 * Rekening tarik saldo ala aplikasi saham/kripto: atas nama pemilik akun,
 * wajib kata sandi, nomor tersamar, dan tarik saldo dikunci 24 jam setelah
 * rekening diubah. Memakai mitra A (nama akun "mitra-a", saldo sudah 0).
 */
describe('Rekening', () => {
  const ubah = (siapa: string, body: object) => minta().put('/mitra/rekening').set(auth(siapa)).send(body);
  const SAH = { bank: 'BNI', nomor: '123 456-7890', namaPemilik: 'Mitra A', kataSandi: KATA_SANDI };

  it('GET menampilkan rekening tersamar, nomor lengkap tidak pernah ikut', async () => {
    const r = await minta().get('/mitra/rekening').set(auth('mitra-a'));
    expect(r.status).toBe(200);
    expect(r.body.rekening).toMatchObject({
      bank: 'BCA', namaBank: 'BCA', nomorSamar: '···4471', label: 'BCA ···4471', terkunci: false,
    });
    expect(JSON.stringify(r.body)).not.toContain('0281374471');
  });

  it('otorisasi: tanpa login 401, penyewa 403, mitra tanpa usaha 403', async () => {
    expect((await minta().get('/mitra/rekening')).status).toBe(401);
    expect((await ubah('penyewa-1', SAH)).status).toBe(403);
    expect((await minta().get('/mitra/rekening').set(auth('mitra-tanpa'))).status).toBe(403);
  });

  it('kata sandi salah 403 dan dicek sebelum nama, jadi nama pemilik akun tidak bisa ditebak', async () => {
    const r = await ubah('mitra-a', { ...SAH, namaPemilik: 'Orang Lain', kataSandi: 'salah' });
    expect(r.status).toBe(403);
    const m = await db.mitra.findUniqueOrThrow({ where: { id: idMitraA } });
    expect(m.nomorRekening).toBe('0281374471');
  });

  it('validasi: bank tak dikenal, panjang nomor per bank, huruf, nama beda, field kurang -> 400', async () => {
    const salah = [
      { ...SAH, bank: 'BANK_X' },
      { ...SAH, bank: 'BCA', nomor: '123456789' }, // BCA 10 digit
      { ...SAH, bank: 'BRI', nomor: '1234567890' }, // BRI 15 digit
      { ...SAH, nomor: '12345abc90' },
      { ...SAH, nomor: '1234567' },
      { ...SAH, namaPemilik: 'Orang Lain' },
      { ...SAH, namaPemilik: 'Mitra' },
      { bank: SAH.bank, nomor: SAH.nomor, namaPemilik: SAH.namaPemilik },
      { ...SAH, kataSandi: '' },
    ];
    for (const body of salah) expect((await ubah('mitra-a', body)).status, JSON.stringify(body)).toBe(400);
    const m = await db.mitra.findUniqueOrThrow({ where: { id: idMitraA } });
    expect(m.bankRekening).toBe('BCA');
  });

  it('ganti rekening: nomor dirapikan, sapaan di nama diabaikan, tarik saldo terkunci 24 jam', async () => {
    const r = await ubah('mitra-a', { ...SAH, namaPemilik: 'Pak MITRA A' });
    expect(r.status).toBe(200);
    expect(r.body.rekening).toMatchObject({ bank: 'BNI', label: 'BNI ···7890', terkunci: true });
    const buka = new Date(r.body.rekening.bisaTarikPada).getTime();
    expect(Math.abs(buka - (Date.now() + HARI))).toBeLessThan(MENIT);
    expect(JSON.stringify(r.body)).not.toContain('1234567890');
    expect((await db.mitra.findUniqueOrThrow({ where: { id: idMitraA } })).nomorRekening).toBe('1234567890');

    const saldo = await minta().get('/mitra/saldo').set(auth('mitra-a'));
    expect(saldo.body).toMatchObject({ rekening: 'BNI ···7890', bisaTarikPada: r.body.rekening.bisaTarikPada });

    const sebelum = await db.pencairan.count({ where: { mitraId: idMitraA } });
    const tarik = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({});
    expect(tarik.status).toBe(409);
    expect(await db.pencairan.count({ where: { mitraId: idMitraA } })).toBe(sebelum);
  });

  it('kirim ulang rekening yang sama tidak memperpanjang kunci', async () => {
    const lama = (await db.mitra.findUniqueOrThrow({ where: { id: idMitraA } })).rekeningDiubahPada;
    const r = await ubah('mitra-a', { ...SAH, namaPemilik: 'Pak MITRA A' });
    expect(r.status).toBe(200);
    expect((await db.mitra.findUniqueOrThrow({ where: { id: idMitraA } })).rekeningDiubahPada).toEqual(lama);
  });

  it('setelah 24 jam kunci terbuka (saldo mitra A sudah 0, jadi jawabannya 400 saldo kosong, bukan 409)', async () => {
    await db.mitra.update({
      where: { id: idMitraA },
      data: { rekeningDiubahPada: new Date(Date.now() - HARI - MENIT) },
    });
    const tarik = await minta().post('/mitra/saldo/tarik').set(auth('mitra-a')).send({});
    expect(tarik.status).toBe(400);
    expect((await minta().get('/mitra/saldo').set(auth('mitra-a'))).body.bisaTarikPada).toBeNull();
  });

  it('database menolak rekening setengah terisi dan nomor bukan angka', async () => {
    await expect(db.mitra.update({ where: { id: idMitraA }, data: { bankRekening: null } })).rejects.toThrow();
    await expect(db.mitra.update({ where: { id: idMitraA }, data: { nomorRekening: '12AB5678' } })).rejects.toThrow();
  });
});
