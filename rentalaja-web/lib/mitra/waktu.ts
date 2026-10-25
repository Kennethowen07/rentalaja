// Semua tanggal panel mitra dihitung relatif terhadap "sekarang" di zona
// Bali (WITA, UTC+8), bukan tanggal statis 12 Sep 2026 di mock desain.
// Alasannya sama seperti sisi penyewa: demo yang dibuka bulan depan tidak
// boleh menampilkan "kembali hari ini" untuk tanggal yang sudah lewat.
//
// Setiap formatter menerima `bahasa` (bawaan "id"). Jam ditulis "09.00" di
// bahasa Indonesia dan "09:00" di bahasa Inggris.

import { lokal, type Bahasa } from "@/lib/i18n";

export const ZONA = "Asia/Makassar";
export const MENIT = 60_000;
export const JAM = 60 * MENIT;
export const HARI = 24 * JAM;
const OFFSET_WITA = 8 * JAM;

function format(t: number, opsi: Intl.DateTimeFormatOptions, bahasa: Bahasa = "id") {
  return new Intl.DateTimeFormat(lokal(bahasa), { timeZone: ZONA, ...opsi }).format(t);
}

/** "09.00" (id) atau "09:00" (en). */
function jam24(t: number, bahasa: Bahasa) {
  const jam = format(t, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, bahasa);
  return bahasa === "id" ? jam.replace(":", ".") : jam;
}

/** Epoch ms untuk pukul jam:menit WITA, `geserHari` hari dari hari ini. */
export function pukulWita(
  sekarang: number,
  geserHari: number,
  jam: number,
  menit = 0,
): number {
  const wita = new Date(sekarang + OFFSET_WITA);
  const tengahMalam =
    Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth(), wita.getUTCDate()) -
    OFFSET_WITA;
  return tengahMalam + geserHari * HARI + jam * JAM + menit * MENIT;
}

function samaHari(a: number, b: number) {
  return pukulWita(a, 0, 0) === pukulWita(b, 0, 0);
}

/** "Senin, 14 September 2026" */
export function tanggalPanjang(t: number, bahasa: Bahasa = "id") {
  return format(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, bahasa);
}

/** "Sen 14" untuk label hari di grafik mingguan. */
export function hariSingkat(t: number, bahasa: Bahasa = "id") {
  return `${format(t, { weekday: "short" }, bahasa)} ${format(t, { day: "numeric" }, bahasa)}`;
}

/** "Minggu 13 Sep" */
export function hariTanggal(t: number, bahasa: Bahasa = "id") {
  return `${format(t, { weekday: "long" }, bahasa)} ${format(t, { day: "numeric", month: "short" }, bahasa)}`;
}

/** "14 Sep 09.00" */
export function tanggalJam(t: number, bahasa: Bahasa = "id") {
  return `${format(t, { day: "numeric", month: "short" }, bahasa)} ${jam24(t, bahasa)}`;
}

/** Nama bulan WITA, `geser` bulan dari bulan `t`. */
export function namaBulan(t: number, geser = 0, bahasa: Bahasa = "id") {
  const wita = new Date(t + OFFSET_WITA);
  const tengahBulan = Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth() + geser, 15);
  return new Intl.DateTimeFormat(lokal(bahasa), { month: "long", timeZone: "UTC" }).format(
    tengahBulan,
  );
}

/** Label status unit yang sedang disewa, dihitung dari jadwal kembali. */
export function statusKembali(kembaliPada: number, sekarang: number, bahasa: Bahasa = "id") {
  const en = bahasa === "en";
  if (kembaliPada < sekarang) {
    const lewat = sekarang - kembaliPada;
    const hari = Math.floor(lewat / HARI);
    const jam = Math.max(1, Math.floor(lewat / JAM));
    const label =
      lewat >= HARI
        ? en ? `${hari} ${hari === 1 ? "day" : "days"} late` : `Lewat ${hari} hari`
        : en ? `${jam} ${jam === 1 ? "hour" : "hours"} late` : `Lewat ${jam} jam`;
    return { label, telat: true };
  }
  if (samaHari(kembaliPada, sekarang)) return { label: en ? "Due back today" : "Kembali hari ini", telat: false };
  return { label: en ? "On time" : "Tepat waktu", telat: false };
}

/** "13–15 Sep", atau "30 Sep – 02 Okt" kalau beda bulan. */
export function rentangTanggal(mulai: number, selesai: number, bahasa: Bahasa = "id") {
  const bulan = (t: number) => format(t, { month: "short" }, bahasa);
  const hari = (t: number) => format(t, { day: "2-digit" }, bahasa);
  return bulan(mulai) === bulan(selesai)
    ? `${hari(mulai)}–${hari(selesai)} ${bulan(selesai)}`
    : `${hari(mulai)} ${bulan(mulai)} – ${hari(selesai)} ${bulan(selesai)}`;
}

/** "14 Sep" */
export function tanggalSingkat(t: number, bahasa: Bahasa = "id") {
  return format(t, { day: "numeric", month: "short" }, bahasa);
}

/** "14 Sep 2026" */
export function tanggalLengkap(t: number, bahasa: Bahasa = "id") {
  return format(t, { day: "numeric", month: "short", year: "numeric" }, bahasa);
}

/** "09.00" */
export function jamSaja(t: number, bahasa: Bahasa = "id") {
  return jam24(t, bahasa);
}

/** Hari sewa dihitung inklusif, sesuai spec: 13-15 Sep = 3 hari. Sama dengan
 *  cara sisi penyewa menghitung (12 Sep 09.00 sampai 14 Sep 09.00 = 3 hari). */
export function jumlahHari(mulai: number, selesai: number) {
  return Math.max(1, Math.round((selesai - mulai) / HARI) + 1);
}

export function hariSama(a: number, b: number) {
  return samaHari(a, b);
}

/** Tengah malam WITA hari itu. Dipakai untuk membandingkan tanggal, bukan jam. */
export function awalHari(t: number) {
  return pukulWita(t, 0, 0);
}

/** Kunci tanggal "2026-09-19" untuk id sel kalender. */
export function kunciTanggal(t: number) {
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return bagian.format(t);
}

/** "19 - 25 September 2026", atau "28 September - 4 Oktober 2026". */
export function rentangMinggu(mulai: number, akhir: number, bahasa: Bahasa = "id") {
  const bulan = (t: number) => format(t, { month: "long" }, bahasa);
  const hari = (t: number) => format(t, { day: "numeric" }, bahasa);
  const tahun = format(akhir, { year: "numeric" }, bahasa);
  return bulan(mulai) === bulan(akhir)
    ? `${hari(mulai)} – ${hari(akhir)} ${bulan(akhir)} ${tahun}`
    : `${hari(mulai)} ${bulan(mulai)} – ${hari(akhir)} ${bulan(akhir)} ${tahun}`;
}
