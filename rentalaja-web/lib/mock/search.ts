// Mock data Layar 2 "Hasil pencarian".
//
// Diambil dari kelas DCLogic di dalam
// design_handoff_rentalaja_landing/RentalAja Wireframes.dc.html (turn 1a).
// Desain aslinya punya 3 chip rentang tanggal; atas permintaan pemilik
// proyek (25 Okt 2026) /cari kini hanya menampilkan rentang yang dicari
// penyewa, jadi status kosong tiap unit cukup satu nilai. Ketersediaan
// sungguhan per tanggal datang dari API (rentalaja-api GET /pencarian).
//
// Catatan: desain memberi Honda Scoopy harga Rp 70.000 di layar ini, tapi
// Rp 75.000 di kartu "Unit populer" landing page. Keduanya dipertahankan
// apa adanya sesuai aturan copy verbatim; angkanya memang tidak konsisten
// di file desain.

// Formatter tanggal WITA dipakai bersama dengan panel mitra. Letaknya di
// lib/mitra/ karena di sanalah pertama kali dibutuhkan, tapi isinya tidak
// mitra-spesifik: semua tanggal di produk ini memakai zona Bali.
import type { Bahasa } from "@/lib/i18n";
import { HARI, rentangTanggal } from "@/lib/mitra/waktu";
import type { Sewa } from "@/lib/sewa";

export type RentangTanggal = {
  label: string;
  hari: number;
  /** Epoch ms tengah malam WITA, dipakai saat tanggal diteruskan ke layar lain. */
  mulai: number;
  /** Tanggal unit dikembalikan, yaitu mulai + hari. */
  selesai: number;
};

/** Rentang yang dicari penyewa, dari ?mulai=&durasi= (lihat lib/sewa.ts). */
export function rentangDari(sewa: Sewa, bahasa: Bahasa = "id"): RentangTanggal {
  const selesai = sewa.mulai + sewa.hari * HARI;
  return { mulai: sewa.mulai, selesai, hari: sewa.hari, label: rentangTanggal(sewa.mulai, selesai, bahasa) };
}

export type Kategori = "motor" | "mobil";

export type UnitHasil = {
  id: string;
  kategori: Kategori;
  nama: string;
  jenis: string;
  tahun: string;
  rating: string;
  area: string;
  penyedia: string;
  hargaPerHari: number;
  /** Kosong di rentang yang dicari. Mock: sama untuk tanggal berapa pun. */
  kosong: boolean;
  /** Foto asli kalau ada; null jatuh ke ImagePlaceholder. */
  foto: string | null;
};

export const unitHasil: UnitHasil[] = [
  {
    id: "honda-scoopy-2023",
    kategori: "motor",
    nama: "Honda Scoopy 2023",
    jenis: "Skutik 110cc",
    tahun: "2023",
    rating: "4,9",
    area: "Canggu",
    penyedia: "Bali Motor Rent",
    hargaPerHari: 70000,
    kosong: true,
    foto: "/units/honda-scoopy-2023.webp",
  },
  {
    id: "honda-beat-2022",
    kategori: "motor",
    nama: "Honda Beat 2022",
    jenis: "Skutik 110cc",
    tahun: "2022",
    rating: "4,7",
    area: "Kerobokan",
    penyedia: "Wayan Rental",
    hargaPerHari: 55000,
    kosong: true,
    foto: "/units/honda-beat-2022.webp",
  },
  {
    id: "yamaha-nmax-2022",
    kategori: "motor",
    nama: "Yamaha NMAX 155 2022",
    jenis: "Skutik 155cc",
    tahun: "2022",
    rating: "4,8",
    area: "Canggu",
    penyedia: "Bali Motor Rent",
    hargaPerHari: 110000,
    kosong: true,
    foto: "/units/yamaha-nmax-2022.webp",
  },
  {
    id: "vespa-sprint-2021",
    kategori: "motor",
    nama: "Vespa Sprint 2021",
    jenis: "Skutik 150cc",
    tahun: "2021",
    rating: "4,6",
    area: "Seminyak",
    penyedia: "Retro Ride Bali",
    hargaPerHari: 145000,
    kosong: false,
    foto: "/units/vespa-sprint-2021.webp",
  },
  {
    id: "honda-pcx-160-2023",
    kategori: "motor",
    nama: "Honda PCX 160 2023",
    jenis: "Skutik 160cc",
    tahun: "2023",
    rating: "4,8",
    area: "Canggu",
    penyedia: "Dewa Motor",
    hargaPerHari: 120000,
    kosong: true,
    foto: "/units/honda-pcx-160-2023.webp",
  },
  {
    id: "yamaha-fino-2021",
    kategori: "motor",
    nama: "Yamaha Fino 2021",
    jenis: "Skutik 125cc",
    tahun: "2021",
    rating: "4,5",
    area: "Pererenan",
    penyedia: "Pererenan Rent",
    hargaPerHari: 60000,
    kosong: false,
    foto: "/units/yamaha-fino-2021.webp",
  },
  // Mobil. Harga dan area sama dengan kartu "Unit populer" di beranda,
  // yang menautkan ke /unit/toyota-avanza-2021.
  {
    id: "toyota-avanza-2021",
    kategori: "mobil",
    nama: "Toyota Avanza 2021",
    jenis: "MPV 7 kursi",
    tahun: "2021",
    rating: "4,7",
    area: "Ubud",
    penyedia: "Bali Motor Rent",
    hargaPerHari: 320000,
    kosong: true,
    foto: "/units/toyota-avanza-2021.webp",
  },
];

/** Tag paket di kartu hasil, per kategori. Mobil disewa tanpa sopir
 *  (backend.md bagian 1), jadi itu yang disebut, bukan helm. */
export const tagPaket: Record<Bahasa, Record<Kategori, string[]>> = {
  id: {
    motor: ["2 helm", "Jas hujan", "Antar gratis"],
    mobil: ["7 kursi", "Tanpa sopir", "Antar gratis"],
  },
  en: {
    motor: ["2 helmets", "Raincoat", "Free delivery"],
    mobil: ["7 seats", "Self-drive", "Free delivery"],
  },
};

/** Jenis unit di kartu: "Skutik 110cc" / "Scooter 110cc", "MPV 7 kursi" / "7-seat MPV". */
export function jenisUnit(jenis: string, bahasa: Bahasa): string {
  if (bahasa === "id") return jenis;
  return jenis.replace("Skutik", "Scooter").replace(/^MPV (\d+) kursi$/, "$1-seat MPV");
}

export type HasilUrut = {
  unit: UnitHasil;
  kosong: boolean;
};

/** Urutan dari desain (`sorted(ri)`): yang kosong dulu, lalu harga termurah. */
export function urutkanHasil(kategori: Kategori): HasilUrut[] {
  return unitHasil
    .filter((unit) => unit.kategori === kategori)
    .map((unit) => ({ unit, kosong: unit.kosong }))
    .sort(
      (a, b) =>
        Number(b.kosong) - Number(a.kosong) ||
        a.unit.hargaPerHari - b.unit.hargaPerHari,
    );
}
