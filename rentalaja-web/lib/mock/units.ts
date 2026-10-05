// Mock data. README/State Management: idealnya di-fetch dari
// GET /api/units/popular?limit=3 — boleh hardcode dulu memakai copy desain.
// Seluruh mock terkumpul di lib/mock/ supaya mudah diganti API nanti.

export type Unit = {
  id: string;
  nama: string;
  rating: string;
  area: string;
  spesifikasi: string;
  hargaPerHari: number;
  fotoLabel: string;
  /** Foto asli di public/units/. Kalau null, dipakai ImagePlaceholder. */
  foto: string | null;
};

export const unitPopuler: Unit[] = [
  {
    id: "honda-scoopy-2023",
    nama: "Honda Scoopy 2023",
    rating: "4,9",
    area: "Canggu",
    spesifikasi: "skutik 110cc",
    hargaPerHari: 75000,
    fotoLabel: "foto unit",
    foto: "/units/honda-scoopy-2023.webp",
  },
  {
    id: "yamaha-nmax-2022",
    nama: "Yamaha NMAX 2022",
    rating: "4,8",
    area: "Seminyak",
    spesifikasi: "skutik 155cc",
    hargaPerHari: 110000,
    fotoLabel: "foto unit",
    foto: "/units/yamaha-nmax-2022.webp",
  },
  {
    id: "toyota-avanza-2021",
    nama: "Toyota Avanza 2021",
    rating: "4,7",
    area: "Ubud",
    spesifikasi: "MPV 7 kursi",
    hargaPerHari: 320000,
    fotoLabel: "foto unit",
    foto: "/units/toyota-avanza-2021.webp",
  },
];

/** "Rp 75.000" — pemisah ribuan titik sesuai konvensi id-ID. */
export function formatRupiah(nilai: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

/** Baris meta kartu: "★ 4,9 · Canggu · skutik 110cc" */
export function metaUnit(unit: Unit): string {
  return `★ ${unit.rating} · ${unit.area} · ${unit.spesifikasi}`;
}
