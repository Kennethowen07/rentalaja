// Chip filter layar Ulasan, di lib supaya halaman server boleh memvalidasi
// query ?saring=.

export const filterUlasan = [
  { kunci: "semua", label: { id: "Semua", en: "All" } },
  { kunci: "belum-dibalas", label: { id: "Belum dibalas", en: "Not replied" } },
  { kunci: "skor-rendah", label: { id: "Di bawah 4,0", en: "Below 4.0" } },
] as const;

export type KunciFilterUlasan = (typeof filterUlasan)[number]["kunci"];

export function kunciFilterUlasanValid(nilai: string | undefined): KunciFilterUlasan {
  return filterUlasan.some((f) => f.kunci === nilai) ? (nilai as KunciFilterUlasan) : "semua";
}
