/**
 * Satu-satunya rumus harga. Pencarian, detail unit, pembuatan pesanan, dan
 * seed semuanya memanggil fungsi di sini, supaya angka yang ditunjukkan ke
 * penyewa sebelum bayar sama persis dengan yang ditagih (backend.md bagian 4).
 */

/** Biaya layanan yang dibayar penyewa, dalam persen dari harga sewa.
 *  Diputuskan pemilik proyek 25 Okt 2026: 3%, tanpa batas minimum.
 *
 *  Ini BUKAN potongan 5% dari penyedia (KOMISI_PLATFORM di status-pesanan.ts).
 *  Keduanya diambil platform dari satu pesanan yang sama. */
export const PERSEN_BIAYA_LAYANAN = 3;

/** Dibulatkan ke rupiah terdekat; setengah rupiah dibulatkan ke atas. */
export function biayaLayanan(subtotal: number): number {
  return Math.round((subtotal * PERSEN_BIAYA_LAYANAN) / 100);
}

export type RincianHarga = {
  perHari: number;
  jumlahHari: number;
  subtotal: number;
  biayaLayanan: number;
  total: number;
};

export function rincianHarga(perHari: number, jumlahHari: number): RincianHarga {
  const subtotal = perHari * jumlahHari;
  const layanan = biayaLayanan(subtotal);
  return { perHari, jumlahHari, subtotal, biayaLayanan: layanan, total: subtotal + layanan };
}
