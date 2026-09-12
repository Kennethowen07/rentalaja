// Data Layar 4 "Pemesanan" — dari .dc.html turn 1a.
//
// Angka di desain konsisten dan dipertahankan apa adanya:
//   3 hari x Rp 70.000            = Rp 210.000
//   DP 30% dari sewa (Rp 63.000) + biaya layanan Rp 5.000 = Rp 68.000
//   sisa tunai saat serah terima  = Rp 147.000
//   deposit tunai (dikembalikan)  = Rp 300.000
//
// Nilai yang di desain tampil sebagai isi form (nama penyewa, nomor, email,
// titik antar) di sini turun jadi PLACEHOLDER. Formnya mulai kosong supaya
// bisa diisi sungguhan, dan stepper baru menghijau setelah terisi.

export const pesanan = {
  unit: {
    nama: "Honda Scoopy 2023",
    penyedia: "Bali Motor Rent",
    rating: "4,9",
    foto: "/units/honda-scoopy-2023.jpeg",
  },
  rincian: [
    { label: "3 hari sewa", nilai: "Rp 210.000" },
    { label: "Antar jemput", nilai: "Gratis" },
    { label: "Biaya layanan", nilai: "Rp 5.000" },
  ],
  dp: "Rp 68.000",
  sisa: "Rp 147.000",
  deposit: "Rp 300.000",
} as const;

export const langkah = [
  "1 · Konfirmasi",
  "2 · Dokumen",
  "3 · Bayar DP",
] as const;

export const opsiPengambilan = [
  "Diantar ke titik ini",
  "Ambil sendiri di rental",
] as const;

export const metodePembayaran = [
  "Transfer bank · BCA Virtual Account",
  "QRIS",
  "E-wallet",
] as const;

/** Nilai desain, dipakai sebagai contoh di placeholder input. */
export const contohIsian = {
  titikAntar: "Jl. Pantai Batu Bolong No. 12, Canggu",
  nama: "Adi Prasetyo",
  whatsapp: "+62 812 3456 7890",
  email: "adi@email.com",
} as const;

export const labelDokumen = {
  identitas: "KTP / Paspor",
  sim: "SIM C",
} as const;

export const petunjukBerkas = "Tarik file ke sini atau pilih";
