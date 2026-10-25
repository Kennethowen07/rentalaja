// PERTANYAAN = copy verbatim dari README section 10, plus terjemahan Inggris.
//
// TODO(copy): JAWABAN di bawah adalah DRAFT, bukan copy final. README menulis
// "(jawaban belum ditulis — minta copy ke pemilik produk)". Draft ini hanya
// supaya accordion bisa didemokan; ganti seluruhnya setelah copy disetujui.

import { kamus } from "@/lib/i18n";

export type FaqItem = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

export const faqItems = kamus<FaqItem[]>({
  id: [
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
  ],
  en: [
    {
      id: "harga-berubah",
      pertanyaan: "Can the price change after I pay?",
      jawaban:
        "No. The amount you pay is the final price, service fee included. There's no extra payment when the vehicle is delivered.",
    },
    {
      id: "pembatalan",
      pertanyaan: "What if I want to cancel my booking?",
      jawaban:
        "You can cancel from the active booking page. Because the money is still held by rentalaja and hasn't been passed on to the provider, refunds follow the provider's policy shown on the vehicle page before you book.",
    },
    {
      id: "dokumen",
      pertanyaan: "What documents do I need when the vehicle is delivered?",
      jawaban:
        "Your ID card or passport, and a valid driving licence. Both are uploaded when you book and checked again by the provider at handover.",
    },
    {
      id: "escrow",
      pertanyaan: "Why is there no cash deposit?",
      jawaban:
        "Because your payment is held by rentalaja until the vehicle is returned, the provider doesn't need to hold a deposit from you. Damage claims can only be made with handover photos as evidence, and they're billed separately, never quietly deducted.",
    },
  ],
});
