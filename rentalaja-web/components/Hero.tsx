// Beranda v3, hero "Produk di depan" (design-lab/approved/round-1.html).
//
// Judul dan subjudul ditulis ulang 25 Okt 2026 atas permintaan pemilik
// proyek, mengikuti pola ayo.id: judul pendek yang menyebut produknya.
// Versi lama ("Lihat unit yang benar-benar kosong di tanggalmu.") terasa
// terlalu seperti slogan. Badge "Kalender real-time" dihapus atas
// permintaan pemilik.
//
// Foto mosaik dari Wikimedia, latarnya ramai (mobil pameran, toko, lapak).
// Crop dirapatkan ke badan motor dan diberi gradasi hijau (.redam-foto)
// supaya ketiganya terasa satu set.

import Image from "next/image";
import { kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { heroStats } from "@/lib/mock/stats";

const TEKS = kamus({
  id: {
    judul: "Sewa Kendaraan Tanpa Ribet",
    sub: "Pilih tanggal, lihat unit yang kosong, langsung pesan. Motor dan mobil, diantar ke tempatmu.",
  },
  en: {
    judul: "Rent a Vehicle Without the Hassle",
    sub: "Pick your dates, see what's available, book right away. Scooters and cars, delivered to you.",
  },
});

export default async function Hero() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <section
      aria-labelledby="judul-hero"
      className="bg-hero-beranda pt-16 pb-150 text-white md:pt-40 md:pb-116"
    >
      <div className="container-beranda grid gap-24 md:gap-40 min-[75rem]:grid-cols-[--spacing(620)_--spacing(540)] min-[75rem]:items-center min-[75rem]:justify-between min-[75rem]:gap-0">
        <div className="order-2 md:order-none">
          <h1
            id="judul-hero"
            className="text-b1-sm text-balance md:text-b1"
          >
            {t.judul}
          </h1>
          <p className="mt-12 max-w-560 text-b4-sm text-di-gelap md:mt-20 md:text-b4">
            {t.sub}
          </p>

          {/* Di HP angka ini pindah ke bawah kotak pencarian (SearchCard). */}
          <dl className="mt-28 hidden md:flex">
            {heroStats[bahasa].map((s) => (
              <div
                key={s.label}
                className="flex flex-col-reverse border-l border-white/20 px-28 first:border-l-0 first:pl-0"
              >
                <dt className="mt-4 text-b6 text-green-350">{s.label}</dt>
                <dd className="text-b3 whitespace-nowrap tabular-nums">
                  {s.angka}
                  {s.akhiran && (
                    <span className="ml-2 text-b6 font-semibold text-green-350">{s.akhiran}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-first grid grid-cols-2 gap-16 md:order-none md:max-w-620 min-[75rem]:max-w-none">
          <div className="redam-foto relative col-span-2 h-150 overflow-hidden rounded-b-lg md:h-300 md:rounded-b-2xl">
            <Image
              src="/units/vespa-sprint-2021.webp"
              alt="Vespa Sprint 2021"
              fill
              preload
              sizes="(min-width: 1200px) 540px, (min-width: 768px) 620px, 100vw"
              className="foto-unit object-cover object-[50%_72%]"
            />
          </div>
          <div className="redam-foto relative hidden h-148 overflow-hidden rounded-b-xl md:block">
            <Image
              src="/units/yamaha-fino-2021.webp"
              alt="Yamaha Fino 2021"
              fill
              sizes="270px"
              className="foto-unit object-cover object-[50%_70%]"
            />
          </div>
          <div className="redam-foto relative hidden h-148 overflow-hidden rounded-b-xl md:block">
            <Image
              src="/units/honda-pcx-160-2023.webp"
              alt="Honda PCX 160 2023"
              fill
              sizes="270px"
              className="foto-unit object-cover object-[40%_60%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
