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

export const areaChipSisa = "+ 12 area lain";

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

// Jam ambil 07.00-21.00, default 09.00 sesuai desain.
export const jamAmbilOptions = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 7).padStart(2, "0")}.00`,
);
