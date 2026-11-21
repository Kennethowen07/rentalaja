// Sesi login: token JWT dari rentalaja-api disimpan di cookie httpOnly,
// jadi JavaScript di browser tidak bisa membacanya (aman dari XSS yang
// mencuri token). Hanya kode server yang membaca dan meneruskannya ke API.

import "server-only";
import { cookies } from "next/headers";

export const COOKIE_SESI = "ra_sesi";

/** Sama dengan masa berlaku JWT di rentalaja-api (auth.module.ts, 7d). */
export const UMUR_SESI_DETIK = 7 * 24 * 60 * 60;

export async function tokenSesi(): Promise<string | null> {
  return (await cookies()).get(COOKIE_SESI)?.value ?? null;
}
