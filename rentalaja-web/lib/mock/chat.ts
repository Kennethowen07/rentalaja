// Riwayat chat penyewa dengan penyedia, untuk /chat.
//
// Percakapan pertama menyambung dari Layar 5 (pesanan #RA-284193, Scoopy
// dari Bali Motor Rent); waktunya mengikuti timeline di pesanan-aktif.ts.
// Pesan yang diketik penyewa di /chat hanya ditambahkan ke state halaman,
// tidak disimpan dan tidak dikirim ke mana pun.

import type { Bahasa, Teks } from "@/lib/i18n";

export type Pesan = {
  dari: "saya" | "penyedia";
  teks: string;
  /** Sudah diformat, mis. "11 Sep, 20.15". */
  waktu: string;
};

export type Percakapan = {
  /** Dipakai di /chat?dengan=<id>. */
  id: string;
  penyedia: string;
  /** Pesanan yang dibicarakan, tampil di bawah nama penyedia. */
  pesanan: string;
  belumDibaca: boolean;
  pesan: Pesan[];
};

/** Percakapan dengan penyedia pesanan aktif, tujuan tombol "Hubungi penyedia". */
export const ID_CHAT_PESANAN_AKTIF = "bali-motor-rent";

type PesanMentah = { dari: Pesan["dari"]; teks: Teks; waktu: Teks };

// Jam ditulis "20.15" di bahasa Indonesia dan "20:15" di bahasa Inggris.
const w = (tanggal: string, jam: string): Teks => ({
  id: `${tanggal}, ${jam}`,
  en: `${tanggal}, ${jam.replace(".", ":")}`,
});

const SEMUA: (Omit<Percakapan, "pesan"> & { pesan: PesanMentah[] })[] = [
  {
    id: ID_CHAT_PESANAN_AKTIF,
    penyedia: "Bali Motor Rent",
    pesanan: "#RA-284193 · Honda Scoopy 2023",
    belumDibaca: true,
    pesan: [
      {
        dari: "penyedia",
        teks: {
          id: "Halo, pesanan Honda Scoopy untuk 12 sampai 14 Sep sudah kami konfirmasi. Unit diantar besok jam 09.00 ke Jl. Pantai Batu Bolong No. 12, Canggu.",
          en: "Hi, we've confirmed your Honda Scoopy booking for 12 to 14 Sep. We'll deliver it tomorrow at 09:00 to Jl. Pantai Batu Bolong No. 12, Canggu.",
        },
        waktu: w("11 Sep", "20.15"),
      },
      {
        dari: "saya",
        teks: { id: "Siap, terima kasih Pak. Helmnya dua ya?", en: "Great, thank you. Are there two helmets?" },
        waktu: w("11 Sep", "20.21"),
      },
      {
        dari: "penyedia",
        teks: { id: "Betul, dua helm dan STNK ikut diantar.", en: "Yes, two helmets and the registration papers come with it." },
        waktu: w("11 Sep", "20.23"),
      },
      {
        dari: "penyedia",
        teks: {
          id: "Unit sudah diantar dan foto serah terima sudah diunggah. Selamat jalan-jalan!",
          en: "The scooter has been delivered and the handover photos are uploaded. Enjoy your trip!",
        },
        waktu: w("12 Sep", "09.06"),
      },
    ],
  },
  {
    id: "wayan-rental",
    penyedia: "Wayan Rental",
    pesanan: "#RA-271560 · Honda Beat 2022",
    belumDibaca: false,
    pesan: [
      {
        dari: "saya",
        teks: { id: "Pak, boleh diantar jam 08.00 saja?", en: "Hi, could you deliver at 08:00 instead?" },
        waktu: { id: "2 Agu, 19.40", en: "2 Aug, 19:40" },
      },
      {
        dari: "penyedia",
        teks: { id: "Bisa, kami antar jam 08.00.", en: "Sure, we'll deliver at 08:00." },
        waktu: { id: "2 Agu, 19.52", en: "2 Aug, 19:52" },
      },
      {
        dari: "penyedia",
        teks: {
          id: "Unit sudah kami terima kembali. Terima kasih sudah menyewa!",
          en: "We've received the scooter back. Thanks for renting with us!",
        },
        waktu: { id: "5 Agu, 10.12", en: "5 Aug, 10:12" },
      },
    ],
  },
];

/** Daftar percakapan dalam satu bahasa. */
export function daftarPercakapan(bahasa: Bahasa): Percakapan[] {
  return SEMUA.map((p) => ({
    ...p,
    pesan: p.pesan.map((m) => ({ dari: m.dari, teks: m.teks[bahasa], waktu: m.waktu[bahasa] })),
  }));
}
