/**
 * Ubah harga dan status servis unit (PATCH /mitra/unit/:id), serta blokir
 * manual kalender (POST/DELETE /mitra/kalender/blokir).
 *
 * Mitra A:
 *   unit-bebas     kosong; punya satu pesanan SELESAI lama berharga 70.000
 *   unit-keluar    pesanan BERJALAN kemarin -> besok (sedang disewa)
 *   unit-telat     pesanan BERJALAN yang jadwal kembalinya sudah lewat
 *   unit-menunggu  pesanan MENUNGGU hari+3 09.00 -> hari+5 09.00
 * Mitra B: unit-b. Mitra A tidak boleh bisa menyentuhnya, dan sebaliknya.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { rincianHarga } from '../src/umum/harga.js';
import { awalHariWita, HARI, JAM, keIsoWita, pukulWita } from '../src/umum/waktu-wita.js';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const KATA_SANDI = 'sandi-uji-lokal';
const sekarang = Date.now();
const tanggal = (geser: number) => keIsoWita(pukulWita(sekarang, geser, 12));

let app: INestApplication;
const token: Record<string, string> = {};
const id: Record<string, string> = {};
let idPesananLama: string;

const minta = () => request(app.getHttpServer());
const auth = (siapa: string) => ({ Authorization: `Bearer ${token[siapa]}` });
const ubah = (siapa: string, unit: string, body: object) =>
  minta().patch(`/mitra/unit/${id[unit]}`).set(auth(siapa)).send(body);
const blokir = (siapa: string, body: object) =>
  minta().post('/mitra/kalender/blokir').set(auth(siapa)).send(body);

const servisKeDepan = (unit: string) =>
  db.blokirUnit.findMany({ where: { unitId: id[unit], jenis: 'SERVIS', selesai: { gt: new Date() } } });

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
  const mitraA = await db.mitra.create({ data: { pemilikId: pemilikA.id, nama: 'Rental A', area: 'Canggu' } });
  const mitraB = await db.mitra.create({ data: { pemilikId: pemilikB.id, nama: 'Rental B', area: 'Kuta' } });

  // Akun MITRA yang belum punya baris mitra.
  await pengguna('mitra-tanpa@uji.test', 'MITRA');

  for (const [mitraId, slug] of [
    [mitraA.id, 'unit-bebas'],
    [mitraA.id, 'unit-keluar'],
    [mitraA.id, 'unit-telat'],
    [mitraA.id, 'unit-menunggu'],
    [mitraA.id, 'unit-basi'],
    [mitraB.id, 'unit-b'],
  ]) {
    const u = await db.unit.create({
      data: {
        mitraId, slug, nama: slug, plat: `DK ${slug}`, kategori: 'MOTOR', jenis: 'uji',
        spesifikasi: 'uji', tahun: 2023, hargaPerHari: 70_000, area: 'Canggu',
      },
    });
    id[slug] = u.id;
  }

  let n = 0;
  const pesanan = (
    unit: string,
    mulai: number,
    hari: number,
    status: 'SELESAI' | 'BERJALAN' | 'MENUNGGU',
    dibuatPada?: number,
  ) => {
    const h = rincianHarga(70_000, hari);
    return db.pesanan.create({
      data: {
        kode: `RA-UK${++n}`, unitId: id[unit], penyewaId: penyewa.id,
        mulai: new Date(mulai), selesai: new Date(mulai + hari * HARI),
        hargaPerHari: h.perHari, jumlahHari: h.jumlahHari, subtotal: h.subtotal,
        biayaLayanan: h.biayaLayanan, total: h.total, diantar: false, titik: 'Kantor', status,
        dibuatPada: new Date(dibuatPada ?? (status === 'MENUNGGU' ? sekarang : mulai - HARI)),
        kembaliPada: status === 'SELESAI' ? new Date(mulai + hari * HARI) : null,
      },
    });
  };
  idPesananLama = (await pesanan('unit-bebas', pukulWita(sekarang, -10, 9), 2, 'SELESAI')).id;
  await pesanan('unit-keluar', pukulWita(sekarang, -1, 9), 2, 'BERJALAN');
  await pesanan('unit-telat', pukulWita(sekarang, -3, 9), 1, 'BERJALAN');
  await pesanan('unit-menunggu', pukulWita(sekarang, 3, 9), 2, 'MENUNGGU');
  // MENUNGGU yang dibuat 2 jam lalu: lewat batas balas 60 menit, jadi
  // secara logika sudah batal dan tidak lagi memegang slot hari+1 -> hari+3.
  await pesanan('unit-basi', pukulWita(sekarang, 1, 9), 2, 'MENUNGGU', sekarang - 2 * JAM);
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

describe('Ubah harga unit', () => {
  it('harga baru tersimpan, pesanan lama tetap memakai harga beku', async () => {
    const r = await ubah('mitra-a', 'unit-bebas', { hargaPerHari: 85_000 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: id['unit-bebas'], hargaPerHari: 85_000, status: 'kosong' });
    const lama = await db.pesanan.findUniqueOrThrow({ where: { id: idPesananLama } });
    expect(lama).toMatchObject({ hargaPerHari: 70_000, subtotal: 140_000 });
  });

  it('harga di bawah 10.000, bukan bilangan bulat, atau body kosong ditolak', async () => {
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: 9_999 })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: 12_500.5 })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', {})).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { sampai: tanggal(3) })).status).toBe(400);
  });

  it('unit mitra lain 404, penyewa 403', async () => {
    expect((await ubah('mitra-a', 'unit-b', { hargaPerHari: 50_000 })).status).toBe(404);
    expect((await ubah('penyewa-1', 'unit-bebas', { hargaPerHari: 50_000 })).status).toBe(403);
    const b = await db.unit.findUniqueOrThrow({ where: { id: id['unit-b'] } });
    expect(b.hargaPerHari).toBe(70_000);
  });
});

describe('Status servis', () => {
  it('servis tanpa tanggal: mulai sekarang sampai akhir hari lusa (WITA)', async () => {
    const r = await ubah('mitra-a', 'unit-bebas', { servis: true });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('servis');
    expect(new Date(r.body.sampai).getTime()).toBe(awalHariWita(sekarang) + 3 * HARI);
  });

  it('servis lagi dengan tanggal mengganti jadwal servis, tidak menumpuk', async () => {
    const r = await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: tanggal(6) });
    expect(r.status).toBe(200);
    const servis = await servisKeDepan('unit-bebas');
    expect(servis).toHaveLength(1);
    expect(keIsoWita(servis[0].selesai.getTime() - 1)).toBe(tanggal(6));
  });

  it('kalender menandai hari ini servis', async () => {
    const r = await minta().get(`/mitra/kalender?mulai=${tanggal(0)}&hari=1`).set(auth('mitra-a'));
    const u = r.body.unit.find((x: { id: string }) => x.id === id['unit-bebas']);
    expect(u.sel[0].keadaan).toBe('servis');
  });

  it('servis=false menghapus servis yang aktif dan akan datang', async () => {
    const r = await ubah('mitra-a', 'unit-bebas', { servis: false });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('kosong');
    expect(await servisKeDepan('unit-bebas')).toHaveLength(0);
  });

  it('409 untuk unit yang sedang disewa, termasuk yang telat kembali', async () => {
    expect((await ubah('mitra-a', 'unit-keluar', { servis: true })).status).toBe(409);
    expect((await ubah('mitra-a', 'unit-telat', { servis: true })).status).toBe(409);
    expect(await servisKeDepan('unit-keluar')).toHaveLength(0);
    expect(await servisKeDepan('unit-telat')).toHaveLength(0);
  });

  it('409 dari database kalau servis menimpa pesanan menunggu; servis yang berhenti sebelumnya boleh', async () => {
    const bentrok = await ubah('mitra-a', 'unit-menunggu', { servis: true, sampai: tanggal(3) });
    expect(bentrok.status).toBe(409);
    expect(await servisKeDepan('unit-menunggu')).toHaveLength(0);

    // Default berakhir tengah malam awal hari+3, pesanan mulai hari+3 09.00.
    const aman = await ubah('mitra-a', 'unit-menunggu', { servis: true });
    expect(aman.status).toBe(200);
    expect(aman.body.status).toBe('servis');
    await ubah('mitra-a', 'unit-menunggu', { servis: false });
  });

  it('harga dan servis dalam satu permintaan: gagal servis berarti harga juga tidak berubah', async () => {
    const r = await ubah('mitra-a', 'unit-keluar', { hargaPerHari: 99_000, servis: true });
    expect(r.status).toBe(409);
    const u = await db.unit.findUniqueOrThrow({ where: { id: id['unit-keluar'] } });
    expect(u.hargaPerHari).toBe(70_000);
  });
});

describe('Blokir manual kalender', () => {
  let idBlokir: string;

  it('membuat blokir dua hari penuh dan tampil di kalender', async () => {
    const r = await blokir('mitra-a', {
      unitId: id['unit-bebas'], mulai: tanggal(10), selesai: tanggal(11), catatan: '  Dipakai keluarga  ',
    });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      jenis: 'MANUAL', tanggalMulai: tanggal(10), tanggalSelesai: tanggal(11), catatan: 'Dipakai keluarga',
    });
    idBlokir = r.body.id;

    const k = await minta().get(`/mitra/kalender?mulai=${tanggal(10)}&hari=3`).set(auth('mitra-a'));
    const u = k.body.unit.find((x: { id: string }) => x.id === id['unit-bebas']);
    expect(u.sel.map((s: { keadaan: string }) => s.keadaan)).toEqual(['diblokir', 'diblokir', 'kosong']);
  });

  it('unit yang diblokir tidak bisa dipesan di rentang itu', async () => {
    const r = await minta().get(`/pencarian?mulai=${tanggal(10)}&durasi=1`);
    const u = r.body.unit.find((x: { slug: string }) => x.slug === 'unit-bebas');
    expect(u.kosong).toBe(false);
  });

  it('409 kalau menimpa tanggal yang sudah ada pesanannya', async () => {
    const r = await blokir('mitra-a', { unitId: id['unit-menunggu'], mulai: tanggal(4), selesai: tanggal(4) });
    expect(r.status).toBe(409);
  });

  it('400 untuk rentang terbalik, tanggal lewat, atau tanggal yang tidak ada', async () => {
    const u = id['unit-bebas'];
    expect((await blokir('mitra-a', { unitId: u, mulai: tanggal(5), selesai: tanggal(4) })).status).toBe(400);
    expect((await blokir('mitra-a', { unitId: u, mulai: tanggal(-3), selesai: tanggal(-2) })).status).toBe(400);
    expect((await blokir('mitra-a', { unitId: u, mulai: '2026-02-30', selesai: '2026-03-01' })).status).toBe(400);
    expect((await blokir('mitra-a', { unitId: u, mulai: tanggal(5) })).status).toBe(400);
  });

  it('unit mitra lain 404', async () => {
    const r = await blokir('mitra-a', { unitId: id['unit-b'], mulai: tanggal(5), selesai: tanggal(5) });
    expect(r.status).toBe(404);
  });

  it('hanya pemilik yang bisa menghapus; setelah dihapus 404', async () => {
    expect((await minta().delete(`/mitra/kalender/blokir/${idBlokir}`).set(auth('mitra-b'))).status).toBe(404);
    expect((await minta().delete(`/mitra/kalender/blokir/${idBlokir}`).set(auth('mitra-a'))).status).toBe(204);
    expect((await minta().delete(`/mitra/kalender/blokir/${idBlokir}`).set(auth('mitra-a'))).status).toBe(404);
    expect(await db.blokirUnit.count({ where: { id: idBlokir } })).toBe(0);
  });
});

describe('Akses dan validasi tambahan', () => {
  it('401 tanpa login untuk semua endpoint tulis', async () => {
    expect((await minta().patch(`/mitra/unit/${id['unit-bebas']}`).send({ hargaPerHari: 50_000 })).status).toBe(401);
    expect((await minta().post('/mitra/kalender/blokir').send({})).status).toBe(401);
    expect((await minta().delete('/mitra/kalender/blokir/apa-saja')).status).toBe(401);
  });

  it('403 untuk penyewa dan akun MITRA yang belum punya data mitra', async () => {
    const body = { unitId: id['unit-bebas'], mulai: tanggal(20), selesai: tanggal(20) };
    expect((await blokir('penyewa-1', body)).status).toBe(403);
    expect((await minta().delete('/mitra/kalender/blokir/apa-saja').set(auth('penyewa-1'))).status).toBe(403);
    expect((await blokir('mitra-tanpa', body)).status).toBe(403);
    expect((await ubah('mitra-tanpa', 'unit-bebas', { hargaPerHari: 50_000 })).status).toBe(403);
    expect(await db.blokirUnit.count({ where: { unitId: id['unit-bebas'], jenis: 'MANUAL' } })).toBe(0);
  });

  it('null tidak dianggap "tidak dikirim": 400, bukan 500 atau servis diam-diam dimatikan', async () => {
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: null })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: null })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: null })).status).toBe(400);
    const u = await db.unit.findUniqueOrThrow({ where: { id: id['unit-bebas'] } });
    expect(u.hargaPerHari).toBe(85_000);
  });

  it('tipe salah, di atas batas, field asing, dan tanggal servis yang salah ditolak 400', async () => {
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: '85000' })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: 25_000_001 })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: 'true' })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { hargaPerHari: 50_000, warna: 'merah' })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: '2026-02-30' })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: tanggal(-1) })).status).toBe(400);
    expect((await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: '12-11-2026' })).status).toBe(400);
    expect(await servisKeDepan('unit-bebas')).toHaveLength(0);
  });

  it('404 untuk unit yang tidak ada', async () => {
    const r = await minta().patch('/mitra/unit/tidak-ada').set(auth('mitra-a')).send({ hargaPerHari: 50_000 });
    expect(r.status).toBe(404);
  });
});

describe('Aturan waktu dan transaksi servis', () => {
  it('servis dimulai saat ini, bukan tengah malam', async () => {
    const sebelum = Date.now();
    const r = await ubah('mitra-a', 'unit-bebas', { servis: true, sampai: tanggal(1) });
    expect(r.status).toBe(200);
    const [s] = await servisKeDepan('unit-bebas');
    expect(s.mulai.getTime()).toBeGreaterThanOrEqual(sebelum - 1000);
    expect(s.selesai.getTime()).toBe(awalHariWita(sekarang) + 2 * HARI);
    await ubah('mitra-a', 'unit-bebas', { servis: false });
  });

  it('servis baru yang ditolak 409 tidak menghapus jadwal servis yang sudah ada', async () => {
    expect((await ubah('mitra-a', 'unit-menunggu', { servis: true })).status).toBe(200);
    const r = await ubah('mitra-a', 'unit-menunggu', { servis: true, sampai: tanggal(4) });
    expect(r.status).toBe(409);
    const servis = await servisKeDepan('unit-menunggu');
    expect(servis).toHaveLength(1);
    expect(servis[0].selesai.getTime()).toBe(awalHariWita(sekarang) + 3 * HARI);
    await ubah('mitra-a', 'unit-menunggu', { servis: false });
  });

  it('pesanan menunggu yang lewat batas balas tidak menghalangi servis maupun blokir', async () => {
    const s = await ubah('mitra-a', 'unit-basi', { servis: true, sampai: tanggal(2) });
    expect(s.status).toBe(200);
    expect((await ubah('mitra-a', 'unit-basi', { servis: false })).status).toBe(200);

    const b = await blokir('mitra-a', { unitId: id['unit-basi'], mulai: tanggal(1), selesai: tanggal(2) });
    expect(b.status).toBe(201);
    expect((await minta().delete(`/mitra/kalender/blokir/${b.body.id}`).set(auth('mitra-a'))).status).toBe(204);
  });

  it('harga baru tidak mengubah pesanan menunggu yang sudah ada', async () => {
    expect((await ubah('mitra-a', 'unit-menunggu', { hargaPerHari: 90_000 })).status).toBe(200);
    const p = await db.pesanan.findFirstOrThrow({ where: { unitId: id['unit-menunggu'] } });
    expect(p).toMatchObject({ hargaPerHari: 70_000, subtotal: 140_000 });
  });
});

describe('Blokir manual tambahan', () => {
  it('blokir hari ini dimulai tengah malam WITA; catatan kosong disimpan null', async () => {
    const r = await blokir('mitra-a', { unitId: id['unit-bebas'], mulai: tanggal(0), selesai: tanggal(0), catatan: '   ' });
    expect(r.status).toBe(201);
    expect(new Date(r.body.mulai).getTime()).toBe(awalHariWita(sekarang));
    expect(new Date(r.body.selesai).getTime()).toBe(awalHariWita(sekarang) + HARI);
    expect(r.body.catatan).toBeNull();
    expect((await minta().delete(`/mitra/kalender/blokir/${r.body.id}`).set(auth('mitra-a'))).status).toBe(204);
  });

  it('catatan lebih dari 200 karakter, unitId kosong, atau field asing ditolak 400', async () => {
    const u = id['unit-bebas'];
    expect((await blokir('mitra-a', { unitId: u, mulai: tanggal(5), selesai: tanggal(5), catatan: 'x'.repeat(201) })).status).toBe(400);
    expect((await blokir('mitra-a', { mulai: tanggal(5), selesai: tanggal(5) })).status).toBe(400);
    expect((await blokir('mitra-a', { unitId: u, mulai: tanggal(5), selesai: tanggal(5), jenis: 'SERVIS' })).status).toBe(400);
    // Hanya MANUAL: servis yang diakhiri test sebelumnya tetap ada sebagai riwayat.
    expect(await db.blokirUnit.count({ where: { unitId: u, jenis: 'MANUAL' } })).toBe(0);
  });

  it('hapus blokir yang tidak pernah ada: 404', async () => {
    expect((await minta().delete('/mitra/kalender/blokir/tidak-ada').set(auth('mitra-a'))).status).toBe(404);
  });
});

/**
 * Temuan QA stream B. Masing-masing dibuktikan gagal dulu sebelum diperbaiki.
 */
describe('QA: balapan, riwayat servis, dan kalender', () => {
  it('dua PATCH servis=true bersamaan tetap menyisakan satu jadwal servis ke depan', async () => {
    const hasil = await Promise.all([
      ubah('mitra-a', 'unit-bebas', { servis: true, sampai: tanggal(1) }),
      ubah('mitra-a', 'unit-bebas', { servis: true, sampai: tanggal(2) }),
    ]);
    expect(hasil.map((r) => r.status)).toEqual([200, 200]);
    const servis = await servisKeDepan('unit-bebas');
    expect(servis).toHaveLength(1);
    // Yang menang adalah request yang selesai terakhir, salah satu dari dua tanggal.
    expect([tanggal(1), tanggal(2)]).toContain(keIsoWita(servis[0].selesai.getTime() - 1));
    await ubah('mitra-a', 'unit-bebas', { servis: false });
    expect(await servisKeDepan('unit-bebas')).toHaveLength(0);
  });

  it('servis=false mengakhiri servis yang sedang berjalan tanpa menghapus hari yang sudah lewat', async () => {
    await db.blokirUnit.deleteMany({ where: { unitId: id['unit-bebas'] } });
    const mulai = pukulWita(sekarang, -1, 10);
    await db.blokirUnit.create({
      data: { unitId: id['unit-bebas'], jenis: 'SERVIS', mulai: new Date(mulai), selesai: new Date(sekarang + HARI) },
    });
    const sebelum = Date.now();
    expect((await ubah('mitra-a', 'unit-bebas', { servis: false })).status).toBe(200);
    expect(await servisKeDepan('unit-bebas')).toHaveLength(0);

    const riwayat = await db.blokirUnit.findMany({ where: { unitId: id['unit-bebas'], jenis: 'SERVIS' } });
    expect(riwayat).toHaveLength(1);
    expect(riwayat[0].mulai.getTime()).toBe(mulai);
    expect(riwayat[0].selesai.getTime()).toBeGreaterThanOrEqual(sebelum - 1000);
    expect(riwayat[0].selesai.getTime()).toBeLessThanOrEqual(Date.now());

    const k = await minta().get(`/mitra/kalender?mulai=${tanggal(-1)}&hari=1`).set(auth('mitra-a'));
    expect(k.body.unit.find((x: { id: string }) => x.id === id['unit-bebas']).sel[0].keadaan).toBe('servis');
    await db.blokirUnit.deleteMany({ where: { unitId: id['unit-bebas'] } });
  });

  it('sel kalender yang diblokir membawa id blokir, jadi bisa dibuka lagi lewat DELETE', async () => {
    const b = await blokir('mitra-a', { unitId: id['unit-bebas'], mulai: tanggal(12), selesai: tanggal(12) });
    expect(b.status).toBe(201);
    const k = await minta().get(`/mitra/kalender?mulai=${tanggal(11)}&hari=3`).set(auth('mitra-a'));
    const sel = k.body.unit.find((x: { id: string }) => x.id === id['unit-bebas']).sel;
    expect(sel.map((s: { blokirId: string | null }) => s.blokirId)).toEqual([null, b.body.id, null]);
    expect(sel[1].kodePesanan).toBeNull();
    // Sel pesanan tidak membawa id blokir.
    const keluar = k.body.unit.find((x: { id: string }) => x.id === id['unit-keluar']);
    expect(keluar.sel[0].blokirId).toBeNull();
    expect((await minta().delete(`/mitra/kalender/blokir/${b.body.id}`).set(auth('mitra-a'))).status).toBe(204);
  });

  it('tanggal kalender di ujung tahun 9999 ditolak 400, bukan 500', async () => {
    const r = await minta().get('/mitra/kalender?mulai=9999-12-31&hari=31').set(auth('mitra-a'));
    expect(r.status).toBe(400);
  });
});
