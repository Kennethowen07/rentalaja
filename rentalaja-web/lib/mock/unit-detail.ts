// Data Layar 3 "Detail unit" — dari .dc.html turn 1a.
//
// Bagian yang berbeda per unit (nama, harga, rating, area, penyedia) diambil
// dari lib/mock/search.ts supaya Layar 2 dan Layar 3 tidak pernah berbeda
// angka. Bagian naratif (isi paket, pengecualian, deposit, strip kalender)
// dipakai bersama karena desain hanya menggambarkannya sekali.

import { unitHasil, type UnitHasil } from "@/lib/mock/search";

export type HariKalender = {
  dow: string;
  tanggal: string;
  kosong: boolean;
};

export type DetailUnit = {
  unit: UnitHasil;
  /** Rentang yang sedang ditampilkan, mengikuti rentang pertama desain. */
  rentangLabel: string;
  hari: number;
  meta: string;
  kalender: HariKalender[];
  paket: string[];
  tidakTermasuk: string[];
  deposit: string[];
  penyedia: { nama: string; meta: string };
  harga: {
    perHari: number;
    subtotal: number;
    deposit: number;
    total: number;
    dp: number;
  };
};

/** Strip 7 hari dari desain — Sel 15 dan Jum 18 sudah tersewa. */
const KALENDER: HariKalender[] = [
  { dow: "Sab", tanggal: "12", kosong: true },
  { dow: "Min", tanggal: "13", kosong: true },
  { dow: "Sen", tanggal: "14", kosong: true },
  { dow: "Sel", tanggal: "15", kosong: false },
  { dow: "Rab", tanggal: "16", kosong: true },
  { dow: "Kam", tanggal: "17", kosong: true },
  { dow: "Jum", tanggal: "18", kosong: false },
];

const TIDAK_TERMASUK = [
  "Bensin, unit diserahkan dengan tangki setengah dan dikembalikan setengah.",
  "Parkir dan tilang.",
  "Kerusakan di luar pemakaian normal, tarif perbaikan tertulis di lampiran perjanjian.",
];

const DEPOSIT = [
  "Deposit Rp 300.000, tunai saat serah terima, kembali utuh saat unit diterima tanpa kerusakan baru.",
  "Dokumen wajib, KTP atau paspor dan SIM C atau SIM internasional. Diunggah di langkah pemesanan, diverifikasi penyedia sebelum unit diantar.",
  "Batas usia penyewa 18 tahun.",
];

const HARI = 3;
const DEPOSIT_NILAI = 300000;

/** Satu-satunya sumber detail. Mengembalikan null kalau slug tidak dikenal. */
export function detailUnit(slug: string): DetailUnit | null {
  const unit = unitHasil.find((u) => u.id === slug);
  if (!unit) return null;

  const subtotal = unit.hargaPerHari * HARI;

  return {
    unit,
    rentangLabel: "12–14 Sep",
    hari: HARI,
    meta: `${unit.jenis} · matic · ★ ${unit.rating} (128 ulasan) · ${unit.area}, Badung`,
    kalender: KALENDER,
    paket: [
      "2 helm SNI",
      "Jas hujan",
      `Antar jemput area ${unit.area}, gratis`,
      "STNK asli di unit",
    ],
    tidakTermasuk: TIDAK_TERMASUK,
    deposit: DEPOSIT,
    penyedia: {
      nama: unit.penyedia,
      meta: `★ ${unit.rating} · 18 unit · bergabung 2023 · balas dalam 1 jam`,
    },
    harga: {
      perHari: unit.hargaPerHari,
      subtotal,
      deposit: DEPOSIT_NILAI,
      total: subtotal,
      dp: Math.round(subtotal * 0.3),
    },
  };
}
