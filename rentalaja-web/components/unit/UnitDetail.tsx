// Layar 3 · Detail unit. Murni tampilan — seluruh datanya datang dari
// GET /api/units/:slug lewat halaman yang merender komponen ini.

import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { formatRupiah } from "@/lib/mock/units";
import type { DetailUnit } from "@/lib/mock/unit-detail";

function Seksi({
  judul,
  children,
}: {
  judul: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-18 border-t border-line pt-16">
      <h2 className="text-section-sm text-ink">{judul}</h2>
      {children}
    </section>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-12">
      <dt className="text-row text-muted">{label}</dt>
      <dd className="text-row-value text-ink">{nilai}</dd>
    </div>
  );
}

export default function UnitDetail({ data }: { data: DetailUnit }) {
  const { unit, harga } = data;

  return (
    <div className="container-page pt-18 pb-28">
      <p className="mb-14 text-meta text-muted">
        Motor · {unit.area} · {data.rentangLabel} &nbsp;›&nbsp;{" "}
        <span className="text-nav-strong text-ink">{unit.nama}</span>
      </p>

      <div className="grid items-start gap-24 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Galeri */}
          <div className="grid h-230 grid-cols-[2fr_1fr] gap-8">
            <div className="relative overflow-hidden rounded-result">
              {unit.foto ? (
                <Image
                  src={unit.foto}
                  alt={`Foto ${unit.nama}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder
                  label="foto utama"
                  className="absolute inset-0"
                />
              )}
            </div>
            <div className="grid grid-rows-2 gap-8">
              <ImagePlaceholder label="foto lain" className="rounded-result" />
              <ImagePlaceholder label="foto lain" className="rounded-result" />
            </div>
          </div>

          <h1 className="mt-18 text-h-unit text-ink">{unit.nama}</h1>
          <p className="mt-5 text-lead text-muted">{data.meta}</p>

          {/* Penyedia sengaja ditaruh di atas, sebelum detail unit:
              siapa yang menyewakan adalah pertanyaan pertama penyewa yang
              tidak kenal siapa pun di kota itu (design brief, bagian
              "Dua sisi pengguna"). Desain menaruhnya paling bawah. */}
          <Seksi judul="Penyedia">
            <div className="mt-10 flex items-center gap-12">
              <span
                aria-hidden
                className="size-44 shrink-0 rounded-pill bg-surface-2"
              />
              <div>
                <p className="text-section-sm text-ink">{data.penyedia.nama}</p>
                <p className="mt-2 text-body text-muted">{data.penyedia.meta}</p>
              </div>
            </div>
          </Seksi>

          <Seksi judul="Ketersediaan 7 hari">
            <ul className="mt-10 flex gap-6">
              {data.kalender.map((h) => (
                <li
                  key={h.tanggal}
                  className={`flex-1 rounded-input border py-9 text-center ${
                    h.kosong
                      ? "border-chip-border bg-green-100 text-green-700"
                      : "border-line-soft bg-surface-2 text-placeholder"
                  }`}
                >
                  <p className="text-cal-dow opacity-70">{h.dow}</p>
                  <p className="mt-2 text-cal-date">{h.tanggal}</p>
                  <p className="mt-3 text-cal-state">
                    {h.kosong ? "kosong" : "tersewa"}
                  </p>
                </li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul="Isi paket">
            {/* list-inside, bukan pl-18: marker "outside" di dalam sel grid
                bisa meluber ke gap kolom sebelahnya. */}
            <ul className="mt-10 grid list-disc list-inside gap-9 text-item text-ink marker:text-green-700 sm:grid-cols-2">
              {data.paket.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul="Tidak termasuk">
            <ul className="mt-6 grid list-disc gap-6 pl-18 text-prose text-muted marker:text-green-700">
              {data.tidakTermasuk.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul="Jaminan dan syarat">
            <ul className="mt-9 grid list-disc gap-8 rounded-result border border-line bg-surface-3 py-14 pr-14 pl-32 text-prose text-ink marker:text-green-700">
              {data.jaminan.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Seksi>

        </div>

        {/* Panel harga sticky */}
        <aside className="rounded-card border border-line p-18 lg:sticky lg:top-76">
          <p className="text-meta text-muted">Mulai dari</p>
          <p className="mt-2 text-price-lg text-ink">
            {formatRupiah(harga.perHari)}
            <span className="text-price-unit text-muted"> /hari</span>
          </p>

          <div className="mt-14 rounded-input bg-green-100 px-12 py-10">
            <p className="text-verified text-green-700">
              Kosong {data.rentangLabel}
            </p>
            <p className="mt-2 text-micro text-green-800">
              Diverifikasi dari kalender penyedia, 2 menit lalu
            </p>
          </div>

          <dl className="mt-14 grid gap-8">
            <Baris
              label={`${formatRupiah(harga.perHari)} × ${data.hari} hari`}
              nilai={formatRupiah(harga.subtotal)}
            />
            <Baris label={`Antar jemput ${unit.area}`} nilai="Gratis" />
            <Baris label="Biaya layanan" nilai={formatRupiah(harga.layanan)} />
          </dl>

          <div className="mt-12 flex items-baseline justify-between gap-12 border-t border-line pt-12">
            <p className="text-total-label text-ink">Total bayar</p>
            <p className="text-total text-ink">{formatRupiah(harga.total)}</p>
          </div>

          <Link
            href="/pemesanan"
            className="mt-14 block rounded-input bg-green-700 py-13 text-center text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            Pesan unit ini
          </Link>
          <Link
            href="/cari"
            className="mt-8 block rounded-input border border-line py-11 text-center text-nav-strong text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:text-green-700"
          >
            Ganti tanggal
          </Link>

          <p className="mt-10 text-micro text-muted">
            Dibayar penuh sekarang. Uangnya ditahan rentalaja sampai unit
            kembali, tanpa deposit tunai ke pemilik.
          </p>
        </aside>
      </div>
    </div>
  );
}
