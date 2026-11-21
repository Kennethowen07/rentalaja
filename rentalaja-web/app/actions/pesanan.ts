"use server";

// Membuat pesanan sungguhan (POST /pesanan) dari form pemesanan. Token
// diambil dari cookie sesi di server; penyewa tidak pernah memegangnya.

import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";

export type InputPesanan = {
  unit: string;
  /** "2026-11-23" */
  mulai: string;
  durasi: number;
  diantar: boolean;
  titik: string;
  metode: "BCA_VA" | "QRIS" | "EWALLET";
  /** Total yang dilihat penyewa. Server menolak kalau harganya berubah. */
  totalDisetujui: number;
  asal: "WNI" | "WNA";
  kewarganegaraan?: string;
  dokumen: { identitas: string; sim: string; idp?: string };
};

export type HasilPesan =
  | { ok: true; kode: string }
  | { ok: false; pesan: string; perluMasuk?: boolean };

export async function buatPesanan(input: InputPesanan): Promise<HasilPesan> {
  if (!apiAktif()) return { ok: false, pesan: "Pemesanan sungguhan belum aktif di situs ini." };
  const token = await tokenSesi();
  if (!token) return { ok: false, pesan: "Masuk dulu untuk memesan.", perluMasuk: true };

  // Hanya field yang dikenal yang diteruskan: API menolak field asing (400),
  // dan pemanggil tidak boleh bisa menyelipkan apa pun ke body.
  const wna = input.asal === "WNA";
  const body = {
    unit: input.unit,
    mulai: input.mulai,
    durasi: input.durasi,
    diantar: input.diantar,
    titik: input.titik,
    metode: input.metode,
    totalDisetujui: input.totalDisetujui,
    asal: wna ? "WNA" : "WNI",
    ...(wna ? { kewarganegaraan: input.kewarganegaraan } : {}),
    dokumen: {
      identitas: input.dokumen?.identitas,
      sim: input.dokumen?.sim,
      ...(wna ? { idp: input.dokumen?.idp } : {}),
    },
    verifikasiWajah: true,
  };

  try {
    const p = await ambilApi<{ kode: string }>("/pesanan", { method: "POST", body, token });
    return { ok: true, kode: p.kode };
  } catch (e) {
    if (e instanceof GalatApi) {
      if (e.status === 401) return { ok: false, pesan: "Sesi habis. Masuk lagi untuk memesan.", perluMasuk: true };
      if (e.status === 403) return { ok: false, pesan: "Akun mitra tidak bisa memesan. Masuk dengan akun penyewa." };
      // 409: slot sudah terisi atau harga berubah; 400: isian ditolak. Pesan
      // dari API sudah ramah dibaca.
      if (e.status < 500) return { ok: false, pesan: e.pesan };
    }
    return { ok: false, pesan: "Server sedang tidak bisa dihubungi. Coba lagi sebentar." };
  }
}
