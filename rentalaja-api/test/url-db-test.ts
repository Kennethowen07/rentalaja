import { config } from 'dotenv';

/** Nama database test bila NAMA_DB_TEST tidak diisi. */
const NAMA_DB_TEST_DEFAULT = 'rentalaja_test';

/**
 * Test e2e memakai database terpisah di server yang sama dengan database
 * pengembangan. Namanya `rentalaja_test`, atau isi env NAMA_DB_TEST kalau
 * ada, supaya beberapa pekerjaan yang berjalan bersamaan bisa memakai
 * database test masing-masing (mis. NAMA_DB_TEST=rentalaja_test_a).
 *
 * URL-nya diturunkan dari DATABASE_URL di .env dengan mengganti nama
 * database saja, jadi tidak ada kata sandi kedua yang harus dijaga. Database
 * pengembangan tidak pernah disentuh test.
 */
export function urlDatabaseTest(): string {
  config({ quiet: true });
  const asal = process.env.DATABASE_URL;
  if (!asal) throw new Error('DATABASE_URL belum diisi di rentalaja-api/.env');

  const nama = process.env.NAMA_DB_TEST?.trim() || NAMA_DB_TEST_DEFAULT;
  // Nama dipakai mentah di CREATE DATABASE (siapkan-db-test.ts), jadi hanya
  // huruf kecil, angka, dan garis bawah. Nama database pengembangan ditolak
  // supaya test tidak pernah mengosongkan data pengembangan.
  if (!/^[a-z0-9_]+$/.test(nama)) {
    throw new Error(`NAMA_DB_TEST "${nama}" tidak sah: hanya huruf kecil, angka, dan garis bawah.`);
  }
  const url = new URL(asal);
  if (nama === url.pathname.slice(1)) {
    throw new Error(`NAMA_DB_TEST tidak boleh sama dengan database pengembangan (${nama}).`);
  }

  url.pathname = `/${nama}`;
  return url.toString();
}
