// Layar 5 · Pesanan aktif.
//
// Dicapai dari /pemesanan setelah pembayaran. Belum ada di navbar karena
// navbar landing page dikunci spec ke Sewa / Cara kerja / Jadi penyedia /
// Bantuan — menambah item ke sana akan mengubah Layar 1 yang sudah final.

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderActive from "@/components/pesanan/OrderActive";

export const metadata = {
  title: "Pesanan aktif — rentalaja",
};

export default function PesananPage() {
  return (
    <>
      <Navbar />
      <main>
        <OrderActive />
      </main>
      <Footer />
    </>
  );
}
