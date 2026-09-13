// Copy verbatim dari README section 7. Tanda kutip lengkung (“ ”) memang
// bagian dari desain — jangan diganti kutip lurus.
//
// Avatar dipotong persegi di sekitar wajah dari foto unggahan di assets/.
// Testimoni ini fiktif; lihat catatan di docs/ASSETS_NEEDED.md soal memakai
// wajah orang sungguhan pada testimoni yang dikarang.

export type Testimoni = {
  id: string;
  kutipan: string;
  nama: string;
  meta: string;
  foto: string;
};

export const testimoni: Testimoni[] = [
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
      "“DP 30% bikin tenang. Sisanya bayar saat motor sampai di penginapan.”",
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
];
