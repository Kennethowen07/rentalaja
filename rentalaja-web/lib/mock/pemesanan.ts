// Data Layar 4 "Pemesanan" — dari .dc.html turn 1a.
//
// Angka di desain konsisten dan dipertahankan apa adanya:
//   3 hari x Rp 70.000     = Rp 210.000
//   biaya layanan          = Rp 5.000
//   dibayar penuh sekarang = Rp 215.000, ditahan rentalaja sampai unit kembali
//
// Mekanismenya bayar penuh di muka, bukan DP. Tidak ada sisa tunai saat
// serah terima dan tidak ada deposit tunai ke pemilik.
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
  total: "Rp 215.000",
} as const;

export const langkah = [
  "1 · Konfirmasi",
  "2 · Dokumen",
  "3 · Bayar penuh",
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

/** Nilai untuk tombol "Simulasikan Langsung" — mengisi seluruh form sekaligus
 *  supaya alur bisa dicoba berulang tanpa mengetik ulang.
 *
 *  Tanggalnya sengaja 12–14 Sep 2026, sama persis dengan periode sewa yang
 *  ditampilkan Layar 5, jadi hasil simulasi nyambung dengan halaman pesanan
 *  aktif yang muncul setelahnya. */
export const simulasi = {
  ambil: "2026-09-12T09:00",
  kembali: "2026-09-14T09:00",
  titikAntar: contohIsian.titikAntar,
  pengambilan: 0,
  ktp: "ktp-adi.jpg",
  sim: "sim-adi.jpg",
  nama: contohIsian.nama,
  whatsapp: contohIsian.whatsapp,
  email: contohIsian.email,
  pembayaran: 0,
} as const;
