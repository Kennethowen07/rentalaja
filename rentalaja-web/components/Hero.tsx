// README section 2. Foto hero-parkir.png, posisi center 38% / cover.
//
// Penyimpangan dari spec: overlay hijau spec (.bg-hero-overlay, 94% ke 42%)
// terasa terlalu tebal, jadi diganti hijau merek yang jauh lebih tipis
// (.bg-hero-overlay-muda) supaya foto lebih terlihat. Ketebalannya hasil
// simulasi kontras di 4 ukuran layar. Warna teks lewat token hero-sub,
// hero-meta, dan hero-pill-*. Versi spec: kelas overlay "bg-hero-overlay"
// dengan token teks green-300, green-400, pill-bg, pill-border.

import Image from "next/image";
import { heroEyebrow, heroStats } from "@/lib/mock/stats";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/hero-parkir.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-2 object-cover object-[center_38%]"
      />
      <div className="bg-hero-overlay-muda absolute inset-0 -z-1" />

      <div className="container-page pt-40 pb-64 sm:pt-58 sm:pb-86">
        <div className="teks-hero max-w-580">
          <p className="inline-flex items-center gap-7 rounded-pill border border-hero-pill-border bg-hero-pill-bg px-13 py-6 text-pill text-hero-sub">
            {heroEyebrow}
          </p>

          <h1 className="mt-16 text-h1-sm text-white sm:text-h1-md lg:text-h1">
            Lihat unit yang benar-benar kosong di tanggalmu.
          </h1>

          <p className="mt-13 text-lead text-hero-sub">
            Harga tetap, tanpa chat dulu. Pilih tanggal, bayar penuh sekali, unit
            diantar ke titik yang kamu tentukan.
          </p>

          {/* Trust row — dipisah divider 1px rgba(255,255,255,.22).
              <640px dibiarkan wrap (README/Responsive). */}
          <dl className="mt-22 flex flex-wrap gap-22">
            {heroStats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col-reverse ${
                  i > 0 ? "border-l border-white/22 pl-22" : ""
                }`}
              >
                <dt className="text-micro text-hero-meta">{s.label}</dt>
                <dd className="text-metric-hero text-white">{s.angka}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
