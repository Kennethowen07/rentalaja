// Chat penyedia dengan penyewa. Dibuka dari menu sidebar dan dari tombol
// "Hubungi" di Pesanan dan Serah terima, yang membawa ?dengan=<id pesanan>
// supaya percakapannya langsung terbuka.

import ChatMitra from "@/components/mitra/ChatMitra";
import { HeaderHalaman } from "@/components/mitra/ui";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilWaktuServer } from "@/lib/mitra/data";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function ChatMitraPage({ searchParams }: PageProps<"/[lang]/mitra/chat">) {
  const [{ dengan }, sekarang, bahasa] = await Promise.all([searchParams, ambilWaktuServer(), bahasaAktif()]);

  return (
    <>
      <HeaderHalaman kicker={tanggalPanjang(sekarang, bahasa)} judul="Chat" />
      {/* key: pindah dari satu ?dengan ke yang lain memasang ulang state. */}
      <ChatMitra key={String(dengan)} dengan={typeof dengan === "string" ? dengan : undefined} />
    </>
  );
}
