// PERTANYAAN = copy verbatim dari README section 10.
//
// TODO(copy): JAWABAN di bawah adalah DRAFT, bukan copy final. README menulis
// "(jawaban belum ditulis — minta copy ke pemilik produk)". Draft ini hanya
// supaya accordion bisa didemokan; ganti seluruhnya setelah copy disetujui.

export type FaqItem = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

export const faqItems: FaqItem[] = [
  {
    id: "harga-berubah",
    pertanyaan: "Apakah harga bisa berubah setelah saya bayar DP?",
    jawaban:
      "Tidak. Harga yang kamu lihat saat membayar DP adalah harga akhir. Sisa pembayaran dan deposit sudah tertulis di rincian sebelum kamu bayar.",
  },
  {
    id: "pembatalan",
    pertanyaan: "Bagaimana kalau saya ingin membatalkan pesanan?",
    jawaban:
      "Pembatalan bisa dilakukan dari halaman pesanan aktif. Ketentuan pengembalian DP mengikuti kebijakan penyedia yang tertera di halaman unit sebelum kamu memesan.",
  },
  {
    id: "dokumen",
    pertanyaan: "Dokumen apa yang perlu saya siapkan saat unit diantar?",
    jawaban:
      "KTP atau paspor, dan SIM yang masih berlaku. Keduanya diunggah saat pemesanan lalu dicocokkan kembali oleh penyedia saat serah terima.",
  },
  {
    id: "deposit",
    pertanyaan: "Apakah deposit dikembalikan penuh?",
    jawaban:
      "Ya, selama kondisi unit saat dikembalikan sama dengan foto serah terima awal. Potongan hanya berlaku untuk kerusakan yang tercatat di serah terima akhir.",
  },
];
