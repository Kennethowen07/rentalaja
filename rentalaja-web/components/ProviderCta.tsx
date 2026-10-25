// Beranda v3, ajakan untuk penyedia (design-lab/approved/round-1.html).
// Foto Vario memudar ke arah teks (.pudar-kiri); di HP foto naik ke atas.

import Image from "next/image";
import Link from "next/link";

export default function ProviderCta() {
  return (
    <section id="jadi-penyedia" aria-labelledby="judul-mitra" className="py-64 md:py-96">
      <div className="container-beranda">
        <div className="bg-cta-beranda relative grid overflow-hidden rounded-b-lg text-white md:min-h-340 md:grid-cols-[7fr_5fr] md:rounded-b-2xl">
          <div className="relative flex flex-col justify-center px-20 pt-8 pb-24 md:p-56">
            <h2 id="judul-mitra" className="text-b2-sm text-balance md:text-b2">
              Punya unit yang sering menganggur?
            </h2>
            <p className="mt-16 max-w-560 text-b4-sm text-di-gelap md:text-b4">
              Daftarkan rental kamu, kelola kalender dan pesanan dari satu
              dashboard. Tanpa biaya pendaftaran.
            </p>
            <div className="mt-24 flex flex-col gap-12 md:mt-32 md:flex-row md:flex-wrap">
              <Link
                href="/mitra"
                className="inline-flex min-h-52 items-center justify-center rounded-b-sm bg-white px-24 text-b5-sm font-bold text-green-700 transition-colors duration-160 ease-beranda hover:bg-green-100 md:text-b5"
              >
                Buka panel mitra
              </Link>
              <Link
                href="/jadi-penyedia"
                className="inline-flex min-h-52 items-center justify-center rounded-b-sm border-[1.5px] border-white/70 px-24 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-white/10 md:text-b5"
              >
                Pelajari selengkapnya
              </Link>
            </div>
          </div>
          <div className="relative order-first h-180 md:order-none md:h-auto">
            <Image
              src="/units/honda-vario-160-2022.webp"
              alt="Honda Vario 160 2022"
              fill
              sizes="(min-width: 768px) 520px, 100vw"
              className="foto-unit pudar-kiri object-cover object-[55%_50%] md:object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
