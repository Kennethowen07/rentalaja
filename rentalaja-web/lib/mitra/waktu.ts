// Semua tanggal panel mitra dihitung relatif terhadap "sekarang" di zona
// Bali (WITA, UTC+8), bukan tanggal statis 12 Sep 2026 di mock desain.
// Alasannya sama seperti sisi penyewa: demo yang dibuka bulan depan tidak
// boleh menampilkan "kembali hari ini" untuk tanggal yang sudah lewat.

export const ZONA = "Asia/Makassar";
export const MENIT = 60_000;
export const JAM = 60 * MENIT;
export const HARI = 24 * JAM;
const OFFSET_WITA = 8 * JAM;

function format(t: number, opsi: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, ...opsi }).format(t);
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
export function tanggalPanjang(t: number) {
  return format(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** "Sen 14" untuk label hari di grafik mingguan. */
export function hariSingkat(t: number) {
  return `${format(t, { weekday: "short" })} ${format(t, { day: "numeric" })}`;
}

/** "Minggu 13 Sep" */
export function hariTanggal(t: number) {
  return `${format(t, { weekday: "long" })} ${format(t, { day: "numeric", month: "short" })}`;
}

/** "14 Sep 09.00" */
export function tanggalJam(t: number) {
  const jam = format(t, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${format(t, { day: "numeric", month: "short" })} ${jam.replace(":", ".")}`;
}

/** Nama bulan WITA, `geser` bulan dari bulan `t`. */
export function namaBulan(t: number, geser = 0) {
  const wita = new Date(t + OFFSET_WITA);
  const tengahBulan = Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth() + geser, 15);
  return new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" }).format(
    tengahBulan,
  );
}

/** Label status unit yang sedang disewa, dihitung dari jadwal kembali. */
export function statusKembali(kembaliPada: number, sekarang: number) {
  if (kembaliPada < sekarang) {
    const lewat = sekarang - kembaliPada;
    const label =
      lewat >= HARI
        ? `Lewat ${Math.floor(lewat / HARI)} hari`
        : `Lewat ${Math.max(1, Math.floor(lewat / JAM))} jam`;
    return { label, telat: true };
  }
  if (samaHari(kembaliPada, sekarang)) return { label: "Kembali hari ini", telat: false };
  return { label: "Tepat waktu", telat: false };
}

/** "13–15 Sep", atau "30 Sep – 02 Okt" kalau beda bulan. */
export function rentangTanggal(mulai: number, selesai: number) {
  const bulan = (t: number) => format(t, { month: "short" });
  const hari = (t: number) => format(t, { day: "2-digit" });
  return bulan(mulai) === bulan(selesai)
    ? `${hari(mulai)}–${hari(selesai)} ${bulan(selesai)}`
    : `${hari(mulai)} ${bulan(mulai)} – ${hari(selesai)} ${bulan(selesai)}`;
}

/** "14 Sep" */
export function tanggalSingkat(t: number) {
  return format(t, { day: "numeric", month: "short" });
}

/** "14 Sep 2026" */
export function tanggalLengkap(t: number) {
  return format(t, { day: "numeric", month: "short", year: "numeric" });
}

/** "09.00" */
export function jamSaja(t: number) {
  return format(t, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).replace(":", ".");
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
export function rentangMinggu(mulai: number, akhir: number) {
  const bulan = (t: number) => format(t, { month: "long" });
  const hari = (t: number) => format(t, { day: "numeric" });
  const tahun = format(akhir, { year: "numeric" });
  return bulan(mulai) === bulan(akhir)
    ? `${hari(mulai)} – ${hari(akhir)} ${bulan(akhir)} ${tahun}`
    : `${hari(mulai)} ${bulan(mulai)} – ${hari(akhir)} ${bulan(akhir)} ${tahun}`;
}
