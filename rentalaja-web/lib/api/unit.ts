// Pencarian dan detail unit dari rentalaja-api, diterjemahkan ke bentuk yang
// sudah dipakai komponen (UnitHasil, DetailUnit). Komponen tidak tahu datanya
// dari API atau dari mock: tanpa API_URL keduanya jatuh ke lib/mock/.

import "server-only";
import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import type { Bahasa } from "@/lib/i18n";
import { type HasilUrut, type Kategori, type UnitHasil, urutkanHasil } from "@/lib/mock/search";
import { detailUnit, susunDetail, type DetailUnit } from "@/lib/mock/unit-detail";
import { paramSewa, type Sewa } from "@/lib/sewa";

/** Bentuk unit publik dari API (bentukUnitPublik di unit.service.ts). */
type UnitApi = {
  slug: string;
  nama: string;
  kategori: "MOTOR" | "MOBIL";
  jenis: string;
  tahun: number;
  area: string;
  foto: string | null;
  hargaPerHari: number;
  penyedia: { nama: string };
  /** null = belum ada ulasan. */
  rating: number | null;
};

type HargaApi = { perHari: number; jumlahHari: number; subtotal: number; biayaLayanan: number; total: number };

/** "4,9", bentuk yang dipakai mock; desimal() menggantinya jadi "4.9" untuk en.
 *  Unit tanpa ulasan tampil "–", bukan nol bintang. */
function teksRating(r: number | null): string {
  return r === null ? "–" : r.toFixed(1).replace(".", ",");
}

function keUnitHasil(u: UnitApi, kosong: boolean): UnitHasil {
  return {
    id: u.slug,
    kategori: u.kategori === "MOBIL" ? "mobil" : "motor",
    nama: u.nama,
    jenis: u.jenis,
    tahun: String(u.tahun),
    rating: teksRating(u.rating),
    area: u.area,
    penyedia: u.penyedia.nama,
    hargaPerHari: u.hargaPerHari,
    kosong,
    foto: u.foto,
  };
}

/** Hasil pencarian satu kategori, sudah diurutkan API (kosong dulu, lalu
 *  termurah), sama dengan urutkanHasil() di mock. */
export async function cariUnit(kategori: Kategori, sewa: Sewa): Promise<HasilUrut[]> {
  if (!apiAktif()) return urutkanHasil(kategori);
  const r = await ambilApi<{ unit: (UnitApi & { kosong: boolean })[] }>(
    `/pencarian?${paramSewa(sewa)}&kategori=${kategori}`,
  );
  return r.unit.map((u) => ({ unit: keUnitHasil(u, u.kosong), kosong: u.kosong }));
}

/** Detail satu unit untuk rentang `sewa`, atau null kalau slug tidak ada. */
export async function ambilDetailUnit(slug: string, sewa: Sewa, bahasa: Bahasa): Promise<DetailUnit | null> {
  if (!apiAktif()) return detailUnit(slug, sewa, bahasa);
  try {
    const r = await ambilApi<{ unit: UnitApi; kosong: boolean; harga: HargaApi }>(
      `/unit/${encodeURIComponent(slug)}?${paramSewa(sewa)}`,
    );
    // Harga dari API, bukan dihitung ulang di sini: angka yang tampil harus
    // sama persis dengan yang nanti ditagih POST /pesanan.
    return susunDetail(keUnitHasil(r.unit, r.kosong), sewa, bahasa, {
      perHari: r.harga.perHari,
      subtotal: r.harga.subtotal,
      layanan: r.harga.biayaLayanan,
      total: r.harga.total,
    });
  } catch (e) {
    if (e instanceof GalatApi && e.status === 404) return null;
    throw e;
  }
}
