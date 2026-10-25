// Chip filter layar Unit kendaraan. Sama seperti tab-pesanan, daftarnya
// ditaruh di lib supaya halaman server boleh memvalidasi query ?status=.

export const filterUnit = [
  { kunci: "semua", label: { id: "Semua", en: "All" } },
  { kunci: "keluar", label: { id: "Keluar", en: "Out" } },
  { kunci: "kosong", label: { id: "Kosong", en: "Available" } },
  { kunci: "servis", label: { id: "Servis", en: "Servicing" } },
] as const;

export type KunciFilter = (typeof filterUnit)[number]["kunci"];

export function kunciFilterValid(nilai: string | undefined): KunciFilter {
  return filterUnit.some((f) => f.kunci === nilai) ? (nilai as KunciFilter) : "semua";
}
