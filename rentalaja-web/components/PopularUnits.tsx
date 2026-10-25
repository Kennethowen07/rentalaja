// Beranda v3, unit populer (design-lab/approved/round-1.html).
//
// Atas permintaan pemilik proyek (25 Okt 2026) subjudul "Canggu, Seminyak,
// Ubud" dan jenis mesin di kartu ("skutik 110cc", "MPV 7 kursi") dihapus.
// Kartu hanya menyebut area, dengan weight semibold. Sejak 25 Okt 2026
// empat kartu yang lebih kecil, dua kolom di HP dan tablet.

import Image from "next/image";
import Link from "next/link";
import { desimal, jalur, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { formatRupiah, unitPopuler } from "@/lib/mock/units";

const TEKS = kamus({
  id: { judul: "Unit Populer Minggu Ini", semua: "Lihat semua unit →", dari5: "dari 5", perHari: "/hari" },
  en: { judul: "Popular This Week", semua: "See all vehicles →", dari5: "out of 5", perHari: "/day" },
});

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

export default async function PopularUnits() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <section aria-labelledby="judul-unit" className="pt-48 pb-64 md:pt-72 md:pb-96">
      <div className="container-beranda">
        <div className="mb-24 flex items-end justify-between gap-24 md:mb-40">
          <h2 id="judul-unit" className="text-b2-sm text-balance md:text-b2">
            {t.judul}
          </h2>
          <Link
            href={jalur(bahasa, "/cari")}
            className="hidden min-h-44 items-center text-b5 font-semibold text-green-700 decoration-2 underline-offset-4 hover:underline md:inline-flex"
          >
            {t.semua}
          </Link>
        </div>

        {/* Empat kartu kecil sejak 25 Okt 2026 (sebelumnya tiga kartu besar). */}
        <ul className="grid grid-cols-2 gap-12 md:gap-20 lg:grid-cols-4">
          {unitPopuler.map((u) => (
            <li key={u.id}>
              <Link
                href={jalur(bahasa, `/unit/${u.id}`)}
                className="group flex h-full flex-col overflow-hidden rounded-b-lg border border-green-200 bg-white shadow-b-1 transition duration-240 ease-beranda hover:-translate-y-4 hover:shadow-b-2 md:rounded-b-xl"
              >
                <div className="bingkai-foto relative aspect-[4/3] overflow-hidden">
                  {u.foto && (
                    <Image
                      src={u.foto}
                      alt={u.nama}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="foto-unit object-cover transition-transform duration-420 ease-beranda group-hover:scale-104"
                    />
                  )}
                  <span className="absolute top-10 left-10 z-1 inline-flex h-28 items-center gap-4 rounded-pill bg-white px-10 text-b6-sm font-semibold shadow-b-chip md:top-12 md:left-12 md:text-b6">
                    <span aria-hidden className="text-bintang">
                      ★
                    </span>
                    {desimal(u.rating, bahasa)}
                    <span className="sr-only">{t.dari5}</span>
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-12 md:p-18">
                  <h3 className="text-b6-sm font-bold md:text-b5">{u.nama}</h3>
                  <p className="mt-2 text-b6-sm font-semibold text-muted-kuat md:text-b6">
                    {u.area}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-8 pt-12">
                    <p className="flex flex-wrap items-baseline gap-x-4">
                      <span className="text-b5-sm font-extrabold text-green-700 tabular-nums md:text-b4">
                        {formatRupiah(u.hargaPerHari)}
                      </span>
                      <span className="text-b6-sm font-medium text-muted-kuat md:text-b6">
                        {t.perHari}
                      </span>
                    </p>
                    <span
                      aria-hidden
                      className="hidden size-36 shrink-0 place-items-center rounded-full bg-green-100 text-green-700 transition-colors duration-240 ease-beranda group-hover:bg-green-700 group-hover:text-white md:grid"
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
          href={jalur(bahasa, "/cari")}
          className="mt-16 flex min-h-48 items-center justify-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700 md:hidden"
        >
          {t.semua}
        </Link>
      </div>
    </section>
  );
}
