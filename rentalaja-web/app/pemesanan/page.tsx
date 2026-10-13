// Layar 4 · Pemesanan (transaksi).
//
// Tanggal ambil dan kembali tidak diisi lagi di sini: penyewa sudah memilih
// rentangnya sebelum sampai ke halaman ini, jadi yang tampil hanya tanggal
// tetapnya.
//
// Unit dan rentangnya dibawa lewat query: ?unit=<slug>&mulai=&durasi=,
// diisi oleh tombol "Pesan unit ini" di layar detail. Rincian harganya
// dihitung dari unit itu, bukan lagi angka tetap Honda Scoopy 3 hari.
//
// Dibuka tanpa query, misalnya dari bookmark, halaman ini tetap hidup:
// tanggalnya jatuh ke besok selama 3 hari dan ringkasannya memakai contoh
// di lib/mock/pemesanan.ts.

import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm, { type PeriodeSewa } from "@/components/pemesanan/BookingForm";
import { pesanan, type RingkasanPesanan } from "@/lib/mock/pemesanan";
import { detailUnit, type DetailUnit } from "@/lib/mock/unit-detail";
import { formatRupiah } from "@/lib/mock/units";
import { sewaDariParams, tanggalKembali, type Sewa } from "@/lib/sewa";

export const metadata = {
  title: "Pemesanan — rentalaja",
};

const ZONA = "Asia/Makassar"; // WITA, UTC+8
const JAM_AMBIL = 9;

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

/** Rentang sewa jadi teks siap tampil. Jam ambil 09.00 WITA, jam kembali
 *  mengikutinya, sama seperti helper text di form pencarian. */
function periodeSewa(sewa: Sewa): PeriodeSewa {
  const jam = JAM_AMBIL * 60 * 60 * 1000;
  return {
    ambil: formatWaktu(sewa.mulai + jam),
    kembali: formatWaktu(tanggalKembali(sewa) + jam),
  };
}

/** Ringkasan harga dari unit yang benar-benar diklik. Sebelumnya layar ini
 *  selalu menampilkan Honda Scoopy 3 hari, unit apa pun yang dipesan. */
function ringkasanDari(detail: DetailUnit): RingkasanPesanan {
  const { unit, hari, harga } = detail;
  return {
    unit: {
      nama: unit.nama,
      penyedia: unit.penyedia,
      rating: unit.rating,
      foto: unit.foto ?? "",
    },
    rincian: [
      { label: `${hari} hari sewa`, nilai: formatRupiah(harga.subtotal) },
      { label: "Biaya layanan", nilai: formatRupiah(harga.layanan) },
    ],
    total: formatRupiah(harga.total),
  };
}

export default async function PemesananPage({
  searchParams,
}: PageProps<"/pemesanan">) {
  const params = await searchParams;
  await connection();

  const sewa = sewaDariParams(params, Date.now());
  const slug = typeof params.unit === "string" ? params.unit : "";
  const detail = slug ? detailUnit(slug, sewa) : null;

  return (
    <>
      <Navbar />
      <main>
        <BookingForm
          periode={periodeSewa(sewa)}
          ringkasan={detail ? ringkasanDari(detail) : pesanan}
        />
      </main>
      <Footer />
    </>
  );
}
