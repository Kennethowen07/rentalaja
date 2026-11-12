import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { urlDatabaseTest } from './test/url-db-test.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Test e2e memakai database sungguhan, tapi selalu database test
    // (rentalaja_test atau NAMA_DB_TEST, lihat test/url-db-test.ts),
    // tidak pernah database pengembangan. ConfigModule NestJS tidak menimpa
    // nilai yang sudah ada di process.env, jadi AppModule ikut memakai ini.
    env: { DATABASE_URL: urlDatabaseTest() },
    globalSetup: ['./test/siapkan-db-test.ts'],
    // Semua file berbagi satu database dan mengosongkan tabel di awal test,
    // jadi antar file tidak boleh berjalan bersamaan.
    fileParallelism: false,
    // Request pertama tiap file (bcrypt + koneksi pool baru) pernah melewati
    // batas bawaan 5 detik di mesin yang sedang sibuk, dan beforeAll yang
    // membangun AppModule pernah melewati 10 detik. Ini bukan bug kode, jadi
    // batasnya dilonggarkan supaya test tidak gagal acak.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
