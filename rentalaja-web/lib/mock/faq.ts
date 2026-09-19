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
    pertanyaan: "Apakah harga bisa berubah setelah saya bayar?",
    jawaban:
      "Tidak. Angka yang kamu bayar adalah harga akhir, sudah termasuk biaya layanan. Tidak ada pembayaran susulan saat unit diantar.",
  },
  {
    id: "pembatalan",
    pertanyaan: "Bagaimana kalau saya ingin membatalkan pesanan?",
    jawaban:
      "Pembatalan bisa dilakukan dari halaman pesanan aktif. Karena dananya masih ditahan rentalaja dan belum diteruskan ke penyedia, pengembalian mengikuti kebijakan penyedia yang tertera di halaman unit sebelum kamu memesan.",
  },
  {
    id: "dokumen",
    pertanyaan: "Dokumen apa yang perlu saya siapkan saat unit diantar?",
    jawaban:
      "KTP atau paspor, dan SIM yang masih berlaku. Keduanya diunggah saat pemesanan lalu dicocokkan kembali oleh penyedia saat serah terima.",
  },
  {
    id: "escrow",
    pertanyaan: "Kenapa tidak ada deposit tunai?",
    jawaban:
      "Karena pembayaranmu ditahan rentalaja sampai unit kembali, jadi penyedia tidak perlu memegang uang jaminanmu. Klaim kerusakan hanya bisa diajukan dengan bukti foto serah terima, dan ditagih terpisah, bukan dipotong diam-diam.",
  },
];
