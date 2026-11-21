"use server";

// Chat dari sisi penyewa (halaman /chat). Netral terhadap peran: pesan hanya
// ditandai milik sendiri atau lawan bicara; komponen yang memberi label.
// API memastikan hanya penyewa pemesan dan mitra pemilik unit yang bisa
// membaca dan menulis (pesanan orang lain dijawab 404).

import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";

const KODE = /^RA-[0-9A-Z-]{1,20}$/;

export type PesanNetral = { dariSaya: boolean; teks: string; waktu: number };

export type HasilIsiChat =
  | { ok: true; pesan: PesanNetral[]; bisaKirim: boolean }
  | { ok: false; pesan: string };

const GAGAL = "Server sedang tidak bisa dihubungi. Coba lagi sebentar.";

/** Isi satu percakapan. Membukanya menandai pesan lawan bicara sebagai dibaca. */
export async function isiChat(kode: string): Promise<HasilIsiChat> {
  if (typeof kode !== "string" || !KODE.test(kode)) return { ok: false, pesan: "Kode pesanan tidak sah." };
  const token = await tokenSesi();
  if (!apiAktif() || !token) return { ok: false, pesan: "Masuk dulu untuk membuka chat." };
  try {
    const r = await ambilApi<{ pesan: { isi: string; dariSaya: boolean; dikirimPada: string }[]; bisaKirim: boolean }>(
      `/chat/${encodeURIComponent(kode)}`,
      { token },
    );
    return {
      ok: true,
      bisaKirim: r.bisaKirim,
      pesan: r.pesan.map((m) => ({ dariSaya: m.dariSaya, teks: m.isi, waktu: new Date(m.dikirimPada).getTime() })),
    };
  } catch (e) {
    if (e instanceof GalatApi && e.status < 500) return { ok: false, pesan: e.pesan };
    return { ok: false, pesan: GAGAL };
  }
}

export async function kirimPesan(kode: string, isi: string): Promise<{ ok: true } | { ok: false; pesan: string }> {
  if (typeof kode !== "string" || !KODE.test(kode)) return { ok: false, pesan: "Kode pesanan tidak sah." };
  const token = await tokenSesi();
  if (!apiAktif() || !token) return { ok: false, pesan: "Masuk dulu untuk mengirim pesan." };
  try {
    await ambilApi(`/chat/${encodeURIComponent(kode)}`, { method: "POST", token, body: { isi: String(isi ?? "") } });
    return { ok: true };
  } catch (e) {
    if (e instanceof GalatApi && e.status < 500) return { ok: false, pesan: e.pesan };
    return { ok: false, pesan: GAGAL };
  }
}
