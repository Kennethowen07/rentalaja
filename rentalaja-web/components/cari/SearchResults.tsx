"use client";

// Layar 2 · Hasil pencarian.
//
// Satu-satunya state di layar ini adalah rentang tanggal yang dipilih.
// Mengubahnya menggeser: jumlah unit kosong, label tanggal, durasi, harga
// total tiap kartu, badge ketersediaan, urutan kartu, dan status CTA.
// Ini "momen ganti tanggal" yang design brief sebut sebagai inti prototype.

import { useState } from "react";
import ResultCard from "@/components/cari/ResultCard";
import {
  filterPasif,
  jumlahKosong,
  type RentangTanggal,
  unitHasil,
  urutkanHasil,
} from "@/lib/mock/search";

export default function SearchResults({
  ringkasanFilter,
  daftarRentang,
}: {
  ringkasanFilter: string;
  /** Dihitung di server dari tanggal pilihan penyewa, lihat app/cari/page.tsx. */
  daftarRentang: RentangTanggal[];
}) {
  const [rentangIndex, setRentangIndex] = useState(0);

  const rentang = daftarRentang[rentangIndex];
  const hasil = urutkanHasil(rentangIndex);
  const kosong = jumlahKosong(rentangIndex);

  return (
    <>
      {/* Filter bar sticky, menempel tepat di bawah navbar 64px / 72px */}
      <div className="sticky top-64 z-4 border-b border-line bg-white md:top-72">
        <div className="container-page flex flex-wrap items-center gap-12 py-12">
          <p className="rounded-input border border-line px-12 py-9 text-filter text-ink">
            {ringkasanFilter}
          </p>

          <div
            role="group"
            aria-label="Rentang tanggal"
            className="flex items-center gap-6 rounded-input border border-green-700 bg-green-100 px-10 py-7"
          >
            <span className="text-chip-label text-green-700">Tanggal</span>
            {daftarRentang.map((r, i) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={i === rentangIndex}
                onClick={() => setRentangIndex(i)}
                className={`rounded-chip border px-10 py-6 text-chip transition-colors duration-160 ease-base ${
                  i === rentangIndex
                    ? "border-transparent bg-green-700 text-white"
                    : "border-chip-border bg-white text-green-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Belum interaktif di desain — ditampilkan sebagai penanda saja */}
          {filterPasif.map((f) => (
            <p
              key={f}
              className="rounded-input border border-line px-12 py-9 text-filter text-muted"
            >
              {f}
            </p>
          ))}
        </div>
      </div>

      <div className="container-page pt-20 pb-28">
        <div className="mb-14 flex flex-wrap items-baseline justify-between gap-12">
          <h1 aria-live="polite" className="text-result-head text-ink">
            {kosong} unit kosong {rentang.label}{" "}
            <span className="text-result-sub text-muted">
              · {rentang.hari} hari · {unitHasil.length} unit ditampilkan
            </span>
          </h1>
          <p className="text-filter text-muted">Urutkan · Harga terendah</p>
        </div>

        <ul className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((h) => (
            <li key={h.unit.id}>
              <ResultCard hasil={h} sewa={{ mulai: rentang.mulai, hari: rentang.hari }} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
