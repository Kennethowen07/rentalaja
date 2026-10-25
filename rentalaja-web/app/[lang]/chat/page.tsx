// Riwayat chat penyewa. Dibuka dari ikon chat di navbar (hanya setelah
// masuk) dan dari tombol "Hubungi penyedia" di /pesanan, yang membawa
// ?dengan=<id percakapan> supaya percakapannya langsung terbuka.

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RiwayatChat from "@/components/chat/RiwayatChat";

// Judulnya sama di kedua bahasa.
export const metadata = {
  title: "Chat — rentalaja",
};

export default async function ChatPage({ searchParams }: PageProps<"/[lang]/chat">) {
  const { dengan } = await searchParams;

  return (
    <>
      <Navbar />
      {/* w-full: body itu flex kolom, dan margin auto dari container-page
          membuat main menyusut selebar isinya. Tanpa ini lebar jendela chat
          berubah mengikuti panjang pesan di percakapan yang dibuka. */}
      <main className="container-page w-full pt-22 pb-28">
        {/* key: pindah dari satu ?dengan ke yang lain memasang ulang state. */}
        <RiwayatChat key={String(dengan)} dengan={typeof dengan === "string" ? dengan : undefined} />
      </main>
      <Footer />
    </>
  );
}
