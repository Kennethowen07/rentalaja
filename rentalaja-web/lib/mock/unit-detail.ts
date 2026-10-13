// Data Layar 3 "Detail unit" — dari .dc.html turn 1a.
//
// Bagian yang berbeda per unit (nama, harga, rating, area, penyedia) diambil
// dari lib/mock/search.ts supaya Layar 2 dan Layar 3 tidak pernah berbeda
// angka. Bagian naratif (isi paket, pengecualian, deposit, strip kalender)
// dipakai bersama karena desain hanya menggambarkannya sekali.

import { unitHasil, type UnitHasil } from "@/lib/mock/search";
import { HARI, hariSingkat, rentangTanggal, tanggalSingkat } from "@/lib/mitra/waktu";
import type { Sewa } from "@/lib/sewa";

export type HariKalender = {
  dow: string;
  tanggal: string;
  kosong: boolean;
};

export type DetailUnit = {
  unit: UnitHasil;
  /** Rentang yang sedang ditampilkan, berasal dari pilihan penyewa di /cari. */
  rentangLabel: string;
  hari: number;
  /** Rentang mentahnya, supaya halaman ini bisa meneruskannya ke pemesanan. */
  sewa: Sewa;
  meta: string;
  kalender: HariKalender[];
  paket: string[];
  tidakTermasuk: string[];
  jaminan: string[];
  penyedia: { nama: string; meta: string };
  harga: {
    perHari: number;
    subtotal: number;
    layanan: number;
    total: number;
  };
};

/** Hari ke berapa dalam strip yang sudah tersewa. Desain menandai dua hari
 *  (Sel 15 dan Jum 18 dari tanggal mulai 12), dan posisi itulah yang
 *  dipertahankan, bukan tanggalnya. */
const INDEKS_TERSEWA = [3, 6];

/** Strip 7 hari mulai dari tanggal ambil. Dulu tanggalnya tertulis mati
 *  "12" sampai "18", sehingga ikut basi bersama sisa halaman. */
function bangunKalender(mulai: number): HariKalender[] {
  return Array.from({ length: 7 }, (_, i) => {
    const t = mulai + i * HARI;
    return {
      dow: hariSingkat(t),
      tanggal: String(Number(tanggalSingkat(t).split(" ")[0])),
      kosong: !INDEKS_TERSEWA.includes(i),
    };
  });
}

const TIDAK_TERMASUK = [
  "Bensin, unit diserahkan dengan tangki setengah dan dikembalikan setengah.",
  "Parkir dan tilang.",
  "Kerusakan di luar pemakaian normal, tarif perbaikan tertulis di lampiran perjanjian.",
];

const JAMINAN = [
  "Tanpa deposit tunai. Pembayaranmu ditahan rentalaja sampai unit kembali, lalu diteruskan ke penyedia.",
  "Dokumen wajib, KTP atau paspor dan SIM C atau SIM internasional. Diunggah di langkah pemesanan, diverifikasi penyedia sebelum unit diantar.",
  "Batas usia penyewa 18 tahun.",
];

// Biaya layanan rentalaja, sudah termasuk di angka yang dibayar penyewa.
const LAYANAN = 5000;

/** Satu-satunya sumber detail. Mengembalikan null kalau slug tidak dikenal.
 *
 *  `sewa` wajib diisi pemanggil: halaman ini dulu memakai "12–14 Sep" dan
 *  durasi 3 hari yang tertulis mati, sehingga harga dan kalendernya tidak
 *  pernah cocok dengan tanggal yang dipilih penyewa di layar sebelumnya. */
export function detailUnit(slug: string, sewa: Sewa): DetailUnit | null {
  const unit = unitHasil.find((u) => u.id === slug);
  if (!unit) return null;

  const subtotal = unit.hargaPerHari * sewa.hari;

  return {
    unit,
    rentangLabel: rentangTanggal(sewa.mulai, sewa.mulai + sewa.hari * HARI),
    hari: sewa.hari,
    sewa,
    meta: `${unit.jenis} · matic · ★ ${unit.rating} (128 ulasan) · ${unit.area}, Badung`,
    kalender: bangunKalender(sewa.mulai),
    paket: [
      "2 helm SNI",
      "Jas hujan",
      `Antar jemput area ${unit.area}, gratis`,
      "STNK asli di unit",
    ],
    tidakTermasuk: TIDAK_TERMASUK,
    jaminan: JAMINAN,
    penyedia: {
      nama: unit.penyedia,
      meta: `★ ${unit.rating} · 18 unit · bergabung 2023 · balas dalam 1 jam`,
    },
    harga: {
      perHari: unit.hargaPerHari,
      subtotal,
      layanan: LAYANAN,
      total: subtotal + LAYANAN,
    },
  };
}
