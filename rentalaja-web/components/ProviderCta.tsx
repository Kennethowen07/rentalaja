// README section 9 — blok gradient CTA penyedia.
// <640px: jadi kolom, tombol full width (README/Responsive).
//
// "Jadi penyedia" mengarah langsung ke /mitra. Di produk sungguhan tombol ini
// membuka pendaftaran, tapi di prototype tanpa login panel itulah yang ingin
// ditunjukkan, dan tanpa tautan ini panel mitra tidak bisa ditemukan sama
// sekali dari landing.

import Link from "next/link";

export default function ProviderCta() {
  return (
    <section id="jadi-penyedia" className="bg-white">
      <div className="container-page">
        <div className="bg-cta-gradient mb-34 flex flex-col items-start gap-24 rounded-block p-30 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-520">
            <h2 className="text-h2-cta text-white">
              Punya unit yang sering menganggur?
            </h2>
            <p className="mt-9 text-body text-green-300">
              Daftarkan rental kamu, kelola kalender dan pesanan dari satu
              dashboard. Tanpa biaya pendaftaran.
            </p>
          </div>

          <div className="flex w-full flex-col gap-10 sm:w-auto sm:flex-row">
            <Link
              href="/mitra"
              className="rounded-cta bg-white px-22 py-13 text-center text-btn-sm text-green-700"
            >
              Buka panel mitra
            </Link>
            <a
              href="#simulasi"
              className="rounded-cta border border-white/45 px-22 py-13 text-center text-btn-sm text-white"
            >
              Lihat simulasi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
