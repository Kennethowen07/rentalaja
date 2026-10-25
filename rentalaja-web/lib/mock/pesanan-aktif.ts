// Data Layar 5 "Pesanan aktif" — verbatim dari .dc.html turn 1a, plus
// terjemahan Inggrisnya. Ambil per bahasa: pesananAktif[bahasa].
//
// Angkanya menyambung dari Layar 4: pembayaran penuh Rp 215.000 sudah masuk
// dan masih ditahan rentalaja sampai unit kembali. Baris escrow itu yang
// diberi warna peringatan, karena uang penyewa memang belum selesai
// perjalanannya, walaupun sekarang ditahan platform, bukan pemilik unit.

import { kamus } from "@/lib/i18n";

export type TahapPesanan = {
  label: string;
  waktu: string;
  selesai: boolean;
};

export type BarisBayar = {
  label: string;
  nilai: string;
  /** true untuk dana yang masih ditahan escrow (warna peringatan). */
  ditahan?: boolean;
};

// Dipetakan per sudut dari foto unggahan. Keempatnya Scoopy dengan warna
// berbeda, dan "kanan" sebenarnya tampak depan-kiri karena tidak ada foto
// sisi kanan. Foto kelima (speedometer dan bensin) dari skuter lain,
// kreditnya di lib/mock/kredit-foto.ts. Untuk produk sungguhan semuanya
// harus unit yang sama.
const FOTO_SISI = [
  "/serah-terima/scoopy-depan.webp",
  "/serah-terima/scoopy-belakang.webp",
  "/serah-terima/scoopy-kiri.webp",
  "/serah-terima/scoopy-kanan.webp",
  "/serah-terima/scoopy-speedometer.webp",
];

const sisi = (label: string[]) => label.map((l, i) => ({ label: l, foto: FOTO_SISI[i] }));

export const pesananAktif = kamus({
  id: {
    kode: "#RA-284193",
    status: "Sedang disewa",
    statusDetail: "Kembalikan Senin, 14 Sep 2026 pukul 09.00",

    unit: {
      nama: "Honda Scoopy 2023",
      plat: "Plat DK 4821 XY",
      // Dirender dengan panah panjang di antaranya.
      periode: { mulai: "12 Sep 09.00", selesai: "14 Sep 09.00" },
      foto: "/units/honda-scoopy-2023.webp",
    },

    tahap: [
      { label: "Dikonfirmasi", waktu: "11 Sep, 20.14", selesai: true },
      { label: "Unit diantar", waktu: "12 Sep, 09.05", selesai: true },
      { label: "Pengembalian", waktu: "14 Sep, 09.00", selesai: false },
    ] as TahapPesanan[],

    serahTerima: {
      judul: "Serah terima berfoto",
      sisi: sisi(["depan", "belakang", "kiri", "kanan", "speedometer dan bensin"]),
      catatan: "Diambil 12 Sep 09:05, Odometer 18.204km",
    },

    pembayaran: [
      { label: "Dibayar penuh 11 Sep · BCA VA", nilai: "Rp 215.000" },
      { label: "Deposit tunai ke pemilik", nilai: "Tidak ada" },
      { label: "Ditahan rentalaja sampai unit kembali", nilai: "Rp 215.000", ditahan: true },
    ] as BarisBayar[],

    penyedia: {
      nama: "Bali Motor Rent",
      meta: "★ 4,9 · Pak Wayan",
    },

    // Alamat sama dengan titik antar di Layar 4, dipetakan PetaLokasi.
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
  },
  en: {
    kode: "#RA-284193",
    status: "Currently rented",
    statusDetail: "Return by Monday, 14 Sep 2026 at 09:00",

    unit: {
      nama: "Honda Scoopy 2023",
      plat: "Plate DK 4821 XY",
      periode: { mulai: "12 Sep 09:00", selesai: "14 Sep 09:00" },
      foto: "/units/honda-scoopy-2023.webp",
    },

    tahap: [
      { label: "Confirmed", waktu: "11 Sep, 20:14", selesai: true },
      { label: "Delivered", waktu: "12 Sep, 09:05", selesai: true },
      { label: "Return", waktu: "14 Sep, 09:00", selesai: false },
    ],

    serahTerima: {
      judul: "Photo handover",
      sisi: sisi(["front", "rear", "left", "right", "speedometer and fuel"]),
      catatan: "Taken 12 Sep 09:05, Odometer 18,204 km",
    },

    pembayaran: [
      { label: "Paid in full 11 Sep · BCA VA", nilai: "Rp 215.000" },
      { label: "Cash deposit to the owner", nilai: "None" },
      { label: "Held by rentalaja until the vehicle is returned", nilai: "Rp 215.000", ditahan: true },
    ],

    penyedia: {
      nama: "Bali Motor Rent",
      meta: "★ 4.9 · Pak Wayan",
    },

    titikPengembalian: {
      alamat: "Jl. Pantai Batu Bolong No. 12, Canggu",
      waktu: "Monday, 14 Sep 2026 at 09:00 · same as the delivery point",
    },

    perluUbah: {
      aksi: [
        { label: "Extend rental", bahaya: false },
        { label: "Request a reschedule", bahaya: false },
        { label: "Report a problem with the vehicle", bahaya: true },
      ],
      catatan:
        "Extensions depend on the vehicle's calendar. If someone else has already booked it, we'll offer another vehicle from the same rental.",
    },
  },
});
