"use client";

// "Hubungi penyedia" di Layar 5. Chat butuh akun, jadi penyewa yang belum
// masuk diminta masuk dulu, lalu langsung dibawa ke percakapannya.

import { useRouter } from "next/navigation";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import { ID_CHAT_PESANAN_AKTIF } from "@/lib/mock/chat";

/** `kode`: pesanan sungguhan (mode API). Tanpa itu, percakapan contoh. */
export default function TombolHubungi({ kode }: { kode?: string }) {
  const router = useRouter();
  const { akun, sesiDimuat, mintaMasuk } = useAkun();
  const { bahasa, jalur } = useBahasa();
  const tujuan = jalur(`/chat?dengan=${encodeURIComponent(kode ?? ID_CHAT_PESANAN_AKTIF)}`);

  return (
    <button
      type="button"
      // Sesi belum terbaca: jangan menebak "belum masuk". Halaman /chat sendiri
      // yang meminta masuk kalau memang belum.
      onClick={() =>
        akun || !sesiDimuat ? router.push(tujuan) : mintaMasuk("masuk", () => router.push(tujuan))
      }
      className="mt-13 w-full rounded-input bg-green-700 py-11 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800"
    >
      {bahasa === "en" ? "Contact provider" : "Hubungi penyedia"}
    </button>
  );
}
