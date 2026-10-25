// Tanggal "yyyy-mm-dd" menurut jam LOKAL pengguna, dipakai form pencarian
// di beranda dan kalender pemilih tanggalnya.
//
// toISOString() sengaja tidak dipakai: ia bergeser ke UTC dan bisa
// memundurkan tanggal satu hari untuk pengguna di WITA (UTC+8).

const HARI_MS = 24 * 60 * 60 * 1000;

export function isoTanggalLokal(d: Date): string {
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

export function parseIso(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const tanggal = new Date(y, m - 1, d);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

export function geserHari(iso: string, hari: number): string {
  const d = parseIso(iso);
  if (!d) return "";
  return isoTanggalLokal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + hari));
}

/** Jumlah hari dari a ke b. Math.round menyerap geseran satu jam kalau
 *  rentangnya melewati pergantian jam musim panas di zona pengguna. */
export function selisihHari(a: string, b: string): number | null {
  const da = parseIso(a);
  const db = parseIso(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / HARI_MS);
}
