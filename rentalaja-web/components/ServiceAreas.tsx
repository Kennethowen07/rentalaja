// Beranda v3, area yang dilayani (design-lab/approved/round-1.html).
//
// Penyimpangan dari design: di sana foto kanan hanya 280px dan menyisakan
// ruang kosong lebar di tengah (dicatat design manager). Di sini kolom foto
// dilebarkan dan chip dibiarkan mengisi kolom kiri sampai penuh.

import Image from "next/image";
import Link from "next/link";
import { areaChips, areaChipSisa } from "@/lib/mock/areas";

export default function ServiceAreas() {
  return (
    <section aria-labelledby="judul-area" className="bg-green-50 py-56 md:py-80">
      <div className="container-beranda grid items-center gap-48 md:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <h2 id="judul-area" className="text-b2-sm md:text-b2">
            Area yang dilayani
          </h2>
          <ul className="mt-24 flex flex-wrap gap-8 md:mt-32 md:gap-12">
            {areaChips.map((area) => (
              <li key={area}>
                <Link
                  href={`/cari?area=${encodeURIComponent(area)}`}
                  className="inline-flex h-44 items-center gap-8 rounded-pill border border-green-200 bg-white px-16 text-b5-sm font-semibold text-green-700 transition-colors duration-160 ease-beranda hover:border-green-700 hover:bg-green-50 md:h-48 md:gap-12 md:px-20 md:text-b5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="size-18"
                  >
                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  {area}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/cari"
                className="inline-flex h-44 items-center rounded-pill bg-green-700 px-16 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800 md:h-48 md:px-20 md:text-b5"
              >
                {areaChipSisa}
              </Link>
            </li>
          </ul>
        </div>
        <div className="bingkai-foto relative hidden aspect-[4/3] overflow-hidden rounded-b-xl md:block">
          <Image
            src="/units/honda-beat-2022.webp"
            alt="Honda Beat 2022 di jalan berliku"
            fill
            sizes="400px"
            className="foto-unit object-cover"
          />
        </div>
      </div>
    </section>
  );
}
