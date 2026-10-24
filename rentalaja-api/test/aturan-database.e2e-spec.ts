/**
 * Bukti bahwa aturan bisnis di backend.md bagian 4 dijaga DATABASE, bukan
 * hanya oleh kode aplikasi.
 *
 * Test di sini sengaja menulis langsung lewat Prisma Client, tanpa service
 * NestJS apa pun. Kalau sebuah aturan hanya dijaga di service, test ini akan
 * gagal, dan itulah tujuannya: service yang lupa memeriksa, atau dua request
 * yang datang bersamaan, tetap tidak bisa merusak data.
 *
 * Memakai database rentalaja_test (lihat vitest.config.e2e.ts). Tanggal sewa
 * sengaja di tahun 2030 supaya tidak pernah bersinggungan dengan "sekarang";
 * yang bergantung pada jam sekarang hanya batas balas, lewat dibuatPada.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { StatusPesanan } from '../src/generated/prisma/enums.js';
import { kodeSqlState, pesanSql, SQLSTATE } from '../src/prisma/kesalahan-db.js';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const JAM = 60 * 60 * 1000;
const HARGA = 70_000;

/** Pukul 09.00 WITA (01.00 UTC) hari ke-n mulai 1 Jan 2030. */
const hari = (n: number) => new Date(Date.UTC(2030, 0, 1 + n, 1));

let penyewaId: string;
let unitId: string;
let unitLainId: string;
let nomor = 0;

async function kosongkanSemua() {
  await db.$executeRawUnsafe(
    'TRUNCATE pengguna, mitra, unit, blokir_unit, pesanan, pembayaran, ulasan RESTART IDENTITY CASCADE',
  );
}

async function siapkanData() {
  const pemilik = await db.pengguna.create({
    data: { email: 'mitra@test.local', kataSandiHash: '-', nama: 'Mitra Test', telepon: '0', peran: 'MITRA' },
  });
  const penyewa = await db.pengguna.create({
    data: { email: 'penyewa@test.local', kataSandiHash: '-', nama: 'Penyewa Test', telepon: '0', peran: 'PENYEWA' },
  });
  const mitra = await db.mitra.create({ data: { pemilikId: pemilik.id, nama: 'Rental Test', area: 'Canggu' } });
  const buatUnit = (slug: string, plat: string) =>
    db.unit.create({
      data: {
        slug, plat, mitraId: mitra.id, nama: 'Honda Scoopy', kategori: 'MOTOR',
        jenis: 'Skutik 110cc', spesifikasi: 'matic 110cc', tahun: 2023,
        hargaPerHari: HARGA, area: 'Canggu',
      },
    });
  penyewaId = penyewa.id;
  unitId = (await buatUnit('unit-a', 'DK 0001 TS')).id;
  unitLainId = (await buatUnit('unit-b', 'DK 0002 TS')).id;
}

type OpsiPesan = {
  a: number;
  b: number;
  unit?: string;
  status?: StatusPesanan;
  dibuatPada?: Date;
  /** Menimpa angka harga untuk menguji CHECK. */
  timpa?: Partial<{ jumlahHari: number; subtotal: number; total: number }>;
};

function pesan({ a, b, unit = unitId, status = 'MENUNGGU', dibuatPada, timpa = {} }: OpsiPesan) {
  const jumlahHari = b - a;
  const subtotal = HARGA * jumlahHari;
  return db.pesanan.create({
    data: {
      kode: `RA-${String(++nomor).padStart(6, '0')}`,
      unitId: unit, penyewaId, mulai: hari(a), selesai: hari(b), status,
      alasanBatal: status === 'DIBATALKAN' ? 'DIBATALKAN_PENYEWA' : null,
      hargaPerHari: HARGA, jumlahHari, subtotal, biayaLayanan: 0, total: subtotal,
      diantar: false, titik: 'Kantor rental',
      ...(dibuatPada ? { dibuatPada } : {}),
      ...timpa,
    },
  });
}

function blokir(a: number, b: number, jenis: 'MANUAL' | 'SERVIS' = 'MANUAL') {
  return db.blokirUnit.create({ data: { unitId, jenis, mulai: hari(a), selesai: hari(b) } });
}

/** Menunggu promise gagal dengan SQLSTATE tertentu, dan opsional pesan yang
 *  menyebut aturan mana yang dilanggar. Gagal karena alasan lain = test gagal. */
async function harapDitolak(janji: Promise<unknown>, sqlstate: string, potongan?: string) {
  let error: unknown;
  try {
    await janji;
  } catch (e) {
    error = e;
  }
  expect(error, 'seharusnya ditolak database, tapi diterima').toBeDefined();
  expect(kodeSqlState(error), pesanSql(error)).toBe(sqlstate);
  if (potongan) expect(pesanSql(error)).toContain(potongan);
}

beforeEach(async () => {
  await kosongkanSemua();
  await siapkanData();
});

afterAll(async () => {
  await kosongkanSemua();
  await db.$disconnect();
});

describe('Tidak ada double booking', () => {
  it('menolak pesanan kedua yang tumpang tindih', async () => {
    await pesan({ a: 0, b: 3 });
    await harapDitolak(pesan({ a: 2, b: 5 }), SQLSTATE.SLOT_TERISI, 'pesanan_tanpa_tumpang_tindih');
  });

  it('menolak pesanan yang seluruhnya berada di dalam pesanan lain', async () => {
    await pesan({ a: 0, b: 10 });
    await harapDitolak(pesan({ a: 3, b: 4 }), SQLSTATE.SLOT_TERISI);
  });

  it('menerima pesanan yang bersambung tepat di jam kembali', async () => {
    await pesan({ a: 0, b: 3 });
    await expect(pesan({ a: 3, b: 5 })).resolves.toBeDefined();
  });

  it('unit lain di tanggal yang sama tidak terpengaruh', async () => {
    await pesan({ a: 0, b: 3 });
    await expect(pesan({ a: 0, b: 3, unit: unitLainId })).resolves.toBeDefined();
  });

  it.each(['DITOLAK', 'SELESAI', 'DIBATALKAN'] as const)(
    'pesanan %s tidak lagi mengunci slotnya',
    async (status) => {
      await pesan({ a: 0, b: 3, status });
      await expect(pesan({ a: 0, b: 3 })).resolves.toBeDefined();
    },
  );

  it('lima pesanan bersamaan untuk slot yang sama: tepat satu yang lolos', async () => {
    const hasil = await Promise.allSettled(Array.from({ length: 5 }, () => pesan({ a: 0, b: 3 })));
    const lolos = hasil.filter((h) => h.status === 'fulfilled');
    const ditolak = hasil.filter((h): h is PromiseRejectedResult => h.status === 'rejected');

    expect(lolos).toHaveLength(1);
    expect(ditolak).toHaveLength(4);
    for (const d of ditolak) expect(kodeSqlState(d.reason)).toBe(SQLSTATE.SLOT_TERISI);
    expect(await db.pesanan.count()).toBe(1);
  });
});

describe('Pesanan dan blokir penyedia', () => {
  it('pesanan tidak bisa menimpa blokir manual', async () => {
    await blokir(1, 2);
    await harapDitolak(pesan({ a: 0, b: 3 }), SQLSTATE.SLOT_TERISI, 'diblokir');
  });

  it('pesanan tidak bisa menimpa jadwal servis', async () => {
    await blokir(1, 2, 'SERVIS');
    await harapDitolak(pesan({ a: 0, b: 3 }), SQLSTATE.SLOT_TERISI, 'diblokir');
  });

  it('pesanan boleh dimulai tepat saat blokir berakhir', async () => {
    await blokir(0, 2);
    await expect(pesan({ a: 2, b: 4 })).resolves.toBeDefined();
  });

  it.each(['MENUNGGU', 'BERJALAN'] as const)(
    'blokir tidak bisa menimpa pesanan %s',
    async (status) => {
      await pesan({ a: 0, b: 3, status });
      await harapDitolak(blokir(1, 2), SQLSTATE.SLOT_TERISI, 'menimpa tanggal');
    },
  );

  it('blokir boleh menimpa pesanan menunggu yang sudah kedaluwarsa', async () => {
    await pesan({ a: 0, b: 3, dibuatPada: new Date(Date.now() - 2 * JAM) });
    await expect(blokir(1, 2)).resolves.toBeDefined();
  });

  it('pesanan menunggu giliran selama blokir yang bentrok belum di-commit, lalu ditolak', async () => {
    // Versi deterministik dari uji balapan di bawah, yang tidak bergantung
    // pada keberuntungan waktu. Dua koneksi terpisah dikendalikan langsung:
    //   1. koneksi A memulai transaksi dan menulis blokir, TANPA commit
    //   2. koneksi B menulis pesanan di slot yang sama
    // Dengan kunci baris unit, B harus TERTAHAN sampai A selesai, lalu
    // ditolak karena kini melihat blokir A. Tanpa kunci, B langsung lolos
    // karena blokir A belum terlihat, dan unit jadi terpesan sekaligus
    // terblokir.
    const a = new pg.Client({ connectionString: process.env.DATABASE_URL });
    const b = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await a.connect();
    await b.connect();
    try {
      await a.query('BEGIN');
      await a.query(
        `INSERT INTO blokir_unit (id, unit_id, jenis, mulai, selesai)
         VALUES ('blokir-uji', $1, 'MANUAL', $2, $3)`,
        [unitId, hari(0), hari(3)],
      );

      let selesai = false;
      const tulisB = b
        .query(
          `INSERT INTO pesanan (id, kode, unit_id, penyewa_id, mulai, selesai,
             harga_per_hari, jumlah_hari, subtotal, biaya_layanan, total, diantar, titik)
           VALUES ('pesanan-uji', 'RA-UJI', $1, $2, $3, $4, $5, 3, $6, 0, $6, false, 'Kantor')`,
          [unitId, penyewaId, hari(0), hari(3), HARGA, HARGA * 3],
        )
        .finally(() => {
          selesai = true;
        });
      // Pastikan penolakan tidak dianggap "unhandled" selama kita menunggu.
      tulisB.catch(() => {});

      await new Promise((r) => setTimeout(r, 500));
      expect(selesai, 'pesanan B seharusnya tertahan menunggu kunci unit').toBe(false);

      await a.query('COMMIT');

      let galat: unknown;
      try {
        await tulisB;
      } catch (e) {
        galat = e;
      }
      expect((galat as { code?: string })?.code, 'pesanan B seharusnya ditolak').toBe(
        SQLSTATE.SLOT_TERISI,
      );
      expect(await db.pesanan.count()).toBe(0);
      expect(await db.blokirUnit.count()).toBe(1);
    } finally {
      await a.query('ROLLBACK').catch(() => {});
      await a.end();
      await b.end();
    }
  });

  it('blokir dan pesanan bersamaan di slot yang sama: tepat satu yang lolos', async () => {
    // HANYA uji asap. Test ini TIDAK membuktikan kunci baris unit: saat
    // kuncinya sengaja dicabut dari trigger (24 Okt 2026), test ini tetap
    // lolos, karena dua perintah yang dikirim "bersamaan" jarang benar-benar
    // bertumpuk. Bukti kuncinya ada di test "pesanan menunggu giliran" di
    // atas, yang mengendalikan urutan transaksi secara eksplisit dan memang
    // gagal tanpa kunci. Jangan hapus test itu dengan alasan test ini ada.
    for (let ulang = 0; ulang < 5; ulang++) {
      await db.blokirUnit.deleteMany();
      await db.pesanan.deleteMany();

      const hasil = await Promise.allSettled([blokir(0, 3), pesan({ a: 0, b: 3 })]);
      const lolos = hasil.filter((h) => h.status === 'fulfilled');
      expect(lolos, `percobaan ke-${ulang + 1}`).toHaveLength(1);

      const total = (await db.blokirUnit.count()) + (await db.pesanan.count());
      expect(total).toBe(1);
    }
  });
});

describe('Batas balas penyedia 1 jam', () => {
  it('pesanan kedaluwarsa tidak menghalangi pesanan baru, lalu dicatat batal', async () => {
    const dibuatPada = new Date(Date.now() - 2 * JAM);
    const lama = await pesan({ a: 0, b: 3, dibuatPada });

    await expect(pesan({ a: 1, b: 4 })).resolves.toBeDefined();

    const sesudah = await db.pesanan.findUniqueOrThrow({ where: { id: lama.id } });
    expect(sesudah.status).toBe('DIBATALKAN');
    expect(sesudah.alasanBatal).toBe('KEDALUWARSA');
    // Waktu batalnya saat ia benar-benar kedaluwarsa, bukan saat dicatat.
    expect(sesudah.dibatalkanPada?.getTime()).toBe(dibuatPada.getTime() + JAM);
  });

  it('pesanan menunggu yang masih dalam batas tetap menghalangi', async () => {
    await pesan({ a: 0, b: 3, dibuatPada: new Date(Date.now() - 30 * 60 * 1000) });
    await harapDitolak(pesan({ a: 1, b: 4 }), SQLSTATE.SLOT_TERISI);
  });

  it('penyedia tidak bisa menerima pesanan yang sudah kedaluwarsa', async () => {
    const p = await pesan({ a: 0, b: 3, dibuatPada: new Date(Date.now() - 61 * 60 * 1000) });
    await harapDitolak(
      db.pesanan.update({ where: { id: p.id }, data: { status: 'BERJALAN', diterimaPada: new Date() } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'lewat batas balas',
    );
  });

  it('penyedia bisa menerima pesanan yang masih dalam batas', async () => {
    const p = await pesan({ a: 0, b: 3, dibuatPada: new Date(Date.now() - 59 * 60 * 1000) });
    const diterima = await db.pesanan.update({
      where: { id: p.id },
      data: { status: 'BERJALAN', diterimaPada: new Date() },
    });
    expect(diterima.status).toBe('BERJALAN');
  });
});

describe('Harga dihitung, tidak dibaca dari data', () => {
  it('menolak subtotal yang bukan harga x jumlah hari', async () => {
    await harapDitolak(
      pesan({ a: 0, b: 3, timpa: { subtotal: HARGA, total: HARGA } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'pesanan_subtotal_dihitung',
    );
  });

  it('menolak jumlah hari yang tidak cocok dengan tanggal', async () => {
    // 3 hari, tapi hanya ditagih 1 hari.
    await harapDitolak(
      pesan({ a: 0, b: 3, timpa: { jumlahHari: 1, subtotal: HARGA, total: HARGA } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'pesanan_jumlah_hari_sesuai_tanggal',
    );
  });

  it('menolak total yang bukan subtotal + biaya layanan', async () => {
    await harapDitolak(
      pesan({ a: 0, b: 3, timpa: { total: 1 } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'pesanan_total_dihitung',
    );
  });

  it('harga, tanggal, dan unit tidak bisa diubah setelah dipesan', async () => {
    const p = await pesan({ a: 0, b: 3 });
    await harapDitolak(
      db.pesanan.update({ where: { id: p.id }, data: { hargaPerHari: 1, subtotal: 3, total: 3 } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'tidak bisa diubah',
    );
    await harapDitolak(
      db.pesanan.update({ where: { id: p.id }, data: { mulai: hari(1), selesai: hari(4) } }),
      SQLSTATE.ATURAN_DILANGGAR,
      'tidak bisa diubah',
    );
  });

  it('status dan waktu aksi tetap boleh berubah', async () => {
    const p = await pesan({ a: 0, b: 3 });
    const diubah = await db.pesanan.update({
      where: { id: p.id },
      data: { status: 'DITOLAK', ditolakPada: new Date() },
    });
    expect(diubah.status).toBe('DITOLAK');
  });

  it('pembayaran harus sama persis dengan total pesanan', async () => {
    const p = await pesan({ a: 0, b: 3 });
    await harapDitolak(
      db.pembayaran.create({
        data: { pesananId: p.id, jumlah: p.total - 1, metode: 'QRIS', dibayarPada: new Date() },
      }),
      SQLSTATE.ATURAN_DILANGGAR,
      'tidak sama dengan total',
    );
    await expect(
      db.pembayaran.create({
        data: { pesananId: p.id, jumlah: p.total, metode: 'QRIS', dibayarPada: new Date() },
      }),
    ).resolves.toBeDefined();
  });
});

describe('Ulasan', () => {
  it('skor hanya 1 sampai 5 dengan langkah setengah bintang', async () => {
    const tulis = async (skor: string) => {
      const p = await pesan({ a: nomor * 10, b: nomor * 10 + 1, status: 'SELESAI' });
      return db.ulasan.create({ data: { pesananId: p.id, unitId, penyewaId, skor, isi: 'ok' } });
    };

    await expect(tulis('4.5')).resolves.toBeDefined();
    await expect(tulis('1')).resolves.toBeDefined();
    await harapDitolak(tulis('4.3'), SQLSTATE.ATURAN_DILANGGAR, 'ulasan_skor_setengah_bintang');
    await harapDitolak(tulis('5.5'), SQLSTATE.ATURAN_DILANGGAR, 'ulasan_skor_setengah_bintang');
  });
});
