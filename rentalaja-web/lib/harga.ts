// Biaya layanan yang dibayar penyewa: 3% dari harga sewa, dibulatkan ke
// rupiah terdekat. Diputuskan pemilik proyek 25 Okt 2026.
//
// Rumusnya sama persis dengan rentalaja-api/src/umum/harga.ts; kalau salah
// satu diubah, yang lain wajib ikut. Satu-satunya tempat rumus ini di
// frontend, dipakai detail unit dan contoh rincian harga di beranda.

export const PERSEN_BIAYA_LAYANAN = 3;

export function biayaLayanan(subtotal: number): number {
  return Math.round((subtotal * PERSEN_BIAYA_LAYANAN) / 100);
}
