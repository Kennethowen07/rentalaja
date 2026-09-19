// Tab layar Serah terima. Ditaruh di lib supaya halaman server boleh
// memvalidasi query ?tab= tanpa mengimpor modul "use client".

import type { StatusSerah } from "./tipe";

export const tabSerah = [
  { kunci: "hari-ini", label: "Hari ini", status: "jadwal", berjumlah: true },
  { kunci: "menunggu-foto", label: "Menunggu foto", status: "menunggu-foto", berjumlah: true },
  { kunci: "selesai", label: "Selesai", status: "selesai", berjumlah: false },
] as const satisfies readonly {
  kunci: string;
  label: string;
  status: StatusSerah;
  berjumlah: boolean;
}[];

export type KunciTabSerah = (typeof tabSerah)[number]["kunci"];

export function kunciTabSerahValid(nilai: string | undefined): KunciTabSerah {
  return tabSerah.some((t) => t.kunci === nilai) ? (nilai as KunciTabSerah) : "hari-ini";
}
