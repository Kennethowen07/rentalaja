import type { Koordinat } from "@/lib/geocode";

// Section 8 "Area yang dilayani" — label chip verbatim dari README.
export const areaChips = [
  "Canggu",
  "Seminyak",
  "Kuta",
  "Ubud",
  "Sanur",
  "Denpasar",
  "Uluwatu",
] as const;

export const areaChipSisa = { id: "+ 12 area lain", en: "+ 12 more areas" } as const;

// Opsi combobox "Area antar" pada search card. Desain memakai
// "Canggu, Badung" sebagai nilai default, jadi ia yang pertama.
export const areaAntarOptions = [
  "Canggu, Badung",
  "Seminyak, Badung",
  "Kuta, Badung",
  "Ubud, Gianyar",
  "Sanur, Denpasar",
  "Denpasar",
  "Uluwatu, Badung",
] as const;

/** Titik pusat tiap area antar, perkiraan dari OpenStreetMap. Dipakai
 *  "Pilih di peta" di kotak pencarian untuk mencari area terdekat. */
export const koordinatArea: Record<(typeof areaAntarOptions)[number], Koordinat> = {
  "Canggu, Badung": [-8.6478, 115.1385],
  "Seminyak, Badung": [-8.6913, 115.1683],
  "Kuta, Badung": [-8.718, 115.169],
  "Ubud, Gianyar": [-8.5069, 115.2625],
  "Sanur, Denpasar": [-8.6886, 115.261],
  Denpasar: [-8.6705, 115.2126],
  "Uluwatu, Badung": [-8.8291, 115.0849],
};

// Jam ambil 07.00-21.00, default 09.00 sesuai desain.
export const jamAmbilOptions = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 7).padStart(2, "0")}.00`,
);
