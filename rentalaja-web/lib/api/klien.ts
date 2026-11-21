// Klien rentalaja-api, hanya untuk kode server (Server Component, Server
// Action, Route Handler). Alamatnya dari env API_URL, tanpa awalan
// NEXT_PUBLIC_, jadi tidak pernah ikut terkirim ke browser.
//
// API_URL kosong = frontend memakai data contoh di lib/mock/, sama seperti
// sebelum backend ada. Itu yang terjadi di deploy Vercel selama rentalaja-api
// belum di-deploy, jadi situs online tidak rusak.

import "server-only";

const URL_API = process.env.API_URL?.trim().replace(/\/+$/, "") || null;

/** Batas tunggu satu permintaan. API lokal menjawab dalam milidetik; lebih
 *  dari ini hampir pasti server mati atau macet. */
const BATAS_MS = 10_000;

export function apiAktif(): boolean {
  return URL_API !== null;
}

/** Jawaban gagal dari API. `pesan` sudah siap tampil (bahasa Indonesia,
 *  dari validasi NestJS atau pesan service). */
export class GalatApi extends Error {
  constructor(
    readonly status: number,
    readonly pesan: string,
  ) {
    super(`API ${status}: ${pesan}`);
  }
}

/** Badan galat NestJS: { message: string | string[], error, statusCode }. */
function pesanDari(isi: unknown): string | null {
  if (!isi || typeof isi !== "object") return null;
  const m = (isi as { message?: unknown }).message;
  if (typeof m === "string") return m;
  if (Array.isArray(m) && m.every((x) => typeof x === "string")) return m.join(" ");
  return null;
}

type Opsi = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function ambilApi<T>(path: string, opsi: Opsi = {}): Promise<T> {
  if (!URL_API) throw new Error("API_URL belum diisi; pemanggil harus cek apiAktif() dulu.");
  const res = await fetch(URL_API + path, {
    method: opsi.method ?? "GET",
    headers: {
      ...(opsi.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(opsi.token ? { authorization: `Bearer ${opsi.token}` } : {}),
    },
    body: opsi.body !== undefined ? JSON.stringify(opsi.body) : undefined,
    // Data sewa (ketersediaan, status pesanan) berubah tiap saat.
    cache: "no-store",
    signal: AbortSignal.timeout(BATAS_MS),
  });
  const isi: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new GalatApi(res.status, pesanDari(isi) ?? `Permintaan gagal (${res.status}).`);
  return isi as T;
}
