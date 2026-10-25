// Halaman untuk calon mitra (pemilik rental), struktur mengikuti
// ayo.co.id/ayo-venue-management atas permintaan pemilik proyek:
// hero, "Apa itu", empat fitur, langkah daftar, lalu banner ajakan.
//
// Isinya hanya fitur yang memang ada di panel mitra (/mitra) dan aturan
// yang dijaga backend: batas balas 1 jam, bayar penuh di muka, dana
// dilepas 1x24 jam setelah unit kembali dipotong 5%. Tidak ada angka
// statistik di halaman ini, karena belum ada data sungguhan.
//
// Bagian "Ada yang bisa dibantu?" dari referensi sengaja tidak dibuat:
// belum ada kanal kontak sungguhan untuk ditautkan.

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { jalur, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";

const TEKS = kamus({
  id: {
    judulHalaman: "Jadi Penyedia — rentalaja",
    deskripsi:
      "Kelola rental motor dan mobilmu dari satu panel: kalender unit, pesanan, serah terima, dan pendapatan.",
    judul: "Kelola Rental Tanpa Ribet",
    sub: "Atur jadwal unit, terima pesanan, dan pantau pendapatan dari satu panel. Daftar gratis.",
    coba: "Coba Panel Mitra",
    caraDaftar: "Lihat Cara Daftar",
    altSerah: "Honda Scoopy putih siap diserahkan ke penyewa",
    altPanel:
      "Beranda panel mitra: pesanan menunggu konfirmasi, unit yang sedang keluar, dan pendapatan bulan ini",
    apa: "Apa Itu Panel Mitra rentalaja?",
    apa1: "Dashboard untuk pemilik rental di rentalaja. Semua pesanan, jadwal unit, dan pendapatan ada di satu tempat.",
    apa2: "Lihat kalender semua unit, balas pesanan, catat serah terima, sampai cek dana yang sudah cair, dari HP maupun laptop.",
    buka: "Buka panel mitra →",
    fiturSr: "Fitur panel mitra",
    fitur: [
      {
        judul: "Kalender Selalu Update",
        isi: "Blokir tanggal untuk servis atau pemakaian pribadi. Unit yang sudah dipesan otomatis hilang dari pencarian.",
      },
      {
        judul: "Pesanan Masuk Tanpa Chat",
        isi: "Penyewa sudah bayar penuh sebelum pesanan sampai ke kamu. Tinggal terima atau tolak dalam 1 jam.",
      },
      {
        judul: "Serah Terima Berfoto",
        isi: "Catat kondisi unit saat diantar dan dikembalikan. Kalau ada kerusakan, klaim diajukan dari foto yang sama.",
      },
      {
        judul: "Dana Jelas Kapan Cair",
        isi: "Pembayaran ditahan rentalaja dan diteruskan 1x24 jam setelah unit kembali, dipotong biaya layanan 5%.",
      },
    ],
    siap: "Siap Terima Pesanan Pertama?",
    siapSub: "Daftar gratis, cukup empat langkah.",
    langkah: [
      { judul: "Daftar Akun", isi: "Isi data usaha dan kontak pemilik rental." },
      { judul: "Verifikasi", isi: "Tim rentalaja mengecek dokumen usaha dan kendaraanmu." },
      { judul: "Tambah Unit", isi: "Unggah foto unit, tentukan harga per hari dan area antar." },
      { judul: "Terima Pesanan", isi: "Unitmu tampil di pencarian dan siap disewa." },
    ],
    ajakan: "Kelola rentalmu dengan lebih rapi.",
  },
  en: {
    judulHalaman: "Become a Provider — rentalaja",
    deskripsi:
      "Manage your scooter and car rental from one panel: vehicle calendar, bookings, handovers and earnings.",
    judul: "Run Your Rental Without the Hassle",
    sub: "Manage vehicle schedules, take bookings and track earnings from one panel. Free to join.",
    coba: "Try the Partner Panel",
    caraDaftar: "See How to Join",
    altSerah: "White Honda Scoopy ready to be handed over to the renter",
    altPanel:
      "Partner panel home: bookings awaiting confirmation, vehicles currently out, and this month's earnings",
    apa: "What Is the rentalaja Partner Panel?",
    apa1: "A dashboard for rental owners on rentalaja. Every booking, vehicle schedule and payout in one place.",
    apa2: "See every vehicle's calendar, reply to bookings, record handovers and check released payouts, from your phone or laptop.",
    buka: "Open the partner panel →",
    fiturSr: "Partner panel features",
    fitur: [
      {
        judul: "An Always Up-to-Date Calendar",
        isi: "Block dates for servicing or personal use. Booked vehicles disappear from search automatically.",
      },
      {
        judul: "Bookings Without the Chat",
        isi: "Renters pay in full before a booking reaches you. Just accept or decline within 1 hour.",
      },
      {
        judul: "Photo Handover",
        isi: "Record the vehicle's condition at delivery and at return. If there's damage, the claim is filed from the same photos.",
      },
      {
        judul: "Clear Payout Timing",
        isi: "Payments are held by rentalaja and released 24 hours after the vehicle is returned, minus a 5% service fee.",
      },
    ],
    siap: "Ready for Your First Booking?",
    siapSub: "Free to join, just four steps.",
    langkah: [
      { judul: "Create an Account", isi: "Fill in your business details and the rental owner's contact." },
      { judul: "Verification", isi: "The rentalaja team checks your business and vehicle documents." },
      { judul: "Add Vehicles", isi: "Upload vehicle photos, set a daily price and delivery areas." },
      { judul: "Take Bookings", isi: "Your vehicles show up in search, ready to rent." },
    ],
    ajakan: "Run your rental more smoothly.",
  },
});

export async function generateMetadata() {
  const t = TEKS[await bahasaAktif()];
  return { title: t.judulHalaman, description: t.deskripsi };
}

function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-28"
    >
      {children}
    </svg>
  );
}

const ikonFitur: ReactNode[] = [
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
  </>,
  <>
    <path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H9l-4 3v-3.2A1.5 1.5 0 0 1 3.5 16.5v-9A1.5 1.5 0 0 1 5 6z" />
    <path d="M8.5 12l2.5 2.5 4.5-4.5" />
  </>,
  <>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9z" />
    <circle cx="12" cy="13" r="3.5" />
  </>,
  <>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6.5 9.5v.01M17.5 14.5v.01" />
  </>,
];

const kelasTombolUtama =
  "inline-flex min-h-52 items-center justify-center rounded-b-sm bg-green-700 px-24 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800 md:text-b5";

export default async function JadiPenyediaPage() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];
  const keMitra = jalur(bahasa, "/mitra");

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section aria-labelledby="judul-penyedia" className="py-48 md:py-96">
          <div className="container-beranda grid items-center gap-40 md:grid-cols-2 md:gap-64">
            <div>
              <h1 id="judul-penyedia" className="text-b1-sm text-balance md:text-b1">
                {t.judul}
              </h1>
              <p className="mt-16 max-w-520 text-b4-sm text-muted-kuat md:mt-24 md:text-b4">{t.sub}</p>
              <div className="mt-28 flex flex-col gap-12 sm:flex-row md:mt-32">
                <Link href={keMitra} className={kelasTombolUtama}>
                  {t.coba}
                </Link>
                <a
                  href="#cara-daftar"
                  className="inline-flex min-h-52 items-center justify-center rounded-b-sm border-[1.5px] border-green-700 px-24 text-b5-sm font-bold text-green-700 transition-colors duration-160 ease-beranda hover:bg-green-50 md:text-b5"
                >
                  {t.caraDaftar}
                </a>
              </div>
            </div>
            <div className="bingkai-foto relative aspect-[4/3] overflow-hidden rounded-b-xl md:aspect-square md:rounded-b-2xl">
              <Image
                src="/landing/serah-terima.webp"
                alt={t.altSerah}
                fill
                preload
                sizes="(min-width: 768px) 50vw, 100vw"
                className="foto-unit object-cover"
              />
            </div>
          </div>
        </section>

        {/* Apa itu panel mitra */}
        <section aria-labelledby="judul-apa" className="bg-green-50 py-64 md:py-96">
          <div className="container-beranda grid items-center gap-40 md:grid-cols-[7fr_5fr] md:gap-64">
            <div className="relative">
              {/* Lingkaran hijau di belakang tangkapan layar, padanan lingkaran
                  merah di referensi ayo.id. */}
              <div
                aria-hidden
                className="absolute top-1/2 left-1/2 aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-350"
              />
              <div
                aria-hidden
                className="absolute top-1/2 left-1/2 aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100"
              />
              <figure className="relative overflow-hidden rounded-b-lg border border-green-200 bg-white shadow-b-2">
                <div aria-hidden className="flex gap-6 border-b border-green-200 px-14 py-10">
                  <span className="size-10 rounded-full bg-green-200" />
                  <span className="size-10 rounded-full bg-green-200" />
                  <span className="size-10 rounded-full bg-green-200" />
                </div>
                <Image
                  src="/penyedia/panel-mitra.webp"
                  alt={t.altPanel}
                  width={1600}
                  height={1000}
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="block h-auto w-full"
                />
              </figure>
            </div>
            <div>
              <h2 id="judul-apa" className="text-b2-sm text-balance md:text-b2">
                {t.apa}
              </h2>
              <p className="mt-16 text-b5-sm text-muted-kuat md:mt-24 md:text-b5">{t.apa1}</p>
              <p className="mt-16 text-b5-sm text-muted-kuat md:text-b5">{t.apa2}</p>
              <Link
                href={keMitra}
                className="mt-24 inline-flex min-h-44 items-center text-b5-sm font-bold text-green-700 decoration-2 underline-offset-4 hover:underline md:text-b5"
              >
                {t.buka}
              </Link>
            </div>
          </div>
        </section>

        {/* Fitur */}
        <section aria-labelledby="judul-fitur" className="py-64 md:py-96">
          <div className="container-beranda">
            <h2 id="judul-fitur" className="sr-only">
              {t.fiturSr}
            </h2>
            <ul className="grid gap-x-48 gap-y-40 md:grid-cols-2">
              {t.fitur.map((f, i) => (
                <li key={f.judul} className="grid grid-cols-[64px_1fr] gap-20 md:grid-cols-[84px_1fr] md:gap-28">
                  <span
                    aria-hidden
                    className="grid size-64 place-items-center rounded-full border border-green-200 text-green-700 md:size-84"
                  >
                    <Ikon>{ikonFitur[i]}</Ikon>
                  </span>
                  <div>
                    <h3 className="text-b4-sm font-bold md:text-b3 md:font-bold">{f.judul}</h3>
                    <p className="mt-6 text-b5-sm text-muted-kuat md:mt-8 md:text-b5">{f.isi}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Langkah daftar */}
        <section
          id="cara-daftar"
          aria-labelledby="judul-daftar"
          className="border-t border-green-200 py-64 md:py-96"
        >
          <div className="container-beranda text-center">
            <h2 id="judul-daftar" className="text-b2-sm text-balance md:text-b2">
              {t.siap}
            </h2>
            <p className="mt-12 text-b4-sm text-muted-kuat md:mt-16 md:text-b4">{t.siapSub}</p>
            <ol className="mt-40 grid gap-32 sm:grid-cols-2 md:mt-56 lg:grid-cols-4">
              {t.langkah.map((l, i) => (
                <li key={l.judul} className="relative px-8 pt-40">
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 text-[88px] leading-none font-extrabold text-green-350 tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <h3 className="relative text-b4-sm font-bold md:text-b4">{l.judul}</h3>
                  <p className="relative mt-8 text-b5-sm text-muted-kuat md:text-b5">{l.isi}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Banner ajakan */}
        <section aria-labelledby="judul-ajakan" className="pb-64 md:pb-96">
          <div className="container-beranda">
            <div className="bg-cta-beranda flex flex-col items-start gap-24 rounded-b-xl px-24 py-32 text-white md:flex-row md:items-center md:justify-between md:rounded-b-2xl md:px-56 md:py-48">
              <h2 id="judul-ajakan" className="text-b3-sm text-balance md:text-b3">
                {t.ajakan}
              </h2>
              <Link
                href={keMitra}
                className="inline-flex min-h-52 shrink-0 items-center justify-center rounded-b-sm bg-white px-28 text-b5-sm font-bold text-green-700 transition-colors duration-160 ease-beranda hover:bg-green-100 md:text-b5"
              >
                {t.coba}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
