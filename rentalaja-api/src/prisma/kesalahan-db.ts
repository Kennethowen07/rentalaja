/**
 * Membaca error database yang dibungkus Prisma 7.
 *
 * Dengan driver adapter, pelanggaran constraint yang tidak dikenal Prisma
 * (EXCLUDE, CHECK, dan RAISE dari trigger) tidak punya kode Prisma sendiri.
 * Semuanya keluar sebagai P2039, dan kode SQLSTATE aslinya tersimpan di
 * `meta.driverAdapterError.cause`. Bentuk ini dicek langsung terhadap
 * Prisma 7.10.1, bukan ditebak dari dokumentasi.
 */

/** Kode SQLSTATE PostgreSQL yang dipakai aturan bisnis di migration.sql. */
export const SQLSTATE = {
  /** Slot sudah terisi: EXCLUDE pesanan, atau trigger pesanan vs blokir. */
  SLOT_TERISI: '23P01',
  /** Aturan data dilanggar: CHECK harga, pesanan beku, batas balas, jumlah bayar. */
  ATURAN_DILANGGAR: '23514',
  UNIK_DILANGGAR: '23505',
} as const;

type PenyebabDb = {
  originalCode?: string;
  code?: string;
  originalMessage?: string;
  message?: string;
};

function penyebab(e: unknown): PenyebabDb | undefined {
  if (typeof e !== 'object' || e === null) return undefined;
  const meta = (e as { meta?: { driverAdapterError?: { cause?: PenyebabDb } } }).meta;
  return meta?.driverAdapterError?.cause;
}

/** SQLSTATE dari error database, atau undefined kalau bukan error database. */
export function kodeSqlState(e: unknown): string | undefined {
  const c = penyebab(e);
  if (c) return c.originalCode ?? c.code;
  // Pelanggaran unique tetap dipetakan Prisma ke kode miliknya sendiri.
  if (typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002') {
    return SQLSTATE.UNIK_DILANGGAR;
  }
  return undefined;
}

/** Pesan asli dari PostgreSQL, termasuk pesan RAISE dari trigger. */
export function pesanSql(e: unknown): string {
  const c = penyebab(e);
  return c?.originalMessage ?? c?.message ?? (e instanceof Error ? e.message : String(e));
}

export function adalahSlotTerisi(e: unknown): boolean {
  return kodeSqlState(e) === SQLSTATE.SLOT_TERISI;
}

export function adalahAturanDilanggar(e: unknown): boolean {
  return kodeSqlState(e) === SQLSTATE.ATURAN_DILANGGAR;
}
