import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { urlDatabaseTest } from './test/url-db-test.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Test e2e memakai database sungguhan, tapi selalu rentalaja_test,
    // tidak pernah database pengembangan. ConfigModule NestJS tidak menimpa
    // nilai yang sudah ada di process.env, jadi AppModule ikut memakai ini.
    env: { DATABASE_URL: urlDatabaseTest() },
    globalSetup: ['./test/siapkan-db-test.ts'],
    // Semua file berbagi satu database dan mengosongkan tabel di awal test,
    // jadi antar file tidak boleh berjalan bersamaan.
    fileParallelism: false,
  },
});
