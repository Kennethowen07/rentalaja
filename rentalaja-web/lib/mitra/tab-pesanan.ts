// Daftar tab layar Pesanan. Ditaruh di lib, bukan di komponen client, karena
// halaman server memvalidasi query ?tab= lewat kunciTabValid: fungsi yang
// diekspor modul "use client" tidak boleh dipanggil dari server.

import type { StatusPesanan } from "./tipe";

export const tabPesanan = [
  { kunci: "menunggu", label: "Menunggu konfirmasi", status: "pending", berjumlah: true },
  { kunci: "berjalan", label: "Berjalan", status: "active", berjumlah: true },
  { kunci: "selesai", label: "Selesai", status: "completed", berjumlah: false },
  { kunci: "dibatalkan", label: "Dibatalkan", status: "cancelled", berjumlah: false },
] as const satisfies readonly {
  kunci: string;
  label: string;
  status: StatusPesanan;
  berjumlah: boolean;
}[];

export type KunciTab = (typeof tabPesanan)[number]["kunci"];

export function kunciTabValid(nilai: string | undefined): KunciTab {
  return tabPesanan.some((t) => t.kunci === nilai) ? (nilai as KunciTab) : "menunggu";
}
