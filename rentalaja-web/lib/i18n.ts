// Dua bahasa: Indonesia (bawaan, tanpa awalan URL) dan Inggris (/en).
//
// Rutenya ada di app/[lang]. proxy.ts menulis ulang URL tanpa awalan ke
// /id/... secara internal, jadi alamat bahasa Indonesia tidak berubah
// (/cari, /unit/...), sedangkan versi Inggris dibuka di /en, /en/cari, dst.
//
// Teks tidak dikumpulkan di satu kamus raksasa. Tiap komponen menyimpan
// kamusnya sendiri lewat `kamus({ id: {...}, en: {...} })`, berdampingan
// dengan markup yang memakainya. Tipe `en` diturunkan dari `id`, jadi kunci
// yang lupa diterjemahkan langsung gagal di tsc.
//
// File ini aman untuk server maupun client. Untuk server component lihat
// lib/i18n-server.ts, untuk client component lihat components/BahasaProvider.

export const BAHASA = ["id", "en"] as const;
export type Bahasa = (typeof BAHASA)[number];

export function adaBahasa(nilai: string): nilai is Bahasa {
  return (BAHASA as readonly string[]).includes(nilai);
}

/** Kamus satu komponen. `en` wajib punya bentuk yang sama dengan `id`. */
export function kamus<T>(k: { id: T; en: NoInfer<T> }): Record<Bahasa, T> {
  return k;
}

/** Teks pendek dua bahasa, untuk data mock (FAQ, ulasan, chat, ...). */
export type Teks = Record<Bahasa, string>;

/** Locale Intl per bahasa. en-GB dipilih karena urutannya "25 Oct 2026",
 *  sama dengan urutan tanggal Indonesia, dan jamnya 24 jam. */
export function lokal(bahasa: Bahasa): string {
  return bahasa === "en" ? "en-GB" : "id-ID";
}

/** Angka desimal yang di data ditulis dengan koma ("4,9"): titik di bahasa
 *  Inggris ("4.9"). */
export function desimal(nilai: string, bahasa: Bahasa): string {
  return bahasa === "en" ? nilai.replace(",", ".") : nilai;
}

/** Path internal untuk bahasa tertentu: "/cari" atau "/en/cari". */
export function jalur(bahasa: Bahasa, path: string): string {
  if (bahasa === "id") return path;
  if (path === "/" || path === "") return "/en";
  if (path.startsWith("/#") || path.startsWith("/?")) return "/en" + path.slice(1);
  return "/en" + path;
}

/** Kebalikan jalur(): path yang sama di bahasa lain, untuk tombol ID | EN. */
export function gantiBahasa(pathname: string, ke: Bahasa): string {
  const tanpaAwalan =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return jalur(ke, tanpaAwalan);
}
