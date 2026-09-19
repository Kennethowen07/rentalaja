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
