// Beranda v3, unit populer (design-lab/approved/round-1.html).
//
// Atas permintaan pemilik proyek (25 Okt 2026) subjudul "Canggu, Seminyak,
// Ubud" dan jenis mesin di kartu ("skutik 110cc", "MPV 7 kursi") dihapus.
// Kartu hanya menyebut area, dengan weight semibold.

import Image from "next/image";
import Link from "next/link";
import { formatRupiah, unitPopuler } from "@/lib/mock/units";

function Panah() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-20"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function PopularUnits() {
  return (
    <section aria-labelledby="judul-unit" className="pt-48 pb-64 md:pt-72 md:pb-96">
      <div className="container-beranda">
        <div className="mb-24 flex items-end justify-between gap-24 md:mb-40">
          <h2 id="judul-unit" className="text-b2-sm text-balance md:text-b2">
            Unit Populer Minggu Ini
          </h2>
          <Link
            href="/cari"
            className="hidden min-h-44 items-center text-b5 font-semibold text-green-700 decoration-2 underline-offset-4 hover:underline md:inline-flex"
          >
            Lihat semua unit →
          </Link>
        </div>

        <ul className="grid gap-16 md:grid-cols-3 md:gap-24">
          {unitPopuler.map((u) => (
            <li key={u.id}>
              <Link
                href={`/unit/${u.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-b-lg border border-green-200 bg-white shadow-b-1 transition duration-240 ease-beranda hover:-translate-y-4 hover:shadow-b-2 md:rounded-b-xl"
              >
                <div className="bingkai-foto relative aspect-[4/3] overflow-hidden">
                  {u.foto && (
                    <Image
                      src={u.foto}
                      alt={u.nama}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="foto-unit object-cover transition-transform duration-420 ease-beranda group-hover:scale-104"
                    />
                  )}
                  <span className="absolute top-16 left-16 z-1 inline-flex h-32 items-center gap-6 rounded-pill bg-white px-12 text-b6-sm font-semibold shadow-b-chip md:text-b6">
                    <span aria-hidden className="text-bintang">
                      ★
                    </span>
                    {u.rating}
                    <span className="sr-only">dari 5</span>
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-20 md:p-24">
                  <h3 className="text-b4-sm font-bold md:text-b4">{u.nama}</h3>
                  <p className="mt-4 text-b6-sm font-semibold text-muted-kuat md:text-b6">
                    {u.area}
                  </p>
                  <div className="mt-16 flex items-center justify-between gap-12">
                    <p className="flex items-baseline gap-6">
                      <span className="text-b3-sm text-green-700 tabular-nums md:text-b3">
                        {formatRupiah(u.hargaPerHari)}
                      </span>
                      <span className="text-b6-sm font-medium text-muted-kuat md:text-b6">
                        /hari
                      </span>
                    </p>
                    <span
                      aria-hidden
                      className="grid size-44 shrink-0 place-items-center rounded-full bg-green-100 text-green-700 transition-colors duration-240 ease-beranda group-hover:bg-green-700 group-hover:text-white"
                    >
                      <Panah />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/cari"
          className="mt-16 flex min-h-48 items-center justify-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700 md:hidden"
        >
          Lihat semua unit →
        </Link>
      </div>
    </section>
  );
}
