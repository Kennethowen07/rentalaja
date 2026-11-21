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

async function jalankan(path: string, body?: unknown, method: "POST" | "PUT" | "DELETE" = "POST"): Promise<HasilAksi> {
  if (!apiAktif()) return { ok: false, pesan: "Panel sungguhan belum aktif di situs ini." };
  const token = await tokenSesi();
  if (!token) return { ok: false, pesan: "Sesi habis. Masuk lagi sebagai mitra." };
  try {
    await ambilApi(path, { method, token, body });
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

/** Tarik seluruh saldo ke rekening terdaftar. Batasnya (saldo cukup,
 *  rekening ada, kunci 24 jam setelah rekening diubah) dijaga API. */
export async function tarikSaldo(): Promise<HasilAksi> {
  return jalankan("/mitra/saldo/tarik", {});
}

export type IsianRekening = { bank: string; nomor: string; namaPemilik: string; kataSandi: string };

/** Isi atau ganti rekening. Kata sandi diteruskan ke API untuk dicek ulang
 *  dan tidak disimpan di mana pun di sini. */
export async function ubahRekening(isian: IsianRekening): Promise<HasilAksi> {
  const body = {
    bank: String(isian?.bank ?? ""),
    nomor: String(isian?.nomor ?? ""),
    namaPemilik: String(isian?.namaPemilik ?? ""),
    kataSandi: String(isian?.kataSandi ?? ""),
  };
  return jalankan("/mitra/rekening", body, "PUT");
}

/** Balas (atau ubah balasan) ulasan untuk unit milik mitra ini. */
export async function balasUlasan(id: string, balasan: string): Promise<HasilAksi> {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { ok: false, pesan: "Ulasan tidak sah." };
  return jalankan(`/mitra/ulasan/${encodeURIComponent(id)}/balas`, { balasan: String(balasan ?? "") });
}
