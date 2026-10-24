// Beranda v3, testimoni (design-lab/approved/round-1.html).
// Testimoni ini fiktif; lihat catatan di lib/mock/testimonials.ts.

import Image from "next/image";
import { testimoni } from "@/lib/mock/testimonials";

export default function Testimonials() {
  return (
    <section aria-labelledby="judul-testimoni" className="bg-green-900 py-64 text-white md:py-96">
      <div className="container-beranda">
        <h2
          id="judul-testimoni"
          className="text-b6-sm font-bold tracking-[0.08em] text-mint uppercase md:text-b6"
        >
          Kata penyewa
        </h2>
        <ul className="mt-24 grid gap-16 md:grid-cols-3 md:gap-24">
          {testimoni.map((t) => (
            <li key={t.id}>
              <figure className="flex h-full flex-col rounded-b-lg border border-white/12 bg-white/6 p-24 md:rounded-b-xl md:p-32">
                <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden className="size-32 text-mint-ikon">
                  <path d="M13 8C7.5 9.6 4 13.9 4 19.3V24h9v-9H8.6c.5-2.6 2.3-4.6 5.4-5.6L13 8zm15 0c-5.5 1.6-9 5.9-9 11.3V24h9v-9h-4.4c.5-2.6 2.3-4.6 5.4-5.6L28 8z" />
                </svg>
                <blockquote className="mt-20 text-b4-sm leading-normal font-medium md:text-b4">
                  {t.kutipan}
                </blockquote>
                <figcaption className="mt-auto pt-24">
                  <div className="flex items-center gap-16 border-t border-white/12 pt-24">
                    {/* alt kosong: nama penyewa sudah tertulis tepat di
                        sebelahnya, jadi screen reader tidak membacanya dua kali. */}
                    <Image
                      src={t.foto}
                      alt=""
                      width={56}
                      height={56}
                      className="size-56 shrink-0 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div>
                      <p className="text-b5-sm font-bold md:text-b5">{t.nama}</p>
                      <p className="text-b6-sm text-green-350 md:text-b6">{t.meta}</p>
                    </div>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
