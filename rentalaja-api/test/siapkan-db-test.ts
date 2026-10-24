import { execSync } from 'node:child_process';
import pg from 'pg';
import { urlDatabaseTest } from './url-db-test.js';

/**
 * globalSetup Vitest untuk test e2e. Berjalan sekali sebelum semua file test.
 *
 * Membuat database rentalaja_test kalau belum ada, lalu menerapkan migrasi
 * dengan `migrate deploy`. Sengaja bukan `migrate reset`: deploy hanya
 * menambahkan migrasi yang belum diterapkan dan tidak pernah menghapus apa
 * pun. Mengosongkan isi tabel adalah tugas tiap file test.
 */
export default async function siapkanDatabaseTest() {
  const url = new URL(urlDatabaseTest());
  const nama = url.pathname.slice(1);

  const admin = new URL(url);
  admin.pathname = '/postgres';
  const klien = new pg.Client({ connectionString: admin.toString() });
  await klien.connect();
  try {
    const ada = await klien.query('SELECT 1 FROM pg_database WHERE datname = $1', [nama]);
    if (ada.rowCount === 0) await klien.query(`CREATE DATABASE "${nama}"`);
  } finally {
    await klien.end();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });
}
