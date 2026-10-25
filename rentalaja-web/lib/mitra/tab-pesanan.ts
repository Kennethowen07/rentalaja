// Daftar tab layar Pesanan. Ditaruh di lib, bukan di komponen client, karena
// halaman server memvalidasi query ?tab= lewat kunciTabValid: fungsi yang
// diekspor modul "use client" tidak boleh dipanggil dari server.

import type { Teks } from "@/lib/i18n";
import type { StatusPesanan } from "./tipe";

export const tabPesanan = [
  { kunci: "menunggu", label: { id: "Menunggu konfirmasi", en: "Awaiting confirmation" }, status: "pending", berjumlah: true },
  { kunci: "berjalan", label: { id: "Berjalan", en: "Ongoing" }, status: "active", berjumlah: true },
  { kunci: "selesai", label: { id: "Selesai", en: "Completed" }, status: "completed", berjumlah: false },
  { kunci: "dibatalkan", label: { id: "Dibatalkan", en: "Cancelled" }, status: "cancelled", berjumlah: false },
] as const satisfies readonly {
  kunci: string;
  label: Teks;
  status: StatusPesanan;
  berjumlah: boolean;
}[];

export type KunciTab = (typeof tabPesanan)[number]["kunci"];

export function kunciTabValid(nilai: string | undefined): KunciTab {
  return tabPesanan.some((t) => t.kunci === nilai) ? (nilai as KunciTab) : "menunggu";
}
