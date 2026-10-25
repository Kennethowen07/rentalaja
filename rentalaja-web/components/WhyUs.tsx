// Beranda v3, Kenapa rentalaja (design-lab/approved/round-1.html).
//
// Grid kanan: tiga foto kendaraan. Kartu angka "98% dikonfirmasi di bawah
// 10 menit" dan "0 biaya tersembunyi" dihapus (25 Okt 2026) karena angkanya
// tidak punya data di baliknya; atas permintaan pemilik diganti foto.
//
// Poin 1 dan 2 ditulis ulang pemilik proyek 25 Okt 2026.

import Image from "next/image";
import { kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";

const TEKS = kamus({
  id: {
    kicker: "Kenapa rentalaja",
    judul: "Ketersediaan yang jujur, harga yang tidak berubah di tengah jalan.",
    checklist: [
      {
        judul: "Bandingkan harga rental tanpa ribet",
        body: "Masukkan tanggal dan tempat, semua kendaraan yang dapat disewa langsung muncul.",
      },
      {
        judul: "Sistem peminjamannya aman",
        body: "Kondisi unit didokumentasikan saat diantar dan dikembalikan melalui foto serah terima.",
      },
      {
        judul: "Tanpa deposit tunai ke pemilik",
        body: "Pembayaranmu ditahan rentalaja sampai unit kembali. Semua biaya tertulis sebelum bayar.",
      },
    ],
    altSerah: "Honda Scoopy putih siap diserahkan ke penyewa",
  },
  en: {
    kicker: "Why rentalaja",
    judul: "Honest availability, prices that don't change halfway.",
    checklist: [
      {
        judul: "Compare rental prices without the hassle",
        body: "Enter your dates and location, and every vehicle you can rent shows up right away.",
      },
      {
        judul: "A safe rental process",
        body: "The vehicle's condition is documented with handover photos at delivery and at return.",
      },
      {
        judul: "No cash deposit to the owner",
        body: "Your payment is held by rentalaja until the vehicle is returned. Every cost is listed before you pay.",
      },
    ],
    altSerah: "White Honda Scoopy ready to be handed over to the renter",
  },
});

export default async function WhyUs() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <section aria-labelledby="judul-kenapa" className="py-64 md:py-96">
      <div className="container-beranda grid items-center gap-32 md:gap-48 min-[75rem]:grid-cols-[minmax(0,1fr)_--spacing(576)]">
        <div>
          <p className="text-b6-sm font-bold tracking-[0.08em] text-green-700 uppercase md:text-b6">
            {t.kicker}
          </p>
          <h2 id="judul-kenapa" className="mt-12 max-w-560 text-b2-sm text-balance md:text-b2">
            {t.judul}
          </h2>
          <ul className="mt-24 grid gap-24 md:mt-40">
            {t.checklist.map((c) => (
              <li key={c.judul} className="grid grid-cols-[--spacing(28)_1fr] gap-16">
                <span
                  aria-hidden
                  className="mt-1 grid size-28 place-items-center rounded-full bg-green-700 text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-16"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-b4-sm leading-[1.4] font-bold md:text-b4">{c.judul}</h3>
                  <p className="mt-4 max-w-[64ch] text-b5-sm text-muted-kuat md:text-b5">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-16 md:grid-cols-[--spacing(280)_--spacing(280)] md:grid-rows-[--spacing(232)_--spacing(232)]">
          <div className="bingkai-foto relative h-300 overflow-hidden rounded-b-lg md:row-span-2 md:h-auto md:rounded-b-xl">
            <Image
              src="/landing/serah-terima.webp"
              alt={t.altSerah}
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className="foto-unit object-cover object-[45%_55%]"
            />
          </div>

          <div className="bingkai-foto relative h-200 overflow-hidden rounded-b-lg md:h-auto md:rounded-b-xl">
            <Image
              src="/units/yamaha-nmax-2022.webp"
              alt="Yamaha NMAX 2022"
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className="foto-unit object-cover object-[50%_60%]"
            />
          </div>
          <div className="bingkai-foto relative h-200 overflow-hidden rounded-b-lg md:h-auto md:rounded-b-xl">
            <Image
              src="/units/toyota-avanza-2021.webp"
              alt="Toyota Avanza 2021"
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className="foto-unit object-cover object-[60%_55%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
