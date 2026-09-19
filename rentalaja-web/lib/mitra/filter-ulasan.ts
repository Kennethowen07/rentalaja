// Chip filter layar Ulasan, di lib supaya halaman server boleh memvalidasi
// query ?saring=.

export const filterUlasan = [
  { kunci: "semua", label: "Semua" },
  { kunci: "belum-dibalas", label: "Belum dibalas" },
  { kunci: "skor-rendah", label: "Di bawah 4,0" },
] as const;

export type KunciFilterUlasan = (typeof filterUlasan)[number]["kunci"];

export function kunciFilterUlasanValid(nilai: string | undefined): KunciFilterUlasan {
  return filterUlasan.some((f) => f.kunci === nilai) ? (nilai as KunciFilterUlasan) : "semua";
}
