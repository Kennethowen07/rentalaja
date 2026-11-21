// Daftar chat penyewa dari rentalaja-api (GET /chat), dalam bentuk
// Percakapan yang dipakai halaman /chat. Isi lengkap tiap percakapan dimuat
// saat dibuka (app/actions/chat.ts), karena membukanya menandai pesan
// penyedia sebagai dibaca.

import "server-only";
import { ambilApi, GalatApi } from "@/lib/api/klien";
import type { Bahasa } from "@/lib/i18n";
import { waktuChat, type Percakapan } from "@/lib/mock/chat";

type ChatApi = {
  kode: string;
  lawan: { nama: string };
  unit: string;
  pesanTerakhir: { isi: string; dariSaya: boolean; dikirimPada: string } | null;
  belumDibaca: number;
};

/** null kalau token ditolak (kedaluwarsa atau bukan akun penyewa/mitra). */
export async function daftarChatPenyewa(token: string, bahasa: Bahasa): Promise<Percakapan[] | null> {
  try {
    const daftar = await ambilApi<ChatApi[]>("/chat", { token });
    return daftar.map((c) => ({
      id: c.kode,
      penyedia: c.lawan.nama,
      pesanan: `${c.unit} · ${c.kode}`,
      belumDibaca: c.belumDibaca > 0,
      pesan: c.pesanTerakhir
        ? [
            {
              dari: c.pesanTerakhir.dariSaya ? "saya" : "penyedia",
              teks: c.pesanTerakhir.isi,
              waktu: waktuChat(new Date(c.pesanTerakhir.dikirimPada).getTime(), bahasa),
            },
          ]
        : [],
    }));
  } catch (e) {
    if (e instanceof GalatApi && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}
