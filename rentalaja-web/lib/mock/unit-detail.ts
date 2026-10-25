// Data Layar 3 "Detail unit" — dari .dc.html turn 1a.
//
// Bagian yang berbeda per unit (nama, harga, rating, area, penyedia) diambil
// dari lib/mock/search.ts supaya Layar 2 dan Layar 3 tidak pernah berbeda
// angka. Bagian naratif (isi paket, pengecualian, deposit, strip kalender)
// dipakai bersama karena desain hanya menggambarkannya sekali.

import { biayaLayanan } from "@/lib/harga";
import { desimal, lokal, type Bahasa } from "@/lib/i18n";
import { type Kategori, unitHasil, type UnitHasil } from "@/lib/mock/search";
import { HARI, rentangTanggal, tanggalSingkat } from "@/lib/mitra/waktu";
import type { Sewa } from "@/lib/sewa";

/** Satu hari dalam rentang sewa, mis. { hari: "Senin", tanggal: "26" }. */
export type HariSewa = {
  hari: string;
  tanggal: string;
};

export type DetailUnit = {
  unit: UnitHasil;
  /** Rentang yang sedang ditampilkan, berasal dari pilihan penyewa di /cari. */
  rentangLabel: string;
  hari: number;
  /** Rentang mentahnya, supaya halaman ini bisa meneruskannya ke pemesanan. */
  sewa: Sewa;
  /** Dua foto tambahan untuk galeri, berkas {unit}-2.webp dan {unit}-3.webp
   *  di public/units/ (kreditnya di lib/mock/kredit-foto.ts). */
  fotoLain: string[];
  /** Hari ambil sampai hari kembali, termasuk keduanya. */
  hariSewa: HariSewa[];
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


/** Hari-hari yang disewa, dari tanggal ambil sampai tanggal kembali.
 *  Menggantikan strip "Ketersediaan 7 hari" (25 Okt 2026): unit yang
 *  dibuka dari pencarian sudah pasti kosong di rentang ini, jadi status
 *  kosong/tersewa per hari tidak perlu ditampilkan. */
function bangunHariSewa(sewa: Sewa, bahasa: Bahasa): HariSewa[] {
  const namaHari = new Intl.DateTimeFormat(lokal(bahasa), { weekday: "long", timeZone: "Asia/Makassar" });
  return Array.from({ length: sewa.hari + 1 }, (_, i) => {
    const t = sewa.mulai + i * HARI;
    return { hari: namaHari.format(t), tanggal: String(Number(tanggalSingkat(t).split(" ")[0])) };
  });
}

const TIDAK_TERMASUK: Record<Bahasa, string[]> = {
  id: [
    "Bensin, unit diserahkan dengan tangki setengah dan dikembalikan setengah.",
    "Parkir dan tilang.",
    "Kerusakan di luar pemakaian normal, tarif perbaikan tertulis di lampiran perjanjian.",
  ],
  en: [
    "Fuel. The vehicle is handed over with half a tank and returned with half a tank.",
    "Parking and traffic fines.",
    "Damage beyond normal use. Repair rates are listed in the agreement appendix.",
  ],
};

/** SIM yang diminta mengikuti kategori: SIM C untuk motor, SIM A untuk mobil. */
function jaminan(kategori: Kategori, bahasa: Bahasa): string[] {
  const sim = kategori === "mobil" ? "SIM A" : "SIM C";
  if (bahasa === "en") {
    const izin = kategori === "mobil" ? "a car licence (SIM A)" : "a motorcycle licence (SIM C)";
    return [
      "Pay the rental up front, no deposit.",
      "Required documents: ID card or passport, plus " + izin + " or an international driving permit. Uploaded during booking and verified by the provider before delivery.",
      "Renters must be at least 18 years old.",
    ];
  }
  return [
    "Bayar sewa langsung tanpa deposit.",
    "Dokumen wajib, KTP atau paspor dan " + sim + " atau SIM internasional. Diunggah di langkah pemesanan, diverifikasi penyedia sebelum unit diantar.",
    "Batas usia penyewa 18 tahun.",
  ];
}

/** Isi paket per kategori, sengaja ringkas atas permintaan pemilik proyek. */
function paket(unit: UnitHasil, bahasa: Bahasa): string[] {
  const stnk = bahasa === "en" ? "Registration papers (STNK)" : "STNK";
  if (unit.kategori === "mobil") return [stnk];
  return [bahasa === "en" ? "2 helmets" : "2 helm", stnk];
}


/** Satu-satunya sumber detail. Mengembalikan null kalau slug tidak dikenal.
 *
 *  `sewa` wajib diisi pemanggil: halaman ini dulu memakai "12–14 Sep" dan
 *  durasi 3 hari yang tertulis mati, sehingga harga dan kalendernya tidak
 *  pernah cocok dengan tanggal yang dipilih penyewa di layar sebelumnya. */
export function detailUnit(slug: string, sewa: Sewa, bahasa: Bahasa = "id"): DetailUnit | null {
  const unit = unitHasil.find((u) => u.id === slug);
  if (!unit) return null;

  const subtotal = unit.hargaPerHari * sewa.hari;
  const layanan = biayaLayanan(subtotal);

  return {
    unit,
    rentangLabel: rentangTanggal(sewa.mulai, sewa.mulai + sewa.hari * HARI, bahasa),
    hari: sewa.hari,
    sewa,
    fotoLain: unit.foto ? [2, 3].map((n) => unit.foto!.replace(".webp", "-" + n + ".webp")) : [],
    hariSewa: bangunHariSewa(sewa, bahasa),
    paket: paket(unit, bahasa),
    tidakTermasuk: TIDAK_TERMASUK[bahasa],
    jaminan: jaminan(unit.kategori, bahasa),
    penyedia: {
      nama: unit.penyedia,
      meta:
        bahasa === "en"
          ? `★ ${desimal(unit.rating, bahasa)} · 18 Vehicles · Joined in 2023 (Average Reply Time: 1 Hour)`
          : `★ ${unit.rating} · 18 Unit · Bergabung Sejak 2023 (Rata-Rata Waktu Balas: 1 Jam)`,
    },
    harga: {
      perHari: unit.hargaPerHari,
      subtotal,
      layanan,
      total: subtotal + layanan,
    },
  };
}
