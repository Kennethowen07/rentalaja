// README/State Management: "Metrik hero (340 / 4,8 / Rp 55rb) — dari endpoint
// statistik atau CMS, jangan hardcode permanen." Ditaruh di sini supaya
// penggantinya cukup mengubah satu modul.

import { kamus } from "@/lib/i18n";

export type HeroStat = {
  angka: string;
  /** Satuan kecil di belakang angka, mis. "/hari". */
  akhiran?: string;
  label: string;
};

// Angka "1000+" mock, belum ada data pesanan sungguhan di baliknya.
export const heroStats = kamus<HeroStat[]>({
  id: [
    { angka: "340", label: "Unit Kendaraan" },
    { angka: "1000+", label: "Unit Telah Disewa" },
    { angka: "Rp 55rb", akhiran: "/hari", label: "Harga Sewa Mulai Dari" },
  ],
  en: [
    { angka: "340", label: "Vehicles Listed" },
    { angka: "1000+", label: "Rentals Completed" },
    { angka: "Rp 55k", akhiran: "/day", label: "Starting Price" },
  ],
});
