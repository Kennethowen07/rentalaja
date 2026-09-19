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
        {/* Ukurannya dinaikkan dari spec (p-30, judul 23px) atas permintaan:
            blok ini satu-satunya ajakan untuk sisi penyedia, jadi boleh lebih
            berat daripada section biasa. Ukuran di HP dibiarkan seperti semula
            supaya tidak memakan satu layar penuh. */}
        <div className="bg-cta-gradient mb-34 flex flex-col items-start gap-24 rounded-block p-30 sm:flex-row sm:items-center sm:justify-between sm:gap-32 sm:p-40 lg:p-52">
          <div className="max-w-520 lg:max-w-640">
            <h2 className="text-h2-cta text-white lg:text-h1-md">
              Punya unit yang sering menganggur?
            </h2>
            <p className="mt-9 text-body text-green-300 lg:mt-12 lg:text-lead">
              Daftarkan rental kamu, kelola kalender dan pesanan dari satu
              dashboard. Tanpa biaya pendaftaran.
            </p>
          </div>

          <div className="flex w-full flex-col gap-10 sm:w-auto sm:flex-row lg:gap-12">
            <Link
              href="/mitra"
              className="rounded-cta bg-white px-22 py-13 text-center text-btn-sm text-green-700 lg:px-28 lg:py-16 lg:text-btn"
            >
              Buka panel mitra
            </Link>
            <a
              href="#simulasi"
              className="rounded-cta border border-white/45 px-22 py-13 text-center text-btn-sm text-white lg:px-28 lg:py-16 lg:text-btn"
            >
              Lihat simulasi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
