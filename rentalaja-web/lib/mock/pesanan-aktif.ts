// Data Layar 5 "Pesanan aktif" — verbatim dari .dc.html turn 1a.
//
// Angkanya menyambung dari Layar 4: DP Rp 68.000 sudah terbayar, sisa tunai
// Rp 147.000 sudah diterima penyedia, dan deposit Rp 300.000 masih ditahan
// — yang terakhir itu satu-satunya baris yang diberi warna peringatan di
// desain, karena uang penyewa masih ada di pihak lain.

export type TahapPesanan = {
  label: string;
  waktu: string;
  selesai: boolean;
};

export type BarisBayar = {
  label: string;
  nilai: string;
  /** true untuk deposit yang masih ditahan penyedia (warna peringatan). */
  ditahan?: boolean;
};

export const pesananAktif = {
  kode: "#RA-284193",
  status: "Sedang disewa",
  statusDetail:
    "Kembalikan Senin, 14 Sep 2026 pukul 09.00 · sisa 1 hari 4 jam",

  unit: {
    nama: "Honda Scoopy 2023",
    plat: "Plat DK 4821 XY · skutik 110cc",
    periode: "12 Sep 09.00 → 14 Sep 09.00 · 3 hari",
    foto: "/units/honda-scoopy-2023.jpeg",
  },

  tahap: [
    { label: "Dikonfirmasi", waktu: "11 Sep, 20.14", selesai: true },
    { label: "Unit diantar", waktu: "12 Sep, 09.05", selesai: true },
    { label: "Pengembalian", waktu: "14 Sep, 09.00", selesai: false },
  ] satisfies TahapPesanan[],

  serahTerima: {
    judul: "Serah terima berfoto",
    sub: "Empat foto saat unit diantar, disetujui kedua pihak. Jadi acuan saat pengembalian.",
    // Dipetakan per sudut dari foto unggahan. Keempatnya Scoopy dengan warna
    // berbeda, dan "kanan" sebenarnya tampak depan-kiri karena tidak ada foto
    // sisi kanan. Untuk produk sungguhan keempatnya harus unit yang sama.
    sisi: [
      { label: "depan", foto: "/serah-terima/scoopy-depan.webp" },
      { label: "belakang", foto: "/serah-terima/scoopy-belakang.webp" },
      { label: "kiri", foto: "/serah-terima/scoopy-kiri.webp" },
      { label: "kanan", foto: "/serah-terima/scoopy-kanan.webp" },
    ],
    catatan:
      "Depan, belakang, kiri, kanan · diambil 12 Sep 09.05 · odometer 18.204 km · bensin setengah",
  },

  pembayaran: [
    { label: "DP terbayar 11 Sep · BCA VA", nilai: "Rp 68.000" },
    { label: "Sisa tunai, diterima penyedia 12 Sep", nilai: "Rp 147.000" },
    {
      label: "Deposit tunai ditahan penyedia",
      nilai: "Rp 300.000",
      ditahan: true,
    },
  ] satisfies BarisBayar[],

  penyedia: {
    nama: "Bali Motor Rent",
    meta: "★ 4,9 · Pak Wayan",
  },

  // Alamat sama dengan titik antar di Layar 4. Petanya dirender PetaLokasi
  // dari alamat ini: Google Maps Embed, dengan gambar statis sebagai cadangan.
  titikPengembalian: {
    alamat: "Jl. Pantai Batu Bolong No. 12, Canggu",
    waktu: "Senin, 14 Sep 2026 pukul 09.00 · sama dengan titik antar",
  },

  perluUbah: {
    aksi: [
      { label: "Perpanjang sewa", bahaya: false },
      { label: "Ajukan reschedule", bahaya: false },
      { label: "Laporkan masalah unit", bahaya: true },
    ],
    catatan:
      "Perpanjangan tergantung kalender unit. Kalau sudah dipesan orang lain, sistem menawarkan unit lain di rental yang sama.",
  },
} as const;
