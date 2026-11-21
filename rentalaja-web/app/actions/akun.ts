"use server";

// Masuk, keluar, dan membaca sesi. Dipanggil dari AkunProvider dan AuthModal
// (client) sebagai Server Action. Hanya dipakai kalau API_URL diisi; tanpa
// API, login tetap simulasi seperti sebelumnya.
//
// Belum ada pendaftaran: yang bisa masuk hanya akun yang sudah ada di
// database (akun demo dari prisma/seed.ts).

import { cookies } from "next/headers";
import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { COOKIE_SESI, tokenSesi, UMUR_SESI_DETIK } from "@/lib/api/sesi";

export type Akun = { nama: string; peran: "PENYEWA" | "MITRA" };

type HasilMasuk = { ok: true; akun: Akun } | { ok: false; pesan: string };

/** Email akun demo dari prisma/seed.ts. Kata sandinya hanya di env server. */
const EMAIL_DEMO = {
  PENYEWA: "penyewa.demo@rentalaja.test",
  MITRA: "mitra.demo@rentalaja.test",
} as const;

async function simpanSesi(token: string) {
  (await cookies()).set(COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
}

async function masukKeApi(email: string, kataSandi: string): Promise<HasilMasuk> {
  if (!apiAktif()) return { ok: false, pesan: "Login sungguhan belum aktif di situs ini." };
  try {
    const r = await ambilApi<{ token: string; pengguna: Akun }>("/auth/masuk", {
      method: "POST",
      body: { email, kataSandi },
    });
    await simpanSesi(r.token);
    return { ok: true, akun: { nama: r.pengguna.nama, peran: r.pengguna.peran } };
  } catch (e) {
    // 401 dan 400 (email tidak sah) dijawab sama, tanpa membedakan mana
    // yang salah, mengikuti API.
    if (e instanceof GalatApi && e.status < 500) return { ok: false, pesan: "Email atau kata sandi salah." };
    return { ok: false, pesan: "Server sedang tidak bisa dihubungi. Coba lagi sebentar." };
  }
}

export async function masuk(email: string, kataSandi: string): Promise<HasilMasuk> {
  if (typeof email !== "string" || typeof kataSandi !== "string") {
    return { ok: false, pesan: "Email atau kata sandi salah." };
  }
  return masukKeApi(email.trim().toLowerCase(), kataSandi);
}

/** Masuk sekali klik sebagai akun demo, untuk pengunjung portofolio yang
 *  tidak tahu kata sandinya. Kata sandi dibaca dari env PASSWORD_DEMO di
 *  server dan tidak pernah dikirim ke browser. */
export async function masukDemo(peran: "PENYEWA" | "MITRA"): Promise<HasilMasuk> {
  const sandi = process.env.PASSWORD_DEMO;
  if (!sandi || (peran !== "PENYEWA" && peran !== "MITRA")) {
    return { ok: false, pesan: "Akun demo belum disiapkan di situs ini." };
  }
  return masukKeApi(EMAIL_DEMO[peran], sandi);
}

export async function keluar(): Promise<void> {
  (await cookies()).delete(COOKIE_SESI);
}

/** Akun yang sedang masuk, atau null. Token kedaluwarsa atau ditolak API
 *  dianggap belum masuk, dan cookie-nya dibuang. */
export async function sesiSaya(): Promise<Akun | null> {
  if (!apiAktif()) return null;
  const token = await tokenSesi();
  if (!token) return null;
  try {
    const p = await ambilApi<Akun>("/auth/saya", { token });
    return { nama: p.nama, peran: p.peran };
  } catch (e) {
    if (e instanceof GalatApi && e.status === 401) (await cookies()).delete(COOKIE_SESI);
    return null;
  }
}
