import { config } from 'dotenv';

/**
 * Test e2e memakai database terpisah, `rentalaja_test`, di server yang sama
 * dengan database pengembangan. URL-nya diturunkan dari DATABASE_URL di .env
 * dengan mengganti nama database saja, jadi tidak ada kata sandi kedua yang
 * harus dijaga. Database pengembangan tidak pernah disentuh test.
 */
export function urlDatabaseTest(): string {
  config({ quiet: true });
  const asal = process.env.DATABASE_URL;
  if (!asal) throw new Error('DATABASE_URL belum diisi di rentalaja-api/.env');

  const url = new URL(asal);
  url.pathname = '/rentalaja_test';
  return url.toString();
}
