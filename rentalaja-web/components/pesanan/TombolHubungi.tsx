"use client";

// "Hubungi penyedia" di Layar 5. Chat butuh akun, jadi penyewa yang belum
// masuk diminta masuk dulu, lalu langsung dibawa ke percakapannya.

import { useRouter } from "next/navigation";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import { ID_CHAT_PESANAN_AKTIF } from "@/lib/mock/chat";

export default function TombolHubungi() {
  const router = useRouter();
  const { akun, mintaMasuk } = useAkun();
  const { bahasa, jalur } = useBahasa();
  const tujuan = jalur(`/chat?dengan=${ID_CHAT_PESANAN_AKTIF}`);

  return (
    <button
      type="button"
      onClick={() => (akun ? router.push(tujuan) : mintaMasuk("masuk", () => router.push(tujuan)))}
      className="mt-13 w-full rounded-input bg-green-700 py-11 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800"
    >
      {bahasa === "en" ? "Contact provider" : "Hubungi penyedia"}
    </button>
  );
}
