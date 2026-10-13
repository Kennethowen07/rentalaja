// Rentang sewa yang dibawa antar layar lewat query string.
//
// Satu pilihan tanggal harus bertahan dari form pencarian di landing page,
// ke hasil pencarian, ke detail unit, sampai halaman pemesanan. Tanpa backend
// dan tanpa sesi, URL adalah satu-satunya tempat yang masuk akal untuk
// menyimpannya: bisa di-bookmark, di-refresh, dan dibagikan.
//
// Bentuknya selalu ?mulai=2026-10-28&durasi=5. Semua pembacaan dan penulisan
// query itu lewat file ini, supaya aturan pemulihannya tidak berbeda-beda
// antar halaman.

import { HARI, kunciTanggal, pukulWita } from "@/lib/mitra/waktu";

export type Sewa = {
  /** Epoch ms tengah malam WITA, tanggal unit diambil. */
  mulai: number;
  /** Lama sewa dalam hari. Tanggal kembali = mulai + hari. */
  hari: number;
};

export const HARI_DEFAULT = 3;
const HARI_MAKS = 60;

/** Tengah malam WITA untuk "2026-10-28". WITA tetap UTC+8 sepanjang tahun,
 *  jadi selisihnya boleh dianggap konstan. */
export function dariIso(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, b, t] = iso.split("-").map(Number);
  const ms = Date.UTC(y, b - 1, t) - 8 * 60 * 60 * 1000;
  return Number.isNaN(ms) ? null : ms;
}

/** Kebalikan dariIso: epoch ms jadi "2026-10-28". */
export function keIso(ms: number): string {
  return kunciTanggal(ms);
}

/**
 * Membaca rentang sewa dari query, dengan pemulihan bertingkat supaya URL
 * yang cacat tidak pernah menghasilkan halaman kosong atau tanggal lampau:
 *
 *   - tanggal tidak terbaca   -> besok
 *   - tanggal sudah lewat     -> besok, karena menawarkan unit untuk kemarin
 *                                lebih membingungkan daripada menggeser hari
 *   - durasi di luar 1..60    -> 3 hari, tapi tanggalnya tetap dipakai
 */
export function bacaSewa(
  mulai: string | undefined,
  durasi: string | undefined,
  sekarang: number,
): Sewa {
  const besok = pukulWita(sekarang, 1, 0);
  const diminta = mulai ? dariIso(mulai) : null;

  const angka = Number.parseInt(durasi ?? "", 10);
  const hari =
    Number.isFinite(angka) && angka >= 1 && angka <= HARI_MAKS ? angka : HARI_DEFAULT;

  return { mulai: diminta && diminta >= besok ? diminta : besok, hari };
}

/** Versi untuk Route Handler, yang menerima URLSearchParams. */
export function sewaDariQuery(sp: URLSearchParams, sekarang: number): Sewa {
  return bacaSewa(sp.get("mulai") ?? undefined, sp.get("durasi") ?? undefined, sekarang);
}

type Query = Record<string, string | string[] | undefined>;

const satu = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : undefined;

/** Versi untuk Page, yang menerima searchParams hasil await. */
export function sewaDariParams(params: Query, sekarang: number): Sewa {
  return bacaSewa(satu(params.mulai), satu(params.durasi), sekarang);
}

/** True kalau penyewa memang memilih tanggal, bukan sekadar jatuh ke default.
 *  Dipakai untuk memberi label "pilihanmu" pada chip pertama di /cari. */
export function adaPilihan(params: Query): boolean {
  const m = satu(params.mulai);
  return m !== undefined && dariIso(m) !== null;
}

/** Potongan query untuk ditempel ke tautan antar layar. */
export function paramSewa(sewa: Sewa): string {
  return `mulai=${keIso(sewa.mulai)}&durasi=${sewa.hari}`;
}

/** Tanggal kembali, yaitu mulai + hari. */
export function tanggalKembali(sewa: Sewa): number {
  return sewa.mulai + sewa.hari * HARI;
}
