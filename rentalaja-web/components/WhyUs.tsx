// README section 6 — split 2 kolom. Di bawah 1024px jadi 1 kolom, teks dulu.

import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { whyUsStats } from "@/lib/mock/stats";

const checklist = [
  {
    judul: "Kalender terhubung ke unit asli",
    body: "Unit yang sudah dipesan hilang dari hasil pencarian secara otomatis.",
  },
  {
    judul: "Serah terima berfoto dua arah",
    body: "Kondisi unit tercatat saat diantar dan saat dikembalikan.",
  },
  {
    judul: "Deposit dan denda tertulis sejak awal",
    body: "Semua biaya muncul di rincian sebelum kamu bayar DP.",
  },
];

export default function WhyUs() {
  return (
    <section className="bg-white py-38">
      <div className="container-page grid items-center gap-34 lg:grid-cols-2">
        <div>
          <p className="text-eyebrow text-green-700 uppercase">
            Kenapa rentalaja
          </p>
          <h2 className="mt-10 text-h2 text-ink">
            Ketersediaan yang jujur, harga yang tidak berubah di tengah jalan.
          </h2>

          <ul className="mt-18 flex flex-col gap-13">
            {checklist.map((c) => (
              <li key={c.judul} className="flex gap-11">
                <span
                  aria-hidden
                  className="mt-2 grid size-20 shrink-0 place-items-center rounded-pill bg-green-700 text-check text-white"
                >
                  ✓
                </span>
                <div>
                  <h3 className="text-btn-sm text-ink">{c.judul}</h3>
                  <p className="mt-2 text-body-xs text-muted">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <ImagePlaceholder
            label="foto serah terima"
            className="h-148 rounded-card"
          />

          <div className="flex h-148 flex-col justify-end rounded-card bg-green-900 p-16">
            <p className="text-metric text-white">
              {whyUsStats.konfirmasi.angka}
            </p>
            <p className="mt-4 text-stat-label text-green-400">
              {whyUsStats.konfirmasi.label}
            </p>
          </div>

          <div className="flex h-148 flex-col justify-end rounded-card bg-green-100 p-16">
            <p className="text-metric text-green-700">
              {whyUsStats.biayaTersembunyi.angka}
            </p>
            <p className="mt-4 text-stat-label text-green-600">
              {whyUsStats.biayaTersembunyi.label}
            </p>
          </div>

          <ImagePlaceholder
            label="foto unit di parkiran"
            className="h-148 rounded-card"
          />
        </div>
      </div>
    </section>
  );
}
