// Copy verbatim dari README section 7, plus terjemahan Inggrisnya. Tanda
// kutip lengkung (“ ”) memang bagian dari desain — jangan diganti kutip lurus.
//
// Avatar dipotong persegi di sekitar wajah dari foto unggahan di assets/.
// Testimoni ini fiktif; lihat catatan di docs/ASSETS_NEEDED.md soal memakai
// wajah orang sungguhan pada testimoni yang dikarang.

import { kamus } from "@/lib/i18n";

export type Testimoni = {
  id: string;
  kutipan: string;
  nama: string;
  meta: string;
  foto: string;
};

export const testimoni = kamus<Testimoni[]>({
  id: [
    {
      id: "dimas",
      kutipan:
        "“Tanggal yang muncul memang kosong. Tidak ada lagi drama unit sudah keburu dipakai orang.”",
      nama: "Dimas",
      meta: "Canggu, 3 hari",
      foto: "/avatars/testimoni-dimas.webp",
    },
    {
      id: "sarah",
      kutipan:
        "“Bayar sekali di aplikasi, tidak ada tarik-tarikan uang tunai waktu motor sampai.”",
      nama: "Sarah",
      meta: "Seminyak, 5 hari",
      foto: "/avatars/testimoni-sarah.webp",
    },
    {
      id: "yoga",
      kutipan:
        "“Foto serah terima menyelamatkan saya waktu ada lecet yang sudah ada sejak awal.”",
      nama: "Yoga",
      meta: "Ubud, 2 hari",
      foto: "/avatars/testimoni-yoga.webp",
    },
  ],
  en: [
    {
      id: "dimas",
      kutipan:
        "“The dates that show up really are free. No more drama about the scooter already being taken.”",
      nama: "Dimas",
      meta: "Canggu, 3 days",
      foto: "/avatars/testimoni-dimas.webp",
    },
    {
      id: "sarah",
      kutipan: "“Paid once in the app, no haggling over cash when the scooter arrived.”",
      nama: "Sarah",
      meta: "Seminyak, 5 days",
      foto: "/avatars/testimoni-sarah.webp",
    },
    {
      id: "yoga",
      kutipan:
        "“The handover photos saved me when there was a scratch that had been there from the start.”",
      nama: "Yoga",
      meta: "Ubud, 2 days",
      foto: "/avatars/testimoni-yoga.webp",
    },
  ],
});
