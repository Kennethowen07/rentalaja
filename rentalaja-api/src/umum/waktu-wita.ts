/**
 * Waktu di RentalAja disimpan UTC, tapi "hari" selalu dihitung dari tengah
 * malam WITA (UTC+8), sama dengan rentalaja-web/lib/sewa.ts. WITA tidak punya
 * jam musim panas, jadi selisih 8 jam boleh dianggap tetap.
 */

export const MENIT = 60_000;
export const JAM = 60 * MENIT;
export const HARI = 24 * JAM;
const OFFSET_WITA = 8 * JAM;

/** Tengah malam WITA dari hari yang memuat `t`. */
export function awalHariWita(t: number): number {
  const w = new Date(t + OFFSET_WITA);
  return Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - OFFSET_WITA;
}

/** Pukul `jam`:`menit` WITA, `geser` hari dari hari yang memuat `sekarang`. */
export function pukulWita(sekarang: number, geser: number, jam: number, menit = 0): number {
  return awalHariWita(sekarang) + geser * HARI + jam * JAM + menit * MENIT;
}

/** "2026-10-28" -> tengah malam WITA tanggal itu. null kalau formatnya salah
 *  atau tanggalnya tidak ada (2026-02-31 ditolak, tidak digeser ke Maret). */
export function dariIsoWita(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, b, t] = iso.split('-').map(Number);
  const ms = Date.UTC(y, b - 1, t) - OFFSET_WITA;
  return keIsoWita(ms) === iso ? ms : null;
}

/** Kebalikan dariIsoWita: epoch ms -> "2026-10-28" menurut kalender WITA. */
export function keIsoWita(t: number): string {
  return new Date(t + OFFSET_WITA).toISOString().slice(0, 10);
}

/** "09.00" atau "09:00" -> [9, 0]. null kalau bukan jam yang sah. */
export function bacaJam(teks: string): [number, number] | null {
  const m = /^(\d{2})[.:](\d{2})$/.exec(teks);
  if (!m) return null;
  const jam = Number(m[1]);
  const menit = Number(m[2]);
  return jam < 24 && menit < 60 ? [jam, menit] : null;
}
