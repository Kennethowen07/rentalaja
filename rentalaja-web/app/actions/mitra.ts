"use server";

// Aksi panel mitra yang mengubah data di rentalaja-api. Token dari cookie
// sesi; API sendiri yang memastikan pesanannya milik mitra ini (404 kalau
// bukan), jadi kode dari client tidak bisa dipakai menyentuh pesanan orang lain.

import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";

export type HasilAksi = { ok: true } | { ok: false; pesan: string };

/** Kode pesanan RA-123456. Dicek dulu supaya teks sembarang dari client
 *  tidak pernah dirangkai ke path API. */
const KODE = /^RA-[0-9A-Z-]{1,20}$/;

async function jalankan(path: string, body?: unknown): Promise<HasilAksi> {
  if (!apiAktif()) return { ok: false, pesan: "Panel sungguhan belum aktif di situs ini." };
  const token = await tokenSesi();
  if (!token) return { ok: false, pesan: "Sesi habis. Masuk lagi sebagai mitra." };
  try {
    await ambilApi(path, { method: "POST", token, body });
    return { ok: true };
  } catch (e) {
    if (e instanceof GalatApi && e.status < 500) return { ok: false, pesan: e.pesan };
    return { ok: false, pesan: "Server sedang tidak bisa dihubungi. Coba lagi sebentar." };
  }
}

export async function terimaPesanan(kode: string): Promise<HasilAksi> {
  if (typeof kode !== "string" || !KODE.test(kode)) return { ok: false, pesan: "Kode pesanan tidak sah." };
  return jalankan(`/mitra/pesanan/${encodeURIComponent(kode)}/terima`);
}

export async function tolakPesanan(kode: string): Promise<HasilAksi> {
  if (typeof kode !== "string" || !KODE.test(kode)) return { ok: false, pesan: "Kode pesanan tidak sah." };
  return jalankan(`/mitra/pesanan/${encodeURIComponent(kode)}/tolak`);
}
