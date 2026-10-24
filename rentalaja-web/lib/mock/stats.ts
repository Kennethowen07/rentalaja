// README/State Management: "Metrik hero (340 / 4,8 / Rp 55rb) — dari endpoint
// statistik atau CMS, jangan hardcode permanen." Ditaruh di sini supaya
// penggantinya cukup mengubah satu modul.

export type HeroStat = {
  angka: string;
  /** Satuan kecil di belakang angka, mis. "/hari". */
  akhiran?: string;
  label: string;
};

export const heroStats: HeroStat[] = [
  { angka: "340", label: "Unit Kendaraan" },
  // Angka mock, belum ada data pesanan sungguhan di baliknya.
  { angka: "1000+", label: "Unit Telah Disewa" },
  { angka: "Rp 55rb", akhiran: "/hari", label: "Harga Sewa Mulai Dari" },
];
