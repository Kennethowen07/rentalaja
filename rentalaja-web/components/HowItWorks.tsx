// Beranda v3, tiga langkah (design-lab/approved/round-1.html). Di desktop
// ketiga kartu disambung garis putus (.garis-langkah); di HP kartu
// menumpuk dengan nomor di kiri dan ikon di kanan.
//
// Copy langkah ditulis ulang pemilik proyek 25 Okt 2026.

import type { ReactNode } from "react";
import { kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";

const TEKS = kamus({
  id: {
    judul: "Tiga langkah, tanpa chat",
    sub: "Semua konfirmasi dilakukan hanya di website ini.",
    langkah: [
      { judul: "Isi tanggal", body: "Isi tanggal dan tempat sesuai dengan rentang sewamu." },
      { judul: "Bayar Sekali", body: "Bayar menggunakan metode pembayaran pilihanmu di awal." },
      {
        judul: "Unit diantar",
        body: "Kendaraan langsung diantar atau dapat kamu ambil sesuai dengan ketentuan.",
      },
    ],
  },
  en: {
    judul: "Three steps, no back-and-forth chat",
    sub: "Everything is confirmed right here on this website.",
    langkah: [
      { judul: "Pick your dates", body: "Enter the dates and place that match your rental." },
      { judul: "Pay Once", body: "Pay up front with the payment method you prefer." },
      {
        judul: "Vehicle delivered",
        body: "The vehicle is delivered straight to you, or you can pick it up as arranged.",
      },
    ],
  },
});

const ikonLangkah: ReactNode[] = [
  (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
      </>
  ),
  (
      <>
        <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" />
        <path d="M8.5 12l2.5 2.5 4.5-4.5" />
      </>
  ),
  (
      <>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
  ),
];

export default async function HowItWorks() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <section
      id="cara-kerja"
      aria-labelledby="judul-langkah"
      className="bg-green-50 py-64 md:py-96"
    >
      <div className="container-beranda">
        <h2 id="judul-langkah" className="text-b2-sm md:text-b2">
          {t.judul}
        </h2>
        <p className="mt-12 text-b4-sm text-muted-kuat md:text-b4">{t.sub}</p>

        <ol className="garis-langkah relative mt-24 grid gap-24 md:mt-40 md:grid-cols-3">
          {t.langkah.map((l, i) => (
            <li
              key={l.judul}
              className="group relative grid grid-cols-[--spacing(48)_1fr] gap-x-12 overflow-hidden rounded-b-lg bg-white p-20 shadow-b-1 transition duration-200 ease-beranda hover:z-3 hover:shadow-b-langkah motion-safe:hover:scale-[1.03] md:block md:rounded-b-xl md:p-32"
            >
              {/* Lapisan hijau saat hover, dipudarkan lewat opacity karena
                  gradient tidak bisa ditransisikan langsung. hover:z-3 di kartu
                  menaikkannya di atas garis putus, jadi garis itu tidak
                  menembus kartu yang sedang hijau. */}
              <div
                aria-hidden
                className="bg-langkah-aktif absolute inset-0 opacity-0 transition-opacity duration-200 ease-beranda group-hover:opacity-100"
              />
              <div className="contents md:flex md:h-56 md:items-center md:justify-between">
                <span className="relative z-2 row-span-2 text-b2-sm leading-[1.15] font-extrabold text-green-700 tabular-nums transition-colors duration-200 ease-beranda group-hover:text-white md:bg-white md:pr-12 md:text-b2 md:leading-none md:font-extrabold md:group-hover:bg-transparent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="absolute top-20 right-20 grid size-48 place-items-center rounded-full bg-green-100 text-green-700 transition-colors duration-200 ease-beranda group-hover:bg-white md:relative md:top-auto md:right-auto md:z-2 md:size-56 md:ring-8 md:ring-white md:group-hover:ring-transparent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-24 md:size-28"
                  >
                    {ikonLangkah[i]}
                  </svg>
                </span>
              </div>
              <h3 className="relative flex min-h-48 items-center pr-56 text-b4-sm font-bold transition-colors duration-200 ease-beranda group-hover:text-white md:mt-24 md:block md:min-h-0 md:pr-0 md:text-b4">
                {l.judul}
              </h3>
              <p className="relative col-start-2 mt-8 text-b5-sm text-muted-kuat transition-colors duration-200 ease-beranda group-hover:text-green-100 md:text-b5">{l.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
