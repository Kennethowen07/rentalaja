// Layar 5 · Pesanan aktif.
//
// Seluruh layar ini bersifat tampilan — tidak ada state. Tombol aksi di
// panel kanan sengaja dirender sebagai <button> tanpa handler: layar
// tujuannya (perpanjang, reschedule, lapor masalah) belum ada di scope.

import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { pesananAktif } from "@/lib/mock/pesanan-aktif";

const KARTU = "rounded-card border border-line p-18";

export default function OrderActive() {
  const { unit, serahTerima, penyedia, perluUbah } = pesananAktif;

  return (
    <div className="container-page pt-22 pb-28">
      <div className="grid items-start gap-24 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Status + unit + timeline */}
          <section className="overflow-hidden rounded-card border border-line">
            <div className="flex flex-wrap items-center justify-between gap-12 bg-green-100 px-18 py-14">
              <div>
                <h1 className="text-tab text-green-700">
                  {pesananAktif.status}
                </h1>
                <p className="mt-2 text-meta text-green-800">
                  {pesananAktif.statusDetail}
                </p>
              </div>
              <p className="text-pill text-green-800">{pesananAktif.kode}</p>
            </div>

            <div className="p-18">
              <div className="flex gap-13">
                <div className="relative h-68 w-92 shrink-0 overflow-hidden rounded-input">
                  <Image
                    src={unit.foto}
                    alt={`Foto ${unit.nama}`}
                    fill
                    sizes="92px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-unit-name text-ink">{unit.nama}</h2>
                  <p className="mt-3 text-body-sm text-muted">{unit.plat}</p>
                  <p className="mt-2 text-body-sm text-muted">{unit.periode}</p>
                </div>
              </div>

              {/* Timeline. Tahap yang sudah lewat ditandai bar hijau DAN
                  centang pada labelnya — bukan warna saja. */}
              <ol className="mt-20 flex">
                {pesananAktif.tahap.map((t, i) => (
                  <li key={t.label} className={i > 0 ? "ml-6 flex-1" : "flex-1"}>
                    <div
                      className={`h-4 rounded-bar ${
                        t.selesai ? "bg-green-700" : "bg-line"
                      }`}
                    />
                    <p
                      className={`mt-7 text-step-label ${
                        t.selesai ? "text-ink" : "text-muted"
                      }`}
                    >
                      {t.selesai ? `✓ ${t.label}` : t.label}
                    </p>
                    <p className="text-testimonial-meta text-muted">
                      {t.waktu}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Serah terima berfoto */}
          <section className={`${KARTU} mt-14`}>
            <h2 className="text-section-sm text-ink">{serahTerima.judul}</h2>
            <p className="mt-4 text-body-sm text-muted">{serahTerima.sub}</p>
            <ul className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {serahTerima.sisi.map((s) => (
                <li key={s}>
                  <ImagePlaceholder
                    label={`foto ${s}`}
                    className="h-64 rounded-input"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-8 text-micro text-muted">{serahTerima.catatan}</p>
          </section>

          {/* Rincian pembayaran */}
          <section className={`${KARTU} mt-14`}>
            <h2 className="text-section-sm text-ink">Rincian pembayaran</h2>
            <dl className="mt-11 grid gap-8">
              {pesananAktif.pembayaran.map((b) => (
                <div key={b.label} className="flex justify-between gap-12">
                  <dt className="text-row text-muted">{b.label}</dt>
                  <dd
                    className={`text-row-value ${
                      b.ditahan ? "text-warning" : "text-ink"
                    }`}
                  >
                    {b.nilai}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Panel kanan */}
        <div className="grid gap-14 lg:sticky lg:top-76">
          <section className={KARTU}>
            <h2 className="text-panel text-ink">Penyedia</h2>
            <div className="mt-11 flex items-center gap-11">
              <span
                aria-hidden
                className="size-42 shrink-0 rounded-pill bg-surface-2"
              />
              <div>
                <p className="text-panel text-ink">{penyedia.nama}</p>
                <p className="mt-2 text-micro text-muted">{penyedia.meta}</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-13 w-full rounded-input bg-green-700 py-11 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800"
            >
              Hubungi penyedia
            </button>
            <button
              type="button"
              className="mt-8 w-full rounded-input border border-line py-10 text-link-sm text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:text-green-700"
            >
              Lihat titik pengembalian
            </button>
          </section>

          <section className={KARTU}>
            <h2 className="text-panel text-ink">Perlu ubah?</h2>
            <ul className="mt-11 grid gap-8">
              {perluUbah.aksi.map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    className={`text-left text-link-sm transition-colors duration-160 ease-base ${
                      a.bahaya
                        ? "text-danger hover:underline"
                        : "text-ink hover:text-green-700"
                    }`}
                  >
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-11 text-micro text-muted">{perluUbah.catatan}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
