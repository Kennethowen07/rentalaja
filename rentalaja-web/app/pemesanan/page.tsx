// Layar 4 · Pemesanan (transaksi).
//
// Tanggal ambil dan kembali tidak diisi lagi di sini: penyewa sudah memilih
// rentangnya sebelum sampai ke halaman ini, jadi yang tampil hanya tanggal
// tetapnya.
//
// Keterbatasan prototype: rentang itu belum benar-benar dibawa dari form
// pencarian, karena /cari dan detail unit belum meneruskan tanggal. Sebagai
// gantinya dipakai rentang yang cocok dengan rincian harga ("3 hari sewa"):
// ambil besok pukul 09.00 WITA, kembali tiga hari kemudian di jam yang sama.
// Dihitung per permintaan supaya tidak pernah menampilkan tanggal yang sudah
// lewat.

import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm, { type PeriodeSewa } from "@/components/pemesanan/BookingForm";

export const metadata = {
  title: "Pemesanan — rentalaja",
};

const ZONA = "Asia/Makassar"; // WITA, UTC+8
const JAM_AMBIL = 9;
const LAMA_SEWA_HARI = 3;

function formatWaktu(t: number) {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(t);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(t)
    .replace(":", ".");
  return `${tanggal} · ${jam}`;
}

function periodeSewa(sekarang: number): PeriodeSewa {
  // Tanggal hari ini menurut WITA, bukan menurut zona server (Vercel UTC).
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(sekarang)
    .split("-")
    .map(Number);
  // 09.00 WITA = 01.00 UTC. WITA tidak punya jam musim panas, jadi selisih
  // 8 jam ini selalu tetap.
  const ambil = Date.UTC(y, m - 1, d + 1, JAM_AMBIL - 8);
  const kembali = Date.UTC(y, m - 1, d + 1 + LAMA_SEWA_HARI, JAM_AMBIL - 8);
  return { ambil: formatWaktu(ambil), kembali: formatWaktu(kembali) };
}

export default async function PemesananPage() {
  await connection();
  const periode = periodeSewa(Date.now());

  return (
    <>
      <Navbar />
      <main>
        <BookingForm periode={periode} />
      </main>
      <Footer />
    </>
  );
}
