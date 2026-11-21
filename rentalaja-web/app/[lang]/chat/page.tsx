// Riwayat chat penyewa. Dibuka dari ikon chat di navbar (hanya setelah
// masuk) dan dari tombol "Hubungi penyedia" di /pesanan, yang membawa
// ?dengan=<id percakapan> supaya percakapannya langsung terbuka.

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RiwayatChat from "@/components/chat/RiwayatChat";
import { daftarChatPenyewa } from "@/lib/api/chat";
import { apiAktif } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";
import { bahasaAktif } from "@/lib/i18n-server";

// Judulnya sama di kedua bahasa.
export const metadata = {
  title: "Chat — rentalaja",
};

export default async function ChatPage({ searchParams }: PageProps<"/[lang]/chat">) {
  const { dengan } = await searchParams;
  // Mode API: percakapan sungguhan milik akun yang masuk. Belum masuk: daftar
  // kosong, dan komponen menampilkan ajakan masuk seperti biasa.
  let awalApi = null;
  if (apiAktif()) {
    const token = await tokenSesi();
    awalApi = (token ? await daftarChatPenyewa(token, await bahasaAktif()) : null) ?? [];
  }

  return (
    <>
      <Navbar />
      {/* w-full: body itu flex kolom, dan margin auto dari container-page
          membuat main menyusut selebar isinya. Tanpa ini lebar jendela chat
          berubah mengikuti panjang pesan di percakapan yang dibuka. */}
      <main className="container-page w-full pt-22 pb-28">
        {/* key: pindah dari satu ?dengan ke yang lain memasang ulang state. */}
        <RiwayatChat
          key={String(dengan)}
          dengan={typeof dengan === "string" ? dengan : undefined}
          awalApi={awalApi}
        />
      </main>
      <Footer />
    </>
  );
}
