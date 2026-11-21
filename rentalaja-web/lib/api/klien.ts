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

/** Soket keep-alive yang ditutup server tepat saat dipakai ulang. Hanya GET
 *  yang dicoba ulang: GET tidak mengubah apa pun, sedangkan POST bisa saja
 *  sudah diproses (pesanan terbuat dua kali kalau diulang). */
function soketPutus(e: unknown): boolean {
  const kode = (e as { cause?: { code?: string } } | null)?.cause?.code;
  return kode === "UND_ERR_SOCKET" || kode === "ECONNRESET";
}

export async function ambilApi<T>(path: string, opsi: Opsi = {}): Promise<T> {
  try {
    return await ambilApiSekali<T>(path, opsi);
  } catch (e) {
    if ((opsi.method ?? "GET") === "GET" && soketPutus(e)) return ambilApiSekali<T>(path, opsi);
    throw e;
  }
}

async function ambilApiSekali<T>(path: string, opsi: Opsi): Promise<T> {
  if (!URL_API) throw new Error("API_URL belum diisi; pemanggil harus cek apiAktif() dulu.");
  // AbortController dengan timer yang dihapus begitu jawaban selesai dibaca,
  // bukan AbortSignal.timeout(): sinyal itu tetap menyala 10 detik kemudian
  // walau fetch sudah lama selesai, dan di Next dev hal itu membuat Server
  // Action tertahan lalu gagal ("Cannot set property message ... getter").
  const pengendali = new AbortController();
  const timer = setTimeout(() => pengendali.abort(), BATAS_MS);
  let res: Response;
  let isi: unknown;
  try {
    res = await fetch(URL_API + path, {
      method: opsi.method ?? "GET",
      headers: {
        ...(opsi.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(opsi.token ? { authorization: `Bearer ${opsi.token}` } : {}),
      },
      body: opsi.body !== undefined ? JSON.stringify(opsi.body) : undefined,
      // Data sewa (ketersediaan, status pesanan) berubah tiap saat.
      cache: "no-store",
      signal: pengendali.signal,
    });
    isi = await res.json().catch(() => null);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new GalatApi(res.status, pesanDari(isi) ?? `Permintaan gagal (${res.status}).`);
  return isi as T;
}
