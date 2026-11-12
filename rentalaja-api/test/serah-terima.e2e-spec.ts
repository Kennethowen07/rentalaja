/**
 * Serah terima (antar/ambil) dan klaim kerusakan. Data uji milik file ini
 * sendiri; jalankan dengan database test sendiri, mis.
 *   NAMA_DB_TEST=rentalaja_test_a npx vitest run --config ./vitest.config.e2e.ts test/serah-terima.e2e-spec.ts
 *
 * Waktu diatur lewat data (mulai, selesai, kembaliPada di masa lalu), bukan
 * dengan menunggu. Test di dalam satu file berjalan berurutan dan sebagian
 * memakai keadaan dari test sebelumnya (mis. antar dicatat dulu baru ambil).
 *
 * Mitra A:
 *   unit-satu  RA-ANTAR     berjalan, mulai hari ini (WITA), selesai lusa
 *   unit-dua   RA-TELAT     berjalan, mulai 3 hari lalu, jadwal kembali kemarin (telat)
 *   unit-tiga  RA-AWAL      berjalan, mulai 2 hari lalu, selesai 2 hari lagi; antar sudah lengkap
 *   unit-empat RA-NANTI     berjalan, mulai besok (belum ada jadwal)
 *   unit-lima  RA-MENUNGGU  menunggu, mulai hari ini (bukan pesanan berjalan)
 *   unit-lima  RA-LUNAS     selesai tepat waktu 6 hari lalu, tanpa klaim (dana sudah dilepas)
 *   unit-enam  RA-LAMA      selesai, kembali telat 1 hari, 3 hari lalu; klaim masih terbuka
 * Mitra B:
 *   unit-b     RA-B         berjalan, mulai hari ini. Tidak boleh bisa disentuh mitra A.
 * mitra-baru: akun berperan MITRA tapi belum punya baris mitra (403).
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { JenisSerah, StatusPesanan } from '../src/generated/prisma/enums.js';
import { rincianHarga } from '../src/umum/harga.js';
import { awalHariWita, HARI, JAM, MENIT, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const jam9 = (geser: number) => new Date(pukulWita(sekarang, geser, 9));
// Satu menit setelah tengah malam WITA: selalu "hari ini" kapan pun test jalan.
const awalHariIni = new Date(awalHariWita(sekarang) + MENIT);

const HARGA: Record<string, number> = {
  'unit-satu': 70_000,
  'unit-dua': 60_000,
  'unit-tiga': 50_000,
  'unit-empat': 45_000,
  'unit-lima': 55_000,
  'unit-enam': 65_000,
  'unit-b': 40_000,
};

let app: INestApplication;
const token: Record<string, string> = {};

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });
const put = (siapa: string | null, kode: string, jenis: string, body: object) => {
  const r = minta().put(`/mitra/serah-terima/${kode}/${jenis}`);
  return (siapa ? r.set(auth(siapa)) : r).send(body);
};
const jadwal = (siapa: string, tab?: string) =>
  minta()
    .get(`/mitra/serah-terima${tab ? `?tab=${tab}` : ''}`)
    .set(auth(siapa));
const selesaikan = (siapa: string | null, kode: string) => {
  const r = minta().post(`/mitra/klaim/${kode}/selesai`);
  return siapa ? r.set(auth(siapa)) : r;
};

const KONDISI = [
  { label: 'Odometer', nilai: '18.204 km' },
  { label: 'Bensin', nilai: 'Setengah' },
];
const FOTO = {
  depan: '/serah-terima/scoopy-depan.webp',
  belakang: '/serah-terima/scoopy-belakang.webp',
  kiri: '/serah-terima/scoopy-kiri.webp',
  kanan: '/serah-terima/scoopy-kanan.webp',
};
const FOTO_SEED = {
  depan: '/seed/depan.webp',
  belakang: '/seed/belakang.webp',
  kiri: '/seed/kiri.webp',
  kanan: '/seed/kanan.webp',
};

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
  const penyewa = await pengguna('penyewa-1@uji.test', 'PENYEWA');
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  const unit = (mitraId: string, slug: string) =>
    db.unit.create({
      data: {
        mitraId, slug, nama: slug, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'Skutik 110cc',
        spesifikasi: 'matic 110cc', tahun: 2023, hargaPerHari: HARGA[slug], area: 'Canggu',
      },
    });
  const u: Record<string, string> = {};
  for (const slug of ['unit-satu', 'unit-dua', 'unit-tiga', 'unit-empat', 'unit-lima', 'unit-enam']) {
    u[slug] = (await unit(mitraA.id, slug)).id;
  }
  u['unit-b'] = (await unit(mitraB.id, 'unit-b')).id;

  const pesanan = (
    kode: string,
    slug: string,
    mulai: Date,
    hari: number,
    status: StatusPesanan = 'BERJALAN',
    lain: { kembaliPada?: Date; dibuatPada?: Date } = {},
  ) => {
    const h = rincianHarga(HARGA[slug], hari);
    const dibuatPada = lain.dibuatPada ?? new Date(mulai.getTime() - 2 * HARI);
    return db.pesanan.create({
      data: {
        kode, unitId: u[slug], penyewaId: penyewa.id, mulai, selesai: new Date(mulai.getTime() + hari * HARI),
        status, hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal,
        biayaLayanan: h.biayaLayanan, total: h.total, diantar: true, titik: 'Villa Canggu',
        dibuatPada, diterimaPada: status === 'MENUNGGU' ? null : dibuatPada, kembaliPada: lain.kembaliPada ?? null,
      },
    });
  };
  /** Catatan lengkap (empat foto dan kondisi) yang sudah ada sebelum test. */
  const catatanLengkap = (pesananId: string, jenis: JenisSerah, dicatatPada: Date) =>
    db.serahTerima.create({
      data: {
        pesananId, jenis, kondisi: KONDISI, dicatatPada,
        foto: {
          create: [
            { sisi: 'DEPAN', url: FOTO_SEED.depan },
            { sisi: 'BELAKANG', url: FOTO_SEED.belakang },
            { sisi: 'KIRI', url: FOTO_SEED.kiri },
            { sisi: 'KANAN', url: FOTO_SEED.kanan },
          ],
        },
      },
    });

  await pesanan('RA-ANTAR', 'unit-satu', awalHariIni, 2);
  await pesanan('RA-TELAT', 'unit-dua', jam9(-3), 2);
  const awal = await pesanan('RA-AWAL', 'unit-tiga', jam9(-2), 4);
  await catatanLengkap(awal.id, 'ANTAR', jam9(-2));
  await pesanan('RA-NANTI', 'unit-empat', jam9(1), 2);
  await pesanan('RA-MENUNGGU', 'unit-lima', awalHariIni, 1, 'MENUNGGU', { dibuatPada: new Date(sekarang - MENIT) });

  // Selesai tepat waktu 6 hari lalu, tanpa klaim: dana sudah lewat 24 jam.
  const lunas = await pesanan('RA-LUNAS', 'unit-lima', jam9(-8), 2, 'SELESAI', { kembaliPada: jam9(-6) });
  await catatanLengkap(lunas.id, 'ANTAR', jam9(-8));
  await catatanLengkap(lunas.id, 'AMBIL', jam9(-6));

  // Jadwal kembali 4 hari lalu, kembali 3 hari lalu (telat tepat 1 hari),
  // klaim belum diselesaikan: dana ditahan walau 24 jam sudah lewat.
  const lama = await pesanan('RA-LAMA', 'unit-enam', jam9(-6), 2, 'SELESAI', { kembaliPada: jam9(-3) });
  await catatanLengkap(lama.id, 'ANTAR', new Date(jam9(-6).getTime() + JAM));
  await catatanLengkap(lama.id, 'AMBIL', jam9(-3));
  await db.klaimKerusakan.create({
    data: { pesananId: lama.id, nominal: 250_000, keterangan: 'Velg depan penyok', diajukanPada: jam9(-3) },
  });

  await pesanan('RA-B', 'unit-b', awalHariIni, 1);
}

beforeAll(async () => {
  await siapkanData();
  const modul = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modul.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  for (const siapa of ['mitra-a', 'mitra-b', 'mitra-baru', 'penyewa-1']) {
    const r = await minta().post('/auth/masuk').send({ email: `${siapa}@uji.test`, kataSandi: KATA_SANDI });
    token[siapa] = r.body.token;
  }
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

type Klaim = { nominal: number; keterangan: string; diajukanPada: string; diselesaikanPada: string | null };
type Baris = {
  id: string;
  status: string;
  telat: boolean;
  statusPesanan: string;
  statusDana: string;
  sisi: { sisi: string; label: string; foto: string | null }[];
  kondisi: { label: string; nilai: string }[];
  klaim: Klaim | null;
  denda: { hariTelat: number; nominal: number } | null;
  kembaliPada: string | null;
};
const cari = (daftar: Baris[], id: string) => daftar.find((b) => b.id === id);
const idDari = (daftar: Baris[]) => daftar.map((b) => b.id);

describe('Jadwal serah terima', () => {
  it('hari ini: antar hari ini, antar tertinggal, ambil telat; urut menurut waktu', async () => {
    const r = await jadwal('mitra-a');
    expect(r.status).toBe(200);
    expect(r.body.tab).toBe('hari-ini');
    // Tidak muncul: RA-AWAL (antar lengkap, ambil belum jatuh tempo), RA-NANTI
    // (mulai besok), RA-MENUNGGU (belum berjalan), RA-LUNAS/RA-LAMA (selesai),
    // RA-B (mitra lain).
    expect(idDari(r.body.daftar)).toEqual(['RA-TELAT-antar', 'RA-TELAT-ambil', 'RA-ANTAR-antar']);
    expect(r.body.jumlah).toEqual({ 'hari-ini': 3, 'menunggu-foto': 0 });
    expect(Math.abs(new Date(r.body.sekarang).getTime() - Date.now())).toBeLessThan(60_000);
  });

  it('bentuk baris mengikuti JadwalSerah', async () => {
    const r = await jadwal('mitra-a');
    const antar = cari(r.body.daftar, 'RA-ANTAR-antar')!;
    expect(antar).toMatchObject({
      pesananId: 'RA-ANTAR',
      jenis: 'antar',
      status: 'jadwal',
      unit: 'unit-satu',
      plat: 'DK unit-satu',
      penyewa: 'penyewa-1',
      telepon: '0812',
      waktu: awalHariIni.toISOString(),
      mulai: awalHariIni.toISOString(),
      titik: 'Villa Canggu',
      diantar: true,
      telat: false,
      statusPesanan: 'berjalan',
      statusDana: 'ditahan',
      kondisi: [],
      catatan: null,
      dicatatPada: null,
      klaim: null,
      denda: null,
      kembaliPada: null,
    });
    // CatatanSerah.sisi di frontend memakai { label, foto }; sisi adalah
    // kunci tetap, label sama dengan teks Indonesia di SerahTerimaPanel.
    expect(antar.sisi).toEqual([
      { sisi: 'depan', label: 'depan', foto: null },
      { sisi: 'belakang', label: 'belakang', foto: null },
      { sisi: 'kiri', label: 'kiri', foto: null },
      { sisi: 'kanan', label: 'kanan', foto: null },
    ]);
  });

  it('ambil yang lewat jadwal: telat, denda dicatat = hargaPerHari x hari telat (dibulatkan ke atas)', async () => {
    const r = await jadwal('mitra-a');
    const ambil = cari(r.body.daftar, 'RA-TELAT-ambil')!;
    expect(ambil.telat).toBe(true);
    expect(ambil.statusPesanan).toBe('telat');
    // Denda tidak menahan atau memindahkan dana: tetap "ditahan" biasa.
    expect(ambil.statusDana).toBe('ditahan');
    const hari = Math.ceil((Date.now() - jam9(-1).getTime()) / HARI);
    expect(ambil.denda).toEqual({ hariTelat: hari, nominal: hari * HARGA['unit-dua'] });
    // Baris antar dari pesanan yang sama tidak telat dan tidak punya denda.
    const antar = cari(r.body.daftar, 'RA-TELAT-antar')!;
    expect(antar.telat).toBe(false);
    expect(antar.denda).toBeNull();
  });

  it('mitra lain hanya melihat jadwal miliknya', async () => {
    const r = await jadwal('mitra-b');
    expect(r.status).toBe(200);
    expect(idDari(r.body.daftar)).toEqual(['RA-B-antar']);
  });

  it('tab selesai: riwayat catatan lengkap, terbaru di atas, dengan status dana masing-masing', async () => {
    const r = await jadwal('mitra-a', 'selesai');
    expect(r.status).toBe(200);
    // RA-AWAL-antar ikut: catatannya lengkap walau pesanannya masih berjalan.
    expect(idDari(r.body.daftar)).toEqual([
      'RA-AWAL-antar',
      'RA-LAMA-ambil',
      'RA-LAMA-antar',
      'RA-LUNAS-ambil',
      'RA-LUNAS-antar',
    ]);
    expect(cari(r.body.daftar, 'RA-AWAL-antar')!.statusPesanan).toBe('berjalan');
    // jumlah tetap untuk tab hari-ini dan menunggu-foto.
    expect(r.body.jumlah).toEqual({ 'hari-ini': 3, 'menunggu-foto': 0 });

    const lama = cari(r.body.daftar, 'RA-LAMA-ambil')!;
    // Klaim terbuka menahan dana walau 24 jam setelah kembali sudah lewat.
    expect(lama.statusDana).toBe('ditahan_klaim');
    expect(lama.klaim).toMatchObject({ nominal: 250_000, keterangan: 'Velg depan penyok', diselesaikanPada: null });
    // Telat tepat 1 hari, dihitung sampai kembaliPada (bukan sampai sekarang).
    expect(lama.denda).toEqual({ hariTelat: 1, nominal: HARGA['unit-enam'] });
    // Klaim hanya ditampilkan di baris ambil.
    expect(cari(r.body.daftar, 'RA-LAMA-antar')!.klaim).toBeNull();

    const lunas = cari(r.body.daftar, 'RA-LUNAS-ambil')!;
    expect(lunas.statusDana).toBe('dilepas');
    expect(lunas.denda).toBeNull();
    expect(lunas.status).toBe('selesai');
  });

  it('tab menunggu-foto kosong di awal', async () => {
    const r = await jadwal('mitra-a', 'menunggu-foto');
    expect(r.status).toBe(200);
    expect(r.body.daftar).toEqual([]);
  });

  it('otorisasi dan validasi: tanpa login 401, penyewa 403, mitra tanpa usaha 403, tab salah 400', async () => {
    expect((await minta().get('/mitra/serah-terima')).status).toBe(401);
    expect((await jadwal('penyewa-1')).status).toBe(403);
    expect((await jadwal('mitra-baru')).status).toBe(403);
    expect((await jadwal('mitra-a', 'kemarin')).status).toBe(400);
    expect((await minta().get('/mitra/serah-terima?tab=selesai&mitraId=x').set(auth('mitra-a'))).status).toBe(400);
  });
});

describe('Mencatat serah terima', () => {
  it('otorisasi: tanpa login 401, penyewa 403, mitra tanpa usaha 403', async () => {
    expect((await put(null, 'RA-ANTAR', 'antar', { kondisi: KONDISI })).status).toBe(401);
    expect((await put('penyewa-1', 'RA-ANTAR', 'antar', { kondisi: KONDISI })).status).toBe(403);
    expect((await put('mitra-baru', 'RA-ANTAR', 'antar', { kondisi: KONDISI })).status).toBe(403);
  });

  it('pesanan mitra lain 404, kode tidak ada 404', async () => {
    expect((await put('mitra-a', 'RA-B', 'antar', { kondisi: KONDISI })).status).toBe(404);
    expect((await put('mitra-b', 'RA-ANTAR', 'antar', { kondisi: KONDISI })).status).toBe(404);
    expect((await put('mitra-a', 'RA-TIDAK-ADA', 'antar', { kondisi: KONDISI })).status).toBe(404);
    // Tidak ada yang tertulis untuk RA-B.
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-B' } } })).toBe(0);
  });

  it('validasi body: 400 untuk kiriman kosong atau bentuk yang salah', async () => {
    const salah: object[] = [
      {},
      { foto: {} },
      { kondisi: [] },
      { kondisi: [{ label: '', nilai: 'Penuh' }] },
      { kondisi: [{ label: 'Bensin' }] },
      { kondisi: 'bersih' },
      { foto: { depan: 'javascript:alert(1)' } },
      { foto: { depan: 'ftp://contoh/a.webp' } },
      { foto: { atas: '/a.webp' } },
      { kondisi: KONDISI, status: 'SELESAI' },
      { catatan: 'x'.repeat(501) },
      // foto harus objek per sisi, bukan array atau teks. Array dulu lolos
      // ValidateNested dan diam-diam diabaikan (kondisinya tetap tertulis).
      { foto: [] },
      { kondisi: KONDISI, foto: [{ depan: FOTO.depan }] },
      { foto: 'x' },
      { kondisi: [null] },
      { kondisi: ['Bensin'] },
    ];
    for (const body of salah) {
      expect((await put('mitra-a', 'RA-ANTAR', 'antar', body)).status, JSON.stringify(body)).toBe(400);
    }
    expect((await put('mitra-a', 'RA-ANTAR', 'kembali', { kondisi: KONDISI })).status).toBe(400);
  });

  it('validasi klaim: hanya saat ambil, nominal bulat 1..100 juta, keterangan minimal 3 karakter', async () => {
    const klaimSalah = [
      { nominal: 0, keterangan: 'Spion retak' },
      { nominal: 1.5, keterangan: 'Spion retak' },
      { nominal: 100_000_001, keterangan: 'Spion retak' },
      { nominal: '100000', keterangan: 'Spion retak' },
      { nominal: 100_000, keterangan: 'ab' },
      { nominal: 100_000 },
      // klaim harus satu objek. Array dulu lolos validasi lalu meledak di
      // Prisma (nominal kosong) sebagai 500.
      [],
      [{ nominal: 100_000, keterangan: 'Spion retak' }],
      'Spion retak',
    ];
    for (const klaim of klaimSalah) {
      expect((await put('mitra-a', 'RA-AWAL', 'ambil', { klaim })).status, JSON.stringify(klaim)).toBe(400);
    }
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-AWAL' }, jenis: 'AMBIL' } })).toBe(0);
    const r = await put('mitra-a', 'RA-ANTAR', 'antar', { klaim: { nominal: 100_000, keterangan: 'Spion retak' } });
    expect(r.status).toBe(400);
    expect(await db.klaimKerusakan.count()).toBe(1); // hanya klaim seed RA-LAMA
  });

  it('hanya pesanan berjalan: menunggu 409, selesai yang diubah 409, selesai yang dikirim ulang identik 200', async () => {
    expect((await put('mitra-a', 'RA-MENUNGGU', 'antar', { kondisi: KONDISI })).status).toBe(409);
    expect((await put('mitra-a', 'RA-LUNAS', 'ambil', { catatan: 'tambahan' })).status).toBe(409);
    const sama = await put('mitra-a', 'RA-LUNAS', 'ambil', { kondisi: KONDISI, foto: FOTO_SEED });
    expect(sama.status).toBe(200);
    expect(sama.body.status).toBe('selesai');
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-MENUNGGU' } } })).toBe(0);
  });

  it('pesanan yang belum masuk hari sewanya (mulai besok) belum bisa dicatat: 409', async () => {
    // Tanpa aturan ini mitra bisa mencatat antar lalu ambil sebelum sewa
    // dimulai, membuat pesanan SELESAI dan memulai hitungan pelepasan dana.
    expect((await put('mitra-a', 'RA-NANTI', 'antar', { kondisi: KONDISI, foto: FOTO })).status).toBe(409);
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-NANTI' } } })).toBe(0);
  });

  it('ambil ditolak sebelum catatan antar lengkap', async () => {
    const r = await put('mitra-a', 'RA-TELAT', 'ambil', { kondisi: KONDISI, foto: FOTO });
    expect(r.status).toBe(409);
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-TELAT' } } })).toBe(0);
  });

  it('kondisi saja -> menunggu foto; ambil masih ditolak; empat foto -> selesai; lalu terkunci', async () => {
    let r = await put('mitra-a', 'RA-TELAT', 'antar', { kondisi: KONDISI, catatan: '  Diantar ke lobi  ' });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('menunggu-foto');
    expect(r.body.catatan).toBe('Diantar ke lobi');

    const tab = await jadwal('mitra-a', 'menunggu-foto');
    expect(idDari(tab.body.daftar)).toEqual(['RA-TELAT-antar']);
    expect(tab.body.jumlah).toEqual({ 'hari-ini': 2, 'menunggu-foto': 1 });

    // Antar setengah jadi belum cukup untuk mencatat unit kembali.
    expect((await put('mitra-a', 'RA-TELAT', 'ambil', { kondisi: KONDISI, foto: FOTO })).status).toBe(409);

    r = await put('mitra-a', 'RA-TELAT', 'antar', { foto: FOTO });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('selesai');
    expect(r.body.sisi.every((s: { foto: string | null }) => s.foto)).toBe(true);
    // Bagian yang tidak dikirim tidak terhapus.
    expect(r.body.kondisi).toEqual(KONDISI);
    expect(r.body.catatan).toBe('Diantar ke lobi');

    // Kiriman ulang yang identik tetap 200; yang mengubah bukti ditolak.
    expect((await put('mitra-a', 'RA-TELAT', 'antar', { foto: FOTO })).status).toBe(200);
    const ubah = await put('mitra-a', 'RA-TELAT', 'antar', { kondisi: [{ label: 'Bensin', nilai: 'Penuh' }] });
    expect(ubah.status).toBe(409);
    expect((await put('mitra-a', 'RA-TELAT', 'antar', { foto: { depan: '/lain.webp' } })).status).toBe(409);
    const c = await db.serahTerima.findFirstOrThrow({
      where: { pesanan: { kode: 'RA-TELAT' }, jenis: 'ANTAR' },
      include: { foto: true },
    });
    expect(c.foto.find((f) => f.sisi === 'DEPAN')!.url).toBe(FOTO.depan);
  });

  it('foto digabung per sisi: dua kiriman setengah-setengah menjadi lengkap', async () => {
    let r = await put('mitra-a', 'RA-ANTAR', 'antar', {
      kondisi: KONDISI,
      foto: { depan: FOTO.depan, belakang: FOTO.belakang },
    });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('menunggu-foto');
    // Sisi yang belum dikirim boleh diganti selama catatan belum lengkap.
    r = await put('mitra-a', 'RA-ANTAR', 'antar', { foto: { belakang: '/serah-terima/ulang-belakang.webp' } });
    expect(r.status).toBe(200);
    r = await put('mitra-a', 'RA-ANTAR', 'antar', { foto: { kiri: FOTO.kiri, kanan: FOTO.kanan } });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('selesai');
    expect(r.body.sisi).toEqual([
      { sisi: 'depan', label: 'depan', foto: FOTO.depan },
      { sisi: 'belakang', label: 'belakang', foto: '/serah-terima/ulang-belakang.webp' },
      { sisi: 'kiri', label: 'kiri', foto: FOTO.kiri },
      { sisi: 'kanan', label: 'kanan', foto: FOTO.kanan },
    ]);
    expect(await db.fotoSerah.count({ where: { serahTerima: { pesanan: { kode: 'RA-ANTAR' } } } })).toBe(4);

    // Antar yang lengkap pindah dari "hari ini" ke riwayat "selesai".
    const hariIni = await jadwal('mitra-a');
    expect(idDari(hariIni.body.daftar)).not.toContain('RA-ANTAR-antar');
    const riwayat = await jadwal('mitra-a', 'selesai');
    expect(idDari(riwayat.body.daftar)).toContain('RA-ANTAR-antar');
  });

  it('ambil lengkap dengan klaim: pesanan selesai, kembaliPada terisi, dana ditahan klaim, denda tercatat', async () => {
    const body = { kondisi: KONDISI, foto: FOTO, klaim: { nominal: 150_000, keterangan: 'Spion kiri retak' } };
    const r = await put('mitra-a', 'RA-TELAT', 'ambil', body);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('selesai');
    expect(r.body.statusPesanan).toBe('selesai');
    expect(r.body.telat).toBe(false);
    expect(r.body.statusDana).toBe('ditahan_klaim');
    expect(r.body.klaim).toMatchObject({ nominal: 150_000, keterangan: 'Spion kiri retak', diselesaikanPada: null });
    const kembali = new Date(r.body.kembaliPada).getTime();
    expect(Math.abs(kembali - Date.now())).toBeLessThan(60_000);
    // Denda tetap tercatat setelah kembali, dihitung sampai kembaliPada.
    const hari = Math.ceil((kembali - jam9(-1).getTime()) / HARI);
    expect(r.body.denda).toEqual({ hariTelat: hari, nominal: hari * HARGA['unit-dua'] });

    const p = await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-TELAT' } });
    expect(p.status).toBe('SELESAI');
    expect(p.kembaliPada!.getTime()).toBe(kembali);
    // Harga yang dibekukan tidak berubah karena denda.
    expect(p.total).toBe(rincianHarga(HARGA['unit-dua'], 2).total);

    // Idempoten: kiriman ulang yang sama dijawab 200 tanpa perubahan.
    const ulang = await put('mitra-a', 'RA-TELAT', 'ambil', body);
    expect(ulang.status).toBe(200);
    expect(ulang.body.kembaliPada).toBe(r.body.kembaliPada);
    // Tapi pesanan yang sudah selesai tidak bisa diubah lagi.
    expect((await put('mitra-a', 'RA-TELAT', 'ambil', { catatan: 'tambahan' })).status).toBe(409);
    const klaimLain = { ...body, klaim: { nominal: 999_000, keterangan: 'Tambah klaim' } };
    expect((await put('mitra-a', 'RA-TELAT', 'ambil', klaimLain)).status).toBe(409);
    expect((await db.klaimKerusakan.findFirstOrThrow({ where: { pesanan: { kode: 'RA-TELAT' } } })).nominal).toBe(
      150_000,
    );

    // Pesanan yang sudah selesai keluar dari jadwal hari ini.
    const hariIni = await jadwal('mitra-a');
    expect(idDari(hariIni.body.daftar).filter((id) => id.startsWith('RA-TELAT'))).toEqual([]);
  });

  describe('unit kembali lebih awal (RA-AWAL)', () => {
    it('ambil setengah jadi dengan klaim: muncul di menunggu-foto walau belum jatuh tempo', async () => {
      const r = await put('mitra-a', 'RA-AWAL', 'ambil', {
        kondisi: KONDISI,
        klaim: { nominal: 100_000, keterangan: 'Lecet bodi kanan' },
      });
      expect(r.status).toBe(200);
      expect(r.body.status).toBe('menunggu-foto');
      expect(r.body.statusPesanan).toBe('berjalan');
      expect(r.body.kembaliPada).toBeNull();
      expect(r.body.klaim).toMatchObject({ nominal: 100_000 });

      const tab = await jadwal('mitra-a', 'menunggu-foto');
      expect(idDari(tab.body.daftar)).toEqual(['RA-AWAL-ambil']);
      expect((await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-AWAL' } })).status).toBe('BERJALAN');
    });

    it('klaim belum bisa diselesaikan selama pesanan berjalan (409)', async () => {
      expect((await selesaikan('mitra-a', 'RA-AWAL')).status).toBe(409);
      const k = await db.klaimKerusakan.findFirstOrThrow({ where: { pesanan: { kode: 'RA-AWAL' } } });
      expect(k.diselesaikanPada).toBeNull();
    });

    it('klaim yang diajukan ulang sebelum catatan lengkap menimpa yang lama', async () => {
      const r = await put('mitra-a', 'RA-AWAL', 'ambil', {
        klaim: { nominal: 120_000, keterangan: 'Lecet bodi kanan dan spion' },
      });
      expect(r.status).toBe(200);
      const klaim = await db.klaimKerusakan.findMany({ where: { pesanan: { kode: 'RA-AWAL' } } });
      expect(klaim).toHaveLength(1);
      expect(klaim[0]).toMatchObject({ nominal: 120_000, keterangan: 'Lecet bodi kanan dan spion' });
    });

    it('empat foto melengkapi ambil: selesai sebelum jadwal, tanpa denda, dana ditahan klaim', async () => {
      const r = await put('mitra-a', 'RA-AWAL', 'ambil', { foto: FOTO });
      expect(r.status).toBe(200);
      expect(r.body.status).toBe('selesai');
      expect(r.body.statusPesanan).toBe('selesai');
      expect(r.body.denda).toBeNull();
      expect(r.body.statusDana).toBe('ditahan_klaim');
      expect(r.body.kondisi).toEqual(KONDISI);
      const p = await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-AWAL' } });
      expect(p.status).toBe('SELESAI');
      expect(p.kembaliPada!.getTime()).toBeLessThan(p.selesai.getTime());
    });
  });

  it('dua PUT ambil bersamaan untuk pesanan yang sama: keduanya 200, pesanan diselesaikan sekali', async () => {
    const body = { kondisi: KONDISI, foto: FOTO };
    const hasil = await Promise.all([
      put('mitra-a', 'RA-ANTAR', 'ambil', body),
      put('mitra-a', 'RA-ANTAR', 'ambil', body),
    ]);
    expect(hasil.map((r) => r.status)).toEqual([200, 200]);
    expect(hasil[0].body.kembaliPada).not.toBeNull();
    expect(hasil[0].body.kembaliPada).toBe(hasil[1].body.kembaliPada);
    // Tanpa klaim: dana ditahan biasa sampai 24 jam setelah kembali.
    expect(hasil[0].body.statusDana).toBe('ditahan');
    expect(hasil[0].body.klaim).toBeNull();
    expect(await db.serahTerima.count({ where: { pesanan: { kode: 'RA-ANTAR' }, jenis: 'AMBIL' } })).toBe(1);
    expect((await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-ANTAR' } })).status).toBe('SELESAI');
  });
});

describe('Klaim kerusakan', () => {
  it('otorisasi: tanpa login 401, penyewa 403, mitra tanpa usaha 403', async () => {
    expect((await selesaikan(null, 'RA-TELAT')).status).toBe(401);
    expect((await selesaikan('penyewa-1', 'RA-TELAT')).status).toBe(403);
    expect((await selesaikan('mitra-baru', 'RA-TELAT')).status).toBe(403);
  });

  it('mitra lain 404, kode tidak ada 404, pesanan tanpa klaim 404', async () => {
    expect((await selesaikan('mitra-b', 'RA-TELAT')).status).toBe(404);
    expect((await selesaikan('mitra-a', 'RA-TIDAK-ADA')).status).toBe(404);
    expect((await selesaikan('mitra-a', 'RA-ANTAR')).status).toBe(404);
    expect((await selesaikan('mitra-a', 'RA-LUNAS')).status).toBe(404);
    const k = await db.klaimKerusakan.findFirstOrThrow({ where: { pesanan: { kode: 'RA-TELAT' } } });
    expect(k.diselesaikanPada).toBeNull();
  });

  it('unit baru kembali: setelah klaim selesai dana menunggu 1x24 jam dari kembaliPada; tidak bisa dua kali', async () => {
    const r = await selesaikan('mitra-a', 'RA-TELAT');
    expect(r.status).toBe(200);
    expect(r.body.kode).toBe('RA-TELAT');
    expect(r.body.klaim.diselesaikanPada).not.toBeNull();
    expect(r.body.statusDana).toBe('ditahan');
    const p = await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-TELAT' } });
    expect(new Date(r.body.danaDilepasPada).getTime()).toBe(p.kembaliPada!.getTime() + HARI);

    expect((await selesaikan('mitra-a', 'RA-TELAT')).status).toBe(409);
  });

  it('unit kembali 3 hari lalu: dana langsung dilepas saat klaim selesai (denda tidak menahan dana)', async () => {
    // Dua permintaan bersamaan: hanya satu yang menulis waktu selesai.
    const hasil = await Promise.all([selesaikan('mitra-a', 'RA-LAMA'), selesaikan('mitra-a', 'RA-LAMA')]);
    expect(hasil.map((r) => r.status).sort()).toEqual([200, 409]);
    const r = hasil.find((x) => x.status === 200)!;
    expect(r.body.statusDana).toBe('dilepas');
    // Yang lebih lambat antara kembaliPada + 24 jam dan waktu klaim selesai.
    expect(r.body.danaDilepasPada).toBe(r.body.klaim.diselesaikanPada);
    expect(new Date(r.body.danaDilepasPada).getTime()).toBeGreaterThan(jam9(-3).getTime() + HARI);
    expect(r.body.klaim).toMatchObject({ nominal: 250_000, keterangan: 'Velg depan penyok' });

    const riwayat = await jadwal('mitra-a', 'selesai');
    const baris = cari(riwayat.body.daftar, 'RA-LAMA-ambil')!;
    expect(baris.statusDana).toBe('dilepas');
    expect(baris.klaim!.diselesaikanPada).toBe(r.body.klaim.diselesaikanPada);
    // Denda tetap tercatat apa adanya.
    expect(baris.denda).toEqual({ hariTelat: 1, nominal: HARGA['unit-enam'] });
  });

  it('klaim dari unit yang kembali lebih awal juga bisa diselesaikan', async () => {
    const r = await selesaikan('mitra-a', 'RA-AWAL');
    expect(r.status).toBe(200);
    expect(r.body.statusDana).toBe('ditahan');
    const p = await db.pesanan.findUniqueOrThrow({ where: { kode: 'RA-AWAL' } });
    expect(new Date(r.body.danaDilepasPada).getTime()).toBe(p.kembaliPada!.getTime() + HARI);
  });
});
