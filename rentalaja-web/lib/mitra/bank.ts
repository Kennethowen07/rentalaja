// Daftar bank untuk form rekening mitra. SALINAN dari BANK di
// rentalaja-api/src/umum/rekening.ts (frontend tidak bisa mengimpor kode
// backend). Kalau daftar di sana berubah, ubah juga di sini; server tetap
// yang menentukan: bank yang tidak dikenal dan panjang nomor yang salah
// ditolak API dengan 400.

export type Bank = { kode: string; nama: string; /** Panjang nomor kalau pasti. */ digit?: number };

export const BANK: readonly Bank[] = [
  { kode: "BCA", nama: "BCA", digit: 10 },
  { kode: "BNI", nama: "BNI", digit: 10 },
  { kode: "BRI", nama: "BRI", digit: 15 },
  { kode: "MANDIRI", nama: "Mandiri", digit: 13 },
  { kode: "BSI", nama: "BSI" },
  { kode: "CIMB", nama: "CIMB Niaga" },
  { kode: "PERMATA", nama: "Permata" },
  { kode: "DANAMON", nama: "Danamon" },
  { kode: "BTN", nama: "BTN" },
  { kode: "BPD_BALI", nama: "BPD Bali" },
  { kode: "JAGO", nama: "Bank Jago" },
  { kode: "SEABANK", nama: "SeaBank" },
];
