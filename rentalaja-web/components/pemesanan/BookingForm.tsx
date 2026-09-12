"use client";

// Layar 4 · Pemesanan.
//
// Dua hal yang benar-benar interaktif sesuai desain: pilihan titik antar
// dan metode pembayaran. Stepper di atas bersifat penanda — desain
// menampilkan ketiga langkah dalam satu halaman, bukan wizard bertahap.

import Image from "next/image";
import { useState } from "react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import {
  langkah,
  metodePembayaran,
  opsiPengambilan,
  pesanan,
} from "@/lib/mock/pemesanan";

const KOTAK =
  "rounded-input border border-line px-12 py-11 text-nav-strong text-ink";
const KARTU = "rounded-card border border-line p-18";

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="mb-6 text-label text-muted">{label}</p>
      <p className={KOTAK}>{children}</p>
    </div>
  );
}

export default function BookingForm() {
  const [pengambilan, setPengambilan] = useState(0);
  const [pembayaran, setPembayaran] = useState(0);

  return (
    <div className="container-page pt-20 pb-28">
      {/* Stepper */}
      <ol className="mb-20 flex items-center gap-10">
        {langkah.map((l, i) => (
          <li key={l} className="flex flex-1 items-center gap-10 last:flex-none">
            <span
              aria-current={i === 0 ? "step" : undefined}
              className={
                i === 0
                  ? "rounded-pill bg-green-100 px-13 py-6 text-step text-green-700"
                  : "rounded-pill border border-line px-13 py-6 text-filter text-muted"
              }
            >
              {l}
            </span>
            {i < langkah.length - 1 && (
              <span aria-hidden className="h-2 flex-1 bg-line" />
            )}
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-24 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Tanggal dan titik antar */}
          <section className={KARTU}>
            <h2 className="text-result-head text-ink">
              Tanggal dan titik antar
            </h2>

            <div className="mt-14 grid gap-12 sm:grid-cols-2">
              <Field label="Ambil">{pesanan.ambil}</Field>
              <Field label="Kembali">{pesanan.kembali}</Field>
            </div>

            <div className="mt-12">
              <Field label="Titik antar">{pesanan.titikAntar}</Field>
              <ImagePlaceholder
                label="potongan peta"
                className="mt-8 h-96 rounded-input"
              />
            </div>

            <div
              role="group"
              aria-label="Cara pengambilan unit"
              className="mt-12 flex flex-wrap gap-8"
            >
              {opsiPengambilan.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={i === pengambilan}
                  onClick={() => setPengambilan(i)}
                  className={`rounded-input border px-13 py-8 text-filter transition-colors duration-160 ease-base ${
                    i === pengambilan
                      ? "border-transparent bg-green-100 text-green-700"
                      : "border-line text-muted"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </section>

          {/* Dokumen */}
          <section className={`${KARTU} mt-14`}>
            <h2 className="text-result-head text-ink">Dokumen</h2>
            <p className="mt-4 text-body-sm text-muted">
              Untuk motor, KTP atau paspor dan SIM C. Diverifikasi penyedia
              sebelum unit diantar.
            </p>

            <div className="mt-14 grid gap-12 sm:grid-cols-2">
              <div className="rounded-result border border-dashed border-green-700 bg-green-100 p-18 text-center">
                <p className="text-cta-sm text-green-700">
                  {pesanan.dokumen.identitas.label}
                </p>
                <p className="mt-3 text-micro text-green-800">
                  {pesanan.dokumen.identitas.berkas}
                </p>
              </div>
              <div className="rounded-result border border-dashed border-line p-18 text-center">
                <p className="text-cta-sm text-ink">
                  {pesanan.dokumen.sim.label}
                </p>
                <p className="mt-3 text-micro text-muted">
                  {pesanan.dokumen.sim.berkas}
                </p>
              </div>
            </div>

            <div className="mt-14 grid gap-8 border-t border-line pt-12">
              <Field label="Nama sesuai dokumen">{pesanan.penyewa.nama}</Field>
              <div className="grid gap-12 sm:grid-cols-2">
                <Field label="Nomor WhatsApp">{pesanan.penyewa.whatsapp}</Field>
                <Field label="Email">{pesanan.penyewa.email}</Field>
              </div>
            </div>
          </section>

          {/* Bayar DP */}
          <section className={`${KARTU} mt-14`}>
            <h2 className="text-result-head text-ink">Bayar DP</h2>
            <div
              role="radiogroup"
              aria-label="Metode pembayaran"
              className="mt-12 grid gap-8"
            >
              {metodePembayaran.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={i === pembayaran}
                  onClick={() => setPembayaran(i)}
                  className={`rounded-input border p-12 text-left transition-colors duration-160 ease-base ${
                    i === pembayaran
                      ? "border-green-700 bg-green-100 text-tab text-green-700"
                      : "border-line text-nav-strong text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Panel ringkasan sticky */}
        <aside className="rounded-card border border-line p-18 lg:sticky lg:top-76">
          <div className="flex gap-11">
            <div className="relative h-50 w-66 shrink-0 overflow-hidden rounded-input">
              <Image
                src={pesanan.unit.foto}
                alt={`Foto ${pesanan.unit.nama}`}
                fill
                sizes="66px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-btn-sm text-ink">{pesanan.unit.nama}</p>
              <p className="mt-2 text-micro text-muted">
                {pesanan.unit.penyedia} · ★ {pesanan.unit.rating}
              </p>
            </div>
          </div>

          <dl className="mt-14 grid gap-8 border-t border-line pt-12">
            {pesanan.rincian.map((r) => (
              <div key={r.label} className="flex justify-between gap-12">
                <dt className="text-row text-muted">{r.label}</dt>
                <dd className="text-row-value text-ink">{r.nilai}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 border-t border-line pt-12">
            <div className="flex items-baseline justify-between gap-12">
              <p className="text-total-label text-ink">DP dibayar sekarang</p>
              <p className="text-total text-ink">{pesanan.dp}</p>
            </div>
            <div className="mt-6 flex justify-between gap-12 text-body-sm text-muted">
              <span>Sisa tunai saat serah terima</span>
              <span>{pesanan.sisa}</span>
            </div>
            <div className="mt-4 flex justify-between gap-12 text-body-sm text-muted">
              <span>Deposit tunai, dikembalikan</span>
              <span>{pesanan.deposit}</span>
            </div>
          </div>

          <button
            type="button"
            className="mt-14 w-full rounded-input bg-green-700 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            Bayar DP {pesanan.dp}
          </button>

          <p className="mt-10 text-micro text-muted">
            Pesanan menunggu konfirmasi penyedia maksimal 1 jam. DP kembali
            penuh kalau ditolak.
          </p>
        </aside>
      </div>
    </div>
  );
}
