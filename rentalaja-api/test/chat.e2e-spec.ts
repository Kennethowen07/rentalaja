/**
 * Chat penyewa dan penyedia, satu percakapan per pesanan. Data uji milik
 * file ini sendiri. Database: rentalaja_test (atau NAMA_DB_TEST).
 *
 * Mitra A, unit-a:
 *   RA-JALAN    penyewa-1, BERJALAN (sudah diterima)
 *   RA-TUNGGU   penyewa-2, MENUNGGU segar
 *   RA-TOLAK    penyewa-1, DITOLAK, punya satu pesan lama
 *   RA-BASI     penyewa-1, MENUNGGU 2 jam lalu (kedaluwarsa), tanpa pesan
 *   RA-SELESAI  penyewa-2, SELESAI, tanpa pesan
 * Mitra B, unit-b:
 *   RA-B        penyewa-1, BERJALAN
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient, type StatusPesanan } from '../src/generated/prisma/client.js';
import { HARI, JAM, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const jam9 = (geser: number) => new Date(pukulWita(sekarang, geser, 9));

let app: INestApplication;
const token: Record<string, string> = {};

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });
const lihat = (siapa: string, url: string) => minta().get(url).set(auth(siapa));
const kirim = (siapa: string, kode: string, isi: unknown, lain: object = {}) =>
  minta().post(`/chat/${kode}`).set(auth(siapa)).send({ isi, ...lain });

type Percakapan = { kode: string; belumDibaca: number; lawan: { nama: string }; plat: string | null };
const kodeDi = (daftar: Percakapan[]) => daftar.map((p) => p.kode);
const cari = (daftar: Percakapan[], kode: string) => daftar.find((p) => p.kode === kode)!;

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
  const penyewa2 = await pengguna('penyewa-2@uji.test', 'PENYEWA');
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  const unit = (mitraId: string, slug: string) =>
    db.unit.create({
      data: {
        mitraId, slug, nama: `Motor ${slug}`, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'Skutik 110cc',
        spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: 70_000, area: 'Canggu',
      },
    });
  const a = await unit(mitraA.id, 'unit-a');
  const b = await unit(mitraB.id, 'unit-b');

  const pesan = (
    kode: string, unitId: string, penyewaId: string, x: number, y: number, status: StatusPesanan,
    lain: object = {},
  ) =>
    db.pesanan.create({
      data: {
        kode, unitId, penyewaId, mulai: jam9(x), selesai: jam9(y), status,
        hargaPerHari: 70_000, jumlahHari: y - x, subtotal: 70_000 * (y - x), biayaLayanan: 0,
        total: 70_000 * (y - x), diantar: false, titik: 'Kantor', ...lain,
      },
    });
  await pesan('RA-JALAN', a.id, penyewa1.id, -1, 1, 'BERJALAN', { diterimaPada: new Date(sekarang - 2 * HARI) });
  await pesan('RA-TUNGGU', a.id, penyewa2.id, 3, 5, 'MENUNGGU');
  const tolak = await pesan('RA-TOLAK', a.id, penyewa1.id, 6, 8, 'DITOLAK', { ditolakPada: new Date(sekarang - 3 * HARI) });
  await pesan('RA-BASI', a.id, penyewa1.id, 10, 12, 'MENUNGGU', { dibuatPada: new Date(sekarang - 2 * JAM) });
  await pesan('RA-SELESAI', a.id, penyewa2.id, -10, -8, 'SELESAI', { kembaliPada: jam9(-8) });
  await pesan('RA-B', b.id, penyewa1.id, -1, 1, 'BERJALAN', { diterimaPada: new Date(sekarang - 2 * HARI) });

  await db.pesanChat.create({
    data: {
      pesananId: tolak.id, pengirimId: penyewa1.id, isi: 'Masih ada untuk tanggal itu?',
      dikirimPada: new Date(sekarang - 3 * HARI),
    },
  });
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

describe('Penjaga chat', () => {
  it('401 tanpa token', async () => {
    expect((await minta().get('/chat')).status).toBe(401);
    expect((await minta().get('/chat/RA-JALAN')).status).toBe(401);
    expect((await minta().post('/chat/RA-JALAN').send({ isi: 'halo' })).status).toBe(401);
  });

  it('pesanan orang lain dijawab 404, baik dibaca maupun dikirimi pesan', async () => {
    for (const siapa of ['mitra-b', 'penyewa-2']) {
      expect((await lihat(siapa, '/chat/RA-JALAN')).status).toBe(404);
      expect((await kirim(siapa, 'RA-JALAN', 'halo')).status).toBe(404);
    }
    expect((await lihat('penyewa-1', '/chat/RA-TIDAK-ADA')).status).toBe(404);
    expect(await db.pesanChat.count({ where: { pesanan: { kode: 'RA-JALAN' } } })).toBe(0);
  });
});

describe('Mengirim dan membaca', () => {
  it('penyewa mengirim pesan; spasi di tepi dibuang', async () => {
    const r = await kirim('penyewa-1', 'RA-JALAN', '  Pak, helmnya dua ya?\n');
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ isi: 'Pak, helmnya dua ya?', dari: 'penyewa', dariSaya: true, dibacaPada: null });
  });

  it.each([
    ['kosong', ''],
    ['spasi dan baris kosong saja', '  \n\t '],
    ['lebih dari 2000 karakter', 'x'.repeat(2001)],
    ['bukan teks', 123],
  ])('menolak isi %s (400)', async (_, isi) => {
    expect((await kirim('penyewa-1', 'RA-JALAN', isi)).status).toBe(400);
  });

  it('menolak field yang tidak dikenal (400)', async () => {
    expect((await kirim('penyewa-1', 'RA-JALAN', 'halo', { pengirimId: 'palsu' })).status).toBe(400);
  });

  it('daftar mitra: pesanan menunggu/berjalan dan yang punya pesan, terbaru di atas', async () => {
    const r = await lihat('mitra-a', '/chat');
    expect(r.status).toBe(200);
    // RA-BASI (kedaluwarsa) dan RA-SELESAI tidak punya pesan; RA-B milik mitra B.
    expect(new Set(kodeDi(r.body))).toEqual(new Set(['RA-JALAN', 'RA-TUNGGU', 'RA-TOLAK']));
    // RA-JALAN baru saja dapat pesan, jadi paling atas; RA-TOLAK pesannya 3 hari lalu.
    expect(kodeDi(r.body)[0]).toBe('RA-JALAN');
    expect(kodeDi(r.body).at(-1)).toBe('RA-TOLAK');

    const jalan = cari(r.body, 'RA-JALAN');
    expect(jalan).toMatchObject({
      lawan: { peran: 'penyewa', nama: 'penyewa-1' },
      unit: 'Motor unit-a',
      plat: 'DK unit-a',
      belumDibaca: 1,
      bisaKirim: true,
      pesanTerakhir: { isi: 'Pak, helmnya dua ya?', dariSaya: false },
    });
    expect(cari(r.body, 'RA-TUNGGU')).toMatchObject({ belumDibaca: 0, pesanTerakhir: null });
  });

  it('membuka percakapan menandai pesan lawan dibaca, pesan sendiri tidak', async () => {
    const buka = await lihat('mitra-a', '/chat/RA-JALAN');
    expect(buka.status).toBe(200);
    expect(buka.body.pesan).toHaveLength(1);
    expect(buka.body.pesan[0].dibacaPada).not.toBeNull();

    const balas = await kirim('mitra-a', 'RA-JALAN', 'Betul, dua helm.');
    expect(balas.status).toBe(201);
    expect(balas.body).toMatchObject({ dari: 'penyedia', dariSaya: true });

    const daftarMitra = await lihat('mitra-a', '/chat');
    expect(cari(daftarMitra.body, 'RA-JALAN').belumDibaca).toBe(0);

    const daftarPenyewa = await lihat('penyewa-1', '/chat');
    expect(cari(daftarPenyewa.body, 'RA-JALAN')).toMatchObject({
      belumDibaca: 1, lawan: { peran: 'penyedia', nama: 'Rental A' },
    });

    // Penyewa membuka: pesannya urut waktu, dan tanda baca pesannya sendiri
    // berasal dari mitra yang sudah membuka tadi.
    const isi = await lihat('penyewa-1', '/chat/RA-JALAN');
    expect(isi.body.pesan.map((m: { isi: string }) => m.isi)).toEqual(['Pak, helmnya dua ya?', 'Betul, dua helm.']);
    expect(isi.body.pesan.map((m: { dariSaya: boolean }) => m.dariSaya)).toEqual([true, false]);
    expect(isi.body.pesan.every((m: { dibacaPada: string | null }) => m.dibacaPada !== null)).toBe(true);
    expect(cari((await lihat('penyewa-1', '/chat')).body, 'RA-JALAN').belumDibaca).toBe(0);
  });

  it('daftar penyewa berisi semua pesanannya; plat tertutup sebelum diterima', async () => {
    const r = await lihat('penyewa-1', '/chat');
    expect(new Set(kodeDi(r.body))).toEqual(new Set(['RA-JALAN', 'RA-TOLAK', 'RA-BASI', 'RA-B']));
    expect(cari(r.body, 'RA-BASI').plat).toBeNull();
    expect(cari(r.body, 'RA-B')).toMatchObject({ plat: 'DK unit-b', lawan: { nama: 'Rental B' } });
  });
});

describe('Pesanan yang sudah batal', () => {
  it('riwayatnya tetap bisa dibaca', async () => {
    const r = await lihat('mitra-a', '/chat/RA-TOLAK');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'ditolak', bisaKirim: false });
    expect(r.body.pesan.map((m: { isi: string }) => m.isi)).toEqual(['Masih ada untuk tanggal itu?']);
  });

  it.each([
    ['ditolak', 'RA-TOLAK'],
    ['kedaluwarsa', 'RA-BASI'],
  ])('pesanan %s tidak bisa dikirimi pesan baru (409)', async (_, kode) => {
    const sebelum = await db.pesanChat.count();
    const r = await kirim('penyewa-1', kode, 'Halo?');
    expect(r.status).toBe(409);
    expect(await db.pesanChat.count()).toBe(sebelum);
  });

  it('pesanan dibatalkan penyewa juga tertutup (409)', async () => {
    await db.pesanan.update({
      where: { kode: 'RA-TUNGGU' },
      data: { status: 'DIBATALKAN', alasanBatal: 'DIBATALKAN_PENYEWA', dibatalkanPada: new Date() },
    });
    expect((await kirim('penyewa-2', 'RA-TUNGGU', 'Maaf batal')).status).toBe(409);
    expect((await lihat('penyewa-2', '/chat/RA-TUNGGU')).status).toBe(200);
  });

  it('pesanan selesai masih bisa dikirimi pesan', async () => {
    expect((await kirim('penyewa-2', 'RA-SELESAI', 'Dompet saya tertinggal di jok?')).status).toBe(201);
  });
});

describe('Aturan tambahan', () => {
  // RA-TELAT   unit-a, penyewa-1, BERJALAN dan sudah lewat jadwal kembali (telat)
  // RA-SEGAR   unit-a, penyewa-2, MENUNGGU segar, belum diterima (plat tertutup)
  beforeAll(async () => {
    const a = await db.unit.findUniqueOrThrow({ where: { slug: 'unit-a' } });
    const [p1, p2] = await Promise.all(
      ['penyewa-1@uji.test', 'penyewa-2@uji.test'].map((email) => db.pengguna.findUniqueOrThrow({ where: { email } })),
    );
    const data = (kode: string, penyewaId: string, x: number, y: number, status: StatusPesanan, lain: object = {}) => ({
      kode, unitId: a.id, penyewaId, mulai: jam9(x), selesai: jam9(y), status,
      hargaPerHari: 70_000, jumlahHari: y - x, subtotal: 70_000 * (y - x), biayaLayanan: 0,
      total: 70_000 * (y - x), diantar: false, titik: 'Kantor', ...lain,
    });
    await db.pesanan.create({
      data: data('RA-TELAT', p1.id, -5, -2, 'BERJALAN', { diterimaPada: new Date(sekarang - 6 * HARI) }),
    });
    await db.pesanan.create({ data: data('RA-SEGAR', p2.id, 20, 22, 'MENUNGGU') });
  });

  it('pesanan telat masih berjalan, jadi masih bisa dikirimi pesan', async () => {
    expect((await kirim('penyewa-1', 'RA-TELAT', 'Maaf, saya telat, kembali sore ini.')).status).toBe(201);
    expect((await kirim('penyewa-1', 'RA-TELAT', 'Sekitar jam 5.')).status).toBe(201);
    const r = await lihat('penyewa-1', '/chat/RA-TELAT');
    expect(r.body).toMatchObject({ status: 'telat', bisaKirim: true });
  });

  it('membuka percakapan sendiri tidak menandai pesan sendiri sebagai dibaca', async () => {
    const r = await lihat('penyewa-1', '/chat/RA-TELAT');
    expect(r.body.pesan.every((m: { dibacaPada: string | null }) => m.dibacaPada === null)).toBe(true);
    expect(await db.pesanChat.count({ where: { pesanan: { kode: 'RA-TELAT' }, dibacaPada: { not: null } } })).toBe(0);
  });

  it('percakapan orang lain (404) tidak menandai apa pun', async () => {
    expect((await lihat('mitra-b', '/chat/RA-TELAT')).status).toBe(404);
    expect((await lihat('penyewa-2', '/chat/RA-TELAT')).status).toBe(404);
    expect(await db.pesanChat.count({ where: { pesanan: { kode: 'RA-TELAT' }, dibacaPada: { not: null } } })).toBe(0);
  });

  it('belumDibaca menghitung semua pesan lawan yang belum dibaca', async () => {
    const r = await lihat('mitra-a', '/chat');
    expect(cari(r.body, 'RA-TELAT')).toMatchObject({
      belumDibaca: 2, pesanTerakhir: { isi: 'Sekitar jam 5.', dari: 'penyewa', dariSaya: false },
    });
  });

  it('penyedia bisa memulai percakapan di pesanan menunggu; plat tetap tertutup untuk penyewa', async () => {
    const r = await kirim('mitra-a', 'RA-SEGAR', 'Halo, unitnya siap. Mau diantar jam berapa?');
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ dari: 'penyedia', dariSaya: true });

    const daftar = await lihat('penyewa-2', '/chat');
    expect(cari(daftar.body, 'RA-SEGAR')).toMatchObject({
      status: 'menunggu', bisaKirim: true, plat: null, belumDibaca: 1,
      lawan: { peran: 'penyedia', nama: 'Rental A' },
    });
    expect((await lihat('penyewa-2', '/chat/RA-SEGAR')).body.plat).toBeNull();
    // Pesan paling baru di seluruh percakapan mitra A, jadi paling atas.
    expect(kodeDi((await lihat('mitra-a', '/chat')).body)[0]).toBe('RA-SEGAR');
  });

  it('daftar penyewa memberi status dan bisaKirim per pesanan', async () => {
    const r = await lihat('penyewa-1', '/chat');
    const ringkas = Object.fromEntries(
      r.body.map((p: { kode: string; status: string; bisaKirim: boolean }) => [p.kode, [p.status, p.bisaKirim]]),
    );
    expect(ringkas).toMatchObject({
      'RA-TOLAK': ['ditolak', false],
      'RA-BASI': ['kedaluwarsa', false],
      'RA-TELAT': ['telat', true],
      'RA-JALAN': ['berjalan', true],
    });
  });

  it('daftar hanya berisi pesanan milik pengguna itu', async () => {
    const dua = kodeDi((await lihat('penyewa-2', '/chat')).body);
    expect(new Set(dua)).toEqual(new Set(['RA-TUNGGU', 'RA-SELESAI', 'RA-SEGAR']));
    expect(kodeDi((await lihat('mitra-b', '/chat')).body)).toEqual(['RA-B']);
  });

  it('tepat 2000 karakter setelah spasi tepi dibuang diterima', async () => {
    const r = await kirim('penyewa-1', 'RA-TELAT', `   ${'x'.repeat(2000)}   `);
    expect(r.status).toBe(201);
    expect(r.body.isi).toHaveLength(2000);
  });

  it('emoji dihitung per karakter, sama dengan CHECK di database', async () => {
    // 2000 emoji = 4000 unit UTF-16, tapi 2000 karakter.
    expect((await kirim('penyewa-1', 'RA-TELAT', '😀'.repeat(2000))).status).toBe(201);
  });

  it('isi yang lolos DTO tapi ditolak CHECK database dijawab 400, bukan 500', async () => {
    // Validator tidak menghitung variation selector, char_length() menghitungnya.
    const sebelum = await db.pesanChat.count();
    expect((await kirim('penyewa-1', 'RA-TELAT', `a${'️'.repeat(2000)}`)).status).toBe(400);
    expect(await db.pesanChat.count()).toBe(sebelum);
  });

  it('karakter NUL ditolak 400, bukan 500', async () => {
    expect((await kirim('penyewa-1', 'RA-TELAT', 'halo\u0000dunia')).status).toBe(400);
  });

  it('body tanpa isi ditolak 400', async () => {
    const r = await minta().post('/chat/RA-TELAT').set(auth('penyewa-1')).send({});
    expect(r.status).toBe(400);
  });
});

describe('Kode pesanan di URL', () => {
  it('kode berisi karakter NUL dijawab 404, bukan 500', async () => {
    expect((await lihat('penyewa-1', '/chat/RA-JALAN%00')).status).toBe(404);
    expect((await kirim('penyewa-1', 'RA-JALAN%00', 'halo')).status).toBe(404);
  });
});

describe('Kode pesanan di URL: encoding rusak', () => {
  it('percent-encoding yang bukan UTF-8 sah tidak membuat 500', async () => {
    for (const kode of ['%FF', 'RA-%C0%80', '%ED%A0%80', 'RA-%E2%82']) {
      const baca = await lihat('penyewa-1', `/chat/${kode}`);
      const tulis = await kirim('penyewa-1', kode, 'halo');
      const detail = await lihat('penyewa-1', `/pesanan/${kode}`);
      const terima = await minta().post(`/mitra/pesanan/${kode}/terima`).set(auth('mitra-a'));
      for (const r of [baca, tulis, detail, terima]) {
        expect({ kode, status: r.status < 500 }).toEqual({ kode, status: true });
      }
    }
  });

  it('kode yang sangat panjang dijawab 404, bukan 500', async () => {
    const kode = 'RA-' + 'x'.repeat(5000);
    expect((await lihat('penyewa-1', `/chat/${kode}`)).status).toBe(404);
    expect((await kirim('penyewa-1', kode, 'halo')).status).toBe(404);
  });
});
