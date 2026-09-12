// README/State Management: "Metrik hero (340 / 4,8 / Rp 55rb) — dari endpoint
// statistik atau CMS, jangan hardcode permanen." Ditaruh di sini supaya
// penggantinya cukup mengubah satu modul.

export type HeroStat = {
  angka: string;
  label: string;
};

export const heroEyebrow = "Kalender real-time · 62 rental di Bali";

export const heroStats: HeroStat[] = [
  { angka: "340", label: "unit terdaftar" },
  { angka: "4,8", label: "rating penyedia" },
  { angka: "Rp 55rb", label: "motor termurah / hari" },
];

/** Angka besar pada grid statistik di section "Kenapa rentalaja". */
export const whyUsStats = {
  konfirmasi: {
    angka: "98%",
    label: "pesanan dikonfirmasi di bawah 10 menit",
  },
  biayaTersembunyi: {
    angka: "0",
    label: "biaya tersembunyi saat pengambilan unit",
  },
};
