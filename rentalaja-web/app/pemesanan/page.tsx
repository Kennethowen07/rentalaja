// Layar 4 · Pemesanan (transaksi).
//
// Layar 3 (Detail unit) belum dibangun, jadi rute ini dicapai langsung dari
// stub /unit/[slug]. Isinya masih data tetap dari file desain — belum
// membaca unit atau tanggal dari query.

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm from "@/components/pemesanan/BookingForm";

export const metadata = {
  title: "Pemesanan — rentalaja",
};

export default function PemesananPage() {
  return (
    <>
      <Navbar />
      <main>
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}
