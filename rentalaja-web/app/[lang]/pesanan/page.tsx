// Layar 5 · Pesanan aktif.
//
// Dicapai dari /pemesanan setelah pembayaran, dengan ?kode=RA-xxxxxx. Belum
// ada di navbar karena navbar landing page dikunci spec ke Sewa / Cara kerja
// / Jadi penyedia / Bantuan.
//
// Dengan API_URL: pesanan sungguhan milik akun yang masuk (lib/api/pesanan.ts).
// Tanpa ?kode= yang ditampilkan pesanan yang masih berjalan atau terbaru.
// Tanpa API_URL: pesanan contoh di lib/mock/pesanan-aktif.ts.

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderActive from "@/components/pesanan/OrderActive";
import PesananKosong from "@/components/pesanan/PesananKosong";
import { apiAktif } from "@/lib/api/klien";
import { ambilPesananPenyewa, type HasilPesanan } from "@/lib/api/pesanan";
import { tokenSesi } from "@/lib/api/sesi";
import { bahasaAktif } from "@/lib/i18n-server";
import { pesananAktif } from "@/lib/mock/pesanan-aktif";

export async function generateMetadata() {
  const bahasa = await bahasaAktif();
  return { title: bahasa === "en" ? "Active booking — rentalaja" : "Pesanan aktif — rentalaja" };
}

export default async function PesananPage({ searchParams }: PageProps<"/[lang]/pesanan">) {
  const bahasa = await bahasaAktif();
  const { kode } = await searchParams;

  let hasil: HasilPesanan;
  if (!apiAktif()) {
    hasil = { jenis: "ada", data: pesananAktif[bahasa] };
  } else {
    const token = await tokenSesi();
    hasil = token
      ? await ambilPesananPenyewa(token, typeof kode === "string" ? kode : null, bahasa)
      : { jenis: "perlu-masuk" };
  }

  return (
    <>
      <Navbar />
      <main>{hasil.jenis === "ada" ? <OrderActive data={hasil.data} /> : <PesananKosong jenis={hasil.jenis} />}</main>
      <Footer />
    </>
  );
}
