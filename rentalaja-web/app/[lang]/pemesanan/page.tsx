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
import { desimal, kamus, lokal, type Bahasa } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { pesanan, type RingkasanPesanan } from "@/lib/mock/pemesanan";
import { detailUnit, type DetailUnit } from "@/lib/mock/unit-detail";
import { formatRupiah } from "@/lib/mock/units";
import { sewaDariParams, tanggalKembali, type Sewa } from "@/lib/sewa";

const TEKS = kamus({
  id: {
    judul: "Pemesanan — rentalaja",
    sewa: (hari: number) => `${hari} hari sewa`,
    layanan: "Biaya layanan",
  },
  en: {
    judul: "Booking — rentalaja",
    sewa: (hari: number) => `${hari}-day rental`,
    layanan: "Service fee",
  },
});

export async function generateMetadata() {
  return { title: TEKS[await bahasaAktif()].judul };
}

const ZONA = "Asia/Makassar"; // WITA, UTC+8
const JAM_AMBIL = 9;

function formatWaktu(t: number, bahasa: Bahasa) {
  const tanggal = new Intl.DateTimeFormat(lokal(bahasa), {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(t);
  const jam = new Intl.DateTimeFormat(lokal(bahasa), {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(t)
    .replace(":", bahasa === "id" ? "." : ":");
  return `${tanggal} · ${jam}`;
}

/** Rentang sewa jadi teks siap tampil. Jam ambil 09.00 WITA, jam kembali
 *  mengikutinya, sama seperti helper text di form pencarian. */
function periodeSewa(sewa: Sewa, bahasa: Bahasa): PeriodeSewa {
  const jam = JAM_AMBIL * 60 * 60 * 1000;
  return {
    ambil: formatWaktu(sewa.mulai + jam, bahasa),
    kembali: formatWaktu(tanggalKembali(sewa) + jam, bahasa),
  };
}

/** Ringkasan harga dari unit yang benar-benar diklik. Sebelumnya layar ini
 *  selalu menampilkan Honda Scoopy 3 hari, unit apa pun yang dipesan. */
function ringkasanDari(detail: DetailUnit, bahasa: Bahasa): RingkasanPesanan {
  const { unit, hari, harga } = detail;
  const t = TEKS[bahasa];
  return {
    unit: {
      nama: unit.nama,
      penyedia: unit.penyedia,
      rating: desimal(unit.rating, bahasa),
      foto: unit.foto ?? "",
      kategori: unit.kategori,
    },
    rincian: [
      { label: t.sewa(hari), nilai: formatRupiah(harga.subtotal) },
      { label: t.layanan, nilai: formatRupiah(harga.layanan) },
    ],
    total: formatRupiah(harga.total),
  };
}

export default async function PemesananPage({
  searchParams,
}: PageProps<"/[lang]/pemesanan">) {
  const params = await searchParams;
  await connection();

  const bahasa = await bahasaAktif();
  const sewa = sewaDariParams(params, Date.now());
  const slug = typeof params.unit === "string" ? params.unit : "";
  const detail = slug ? detailUnit(slug, sewa, bahasa) : null;

  return (
    <>
      <Navbar />
      <main>
        <BookingForm
          periode={periodeSewa(sewa, bahasa)}
          ringkasan={detail ? ringkasanDari(detail, bahasa) : pesanan[bahasa]}
        />
      </main>
      <Footer />
    </>
  );
}
