// Chip filter layar Unit kendaraan. Sama seperti tab-pesanan, daftarnya
// ditaruh di lib supaya halaman server boleh memvalidasi query ?status=.

export const filterUnit = [
  { kunci: "semua", label: "Semua" },
  { kunci: "keluar", label: "Keluar" },
  { kunci: "kosong", label: "Kosong" },
  { kunci: "servis", label: "Servis" },
] as const;

export type KunciFilter = (typeof filterUnit)[number]["kunci"];

export function kunciFilterValid(nilai: string | undefined): KunciFilter {
  return filterUnit.some((f) => f.kunci === nilai) ? (nilai as KunciFilter) : "semua";
}
