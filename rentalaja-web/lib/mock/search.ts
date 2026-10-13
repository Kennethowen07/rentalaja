// Mock data Layar 2 "Hasil pencarian".
//
// Diambil verbatim dari kelas DCLogic di dalam
// design_handoff_rentalaja_landing/RentalAja Wireframes.dc.html (turn 1a):
// 6 unit, 3 rentang tanggal, dan array `free[]` per unit yang menentukan
// unit mana yang kosong di rentang mana. Ini implementasi konkret dari
// "momen ganti tanggal" yang disebut design brief sebagai inti prototype.
//
// Catatan: desain memberi Honda Scoopy harga Rp 70.000 di layar ini, tapi
// Rp 75.000 di kartu "Unit populer" landing page. Keduanya dipertahankan
// apa adanya sesuai aturan copy verbatim; angkanya memang tidak konsisten
// di file desain.

// Formatter tanggal WITA dipakai bersama dengan panel mitra. Letaknya di
// lib/mitra/ karena di sanalah pertama kali dibutuhkan, tapi isinya tidak
// mitra-spesifik: semua tanggal di produk ini memakai zona Bali.
import { HARI, rentangTanggal } from "@/lib/mitra/waktu";
import type { Sewa } from "@/lib/sewa";

export type RentangTanggal = {
  label: string;
  hari: number;
  catatan: string;
  /** Epoch ms tengah malam WITA, dipakai saat tanggal diteruskan ke layar lain. */
  mulai: number;
  /** Tanggal unit dikembalikan, yaitu mulai + hari. */
  selesai: number;
};

/**
 * Tiga rentang tanggal untuk chip filter.
 *
 * Dulu ini konstanta "12–14 Sep" dan kawan-kawan, disalin dari file desain.
 * Masalahnya dua: tanggalnya ikut basi begitu bulannya lewat, dan tanggal yang
 * baru saja diisi penyewa di landing page diabaikan begitu saja.
 *
 * Sekarang chip pertama memakai tanggal pilihan penyewa, dua chip lain
 * diturunkan darinya. Ketiganya selalu di masa depan. Yang dipertahankan dari
 * desain adalah idenya: mengganti chip mengubah daftar unit, lewat
 * `kosongPada` yang indeksnya sejajar dengan array ini.
 */
export function bangunRentang(sewa: Sewa, dipilihPenyewa: boolean): RentangTanggal[] {
  const { mulai: mulai0, hari: hari0 } = sewa;

  const mulai1 = mulai0 + (hari0 + 2) * HARI;
  const mulai2 = mulai1 + 4 * HARI;

  const buat = (mulai: number, hari: number, catatan: string): RentangTanggal => ({
    mulai,
    selesai: mulai + hari * HARI,
    hari,
    catatan,
    label: rentangTanggal(mulai, mulai + hari * HARI),
  });

  return [
    buat(mulai0, hari0, dipilihPenyewa ? "pilihanmu" : "akhir pekan"),
    buat(mulai1, 2, "hari kerja"),
    buat(mulai2, 8, "sewa panjang"),
  ];
}

export type UnitHasil = {
  id: string;
  nama: string;
  jenis: string;
  tahun: string;
  rating: string;
  area: string;
  penyedia: string;
  hargaPerHari: number;
  /** Ketersediaan per rentang; indeksnya sejajar dengan rentangTanggal. */
  kosongPada: boolean[];
  /** Foto asli kalau ada; null jatuh ke ImagePlaceholder. */
  foto: string | null;
};

export const unitHasil: UnitHasil[] = [
  {
    id: "honda-scoopy-2023",
    nama: "Honda Scoopy 2023",
    jenis: "Skutik 110cc",
    tahun: "2023",
    rating: "4,9",
    area: "Canggu",
    penyedia: "Bali Motor Rent",
    hargaPerHari: 70000,
    kosongPada: [true, true, false],  
    foto: "/units/honda-scoopy-2023.webp",
  },
  {
    id: "honda-beat-2022",
    nama: "Honda Beat 2022",
    jenis: "Skutik 110cc",
    tahun: "2022",
    rating: "4,7",
    area: "Kerobokan",
    penyedia: "Wayan Rental",
    hargaPerHari: 55000,
    kosongPada: [true, false, true],
    foto: "/units/honda-beat-2022.webp",
  },
  {
    id: "yamaha-nmax-2022",
    nama: "Yamaha NMAX 155 2022",
    jenis: "Skutik 155cc",
    tahun: "2022",
    rating: "4,8",
    area: "Canggu",
    penyedia: "Bali Motor Rent",
    hargaPerHari: 110000,
    kosongPada: [true, true, true],
    foto: "/units/yamaha-nmax-2022.webp",
  },
  {
    id: "vespa-sprint-2021",
    nama: "Vespa Sprint 2021",
    jenis: "Skutik 150cc",
    tahun: "2021",
    rating: "4,6",
    area: "Seminyak",
    penyedia: "Retro Ride Bali",
    hargaPerHari: 145000,
    kosongPada: [false, true, false],
    foto: "/units/vespa-sprint-2021.webp",
  },
  {
    id: "honda-pcx-160-2023",
    nama: "Honda PCX 160 2023",
    jenis: "Skutik 160cc",
    tahun: "2023",
    rating: "4,8",
    area: "Canggu",
    penyedia: "Dewa Motor",
    hargaPerHari: 120000,
    kosongPada: [true, true, true],
    foto: "/units/honda-pcx-160-2023.webp",
  },
  {
    id: "yamaha-fino-2021",
    nama: "Yamaha Fino 2021",
    jenis: "Skutik 125cc",
    tahun: "2021",
    rating: "4,5",
    area: "Pererenan",
    penyedia: "Pererenan Rent",
    hargaPerHari: 60000,
    kosongPada: [false, true, true],
    foto: "/units/yamaha-fino-2021.webp",
  },
];

/** Tag paket yang sama untuk semua unit di desain. */
export const tagPaket = ["2 helm", "Jas hujan", "Antar gratis"];

/** Filter selain tanggal — belum interaktif di desain, hanya tampil. */
export const filterPasif = ["Harga", "Jenis motor", "Antar jemput"];

export type HasilUrut = {
  unit: UnitHasil;
  kosong: boolean;
};

/** Urutan dari desain (`sorted(ri)`): yang kosong dulu, lalu harga termurah. */
export function urutkanHasil(rentangIndex: number): HasilUrut[] {
  return unitHasil
    .map((unit) => ({ unit, kosong: unit.kosongPada[rentangIndex] === true }))
    .sort(
      (a, b) =>
        Number(b.kosong) - Number(a.kosong) ||
        a.unit.hargaPerHari - b.unit.hargaPerHari,
    );
}

export function jumlahKosong(rentangIndex: number): number {
  return unitHasil.filter((u) => u.kosongPada[rentangIndex] === true).length;
}
