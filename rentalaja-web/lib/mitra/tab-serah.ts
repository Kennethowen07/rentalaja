// Tab layar Serah terima. Ditaruh di lib supaya halaman server boleh
// memvalidasi query ?tab= tanpa mengimpor modul "use client".

import type { Teks } from "@/lib/i18n";
import type { StatusSerah } from "./tipe";

export const tabSerah = [
  { kunci: "hari-ini", label: { id: "Hari ini", en: "Today" }, status: "jadwal", berjumlah: true },
  { kunci: "menunggu-foto", label: { id: "Menunggu foto", en: "Awaiting photos" }, status: "menunggu-foto", berjumlah: true },
  { kunci: "selesai", label: { id: "Selesai", en: "Done" }, status: "selesai", berjumlah: false },
] as const satisfies readonly {
  kunci: string;
  label: Teks;
  status: StatusSerah;
  berjumlah: boolean;
}[];

export type KunciTabSerah = (typeof tabSerah)[number]["kunci"];

export function kunciTabSerahValid(nilai: string | undefined): KunciTabSerah {
  return tabSerah.some((t) => t.kunci === nilai) ? (nilai as KunciTabSerah) : "hari-ini";
}
