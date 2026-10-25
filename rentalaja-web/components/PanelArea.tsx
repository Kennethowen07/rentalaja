"use client";

// Popover "Area antar" di kotak pencarian beranda, gaya yang sama dengan
// kalender tanggal. Menggantikan <select> bawaan browser (25 Okt 2026).
//
// Dua tampilan:
//   - daftar: tujuh area layanan, plus pilihan "Pilih di peta" paling atas.
//   - peta: penyewa menaruh pin, area terdekat langsung terdeteksi dari
//     jarak garis lurus ke titik pusat tiap area (koordinatArea).
//
// Esc menutup panel; klik di luar ditangani pemanggil (SearchCard).

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import { jarakKm, type Koordinat } from "@/lib/geocode";
import { kamus, lokal } from "@/lib/i18n";
import { areaAntarOptions, koordinatArea } from "@/lib/mock/areas";

const PetaLeaflet = dynamic(() => import("@/components/ui/PetaLeaflet"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface" />,
});

type Area = (typeof areaAntarOptions)[number];

/** Lebih jauh dari ini, titiknya dianggap di luar area layanan. */
const BATAS_LAYANAN_KM = 10;

function areaTerdekat(titik: Koordinat): { area: Area; km: number } {
  return areaAntarOptions
    .map((area) => ({ area, km: jarakKm(titik, koordinatArea[area]) }))
    .reduce((a, b) => (b.km < a.km ? b : a));
}

const TEKS = kamus({
  id: {
    dialog: "Pilih area antar",
    pilihPeta: "Pilih di peta",
    otomatis: "Area terdekat dipilih otomatis",
    daftar: "Area antar",
    kembali: "Kembali ke daftar area",
    petunjuk: "Klik peta atau geser pin ke titik antar",
    terdekat: "Area terdekat",
    jarak: (km: string) => `${km} km dari titikmu`,
    diLuar: ", di luar area layanan",
    pakai: "Pakai area ini",
  },
  en: {
    dialog: "Choose a delivery area",
    pilihPeta: "Pick on the map",
    otomatis: "The nearest area is chosen for you",
    daftar: "Delivery area",
    kembali: "Back to the area list",
    petunjuk: "Click the map or drag the pin to your delivery point",
    terdekat: "Nearest area",
    jarak: (km: string) => `${km} km from your pin`,
    diLuar: ", outside our service area",
    pakai: "Use this area",
  },
});

function Ikon({ d, className = "size-20" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

const IKON_PETA = "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14";
const IKON_CENTANG = "M5 12.5l4.5 4.5L19 7.5";
const IKON_KEMBALI = "M15 6l-6 6 6 6";

export default function PanelArea({
  nilai,
  onPilih,
  onTutup,
}: {
  nilai: string;
  onPilih: (area: Area) => void;
  onTutup: () => void;
}) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const formatKm = new Intl.NumberFormat(lokal(bahasa), { maximumFractionDigits: 1 });
  const [tampilan, setTampilan] = useState<"daftar" | "peta">("daftar");
  const [titik, setTitik] = useState<Koordinat>(
    koordinatArea[(nilai as Area) in koordinatArea ? (nilai as Area) : "Canggu, Badung"],
  );
  const wadahRef = useRef<HTMLDivElement>(null);

  // Fokus pindah ke pilihan aktif (atau "Pilih di peta") saat panel dibuka,
  // dan ke tombol kembali saat berganti ke tampilan peta.
  useEffect(() => {
    const sasaran =
      tampilan === "peta"
        ? wadahRef.current?.querySelector<HTMLElement>("[data-kembali]")
        : (wadahRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ??
          wadahRef.current?.querySelector<HTMLElement>("[data-peta]"));
    sasaran?.focus();
  }, [tampilan]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (tampilan === "peta") setTampilan("daftar");
      else onTutup();
      return;
    }
    // Panah atas/bawah berpindah antar pilihan di tampilan daftar.
    if (tampilan !== "daftar" || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    const tombol = [...(wadahRef.current?.querySelectorAll<HTMLElement>("[data-pilihan]") ?? [])];
    const i = tombol.indexOf(document.activeElement as HTMLElement);
    const berikut = e.key === "ArrowDown" ? Math.min(i + 1, tombol.length - 1) : Math.max(i - 1, 0);
    e.preventDefault();
    tombol[berikut]?.focus();
  }

  const terdekat = areaTerdekat(titik);
  const diLuar = terdekat.km > BATAS_LAYANAN_KM;

  return (
    <div
      ref={wadahRef}
      role="dialog"
      aria-label={t.dialog}
      onKeyDown={onKeyDown}
      className={
        "absolute top-full right-0 left-0 z-20 mt-8 rounded-b-lg border border-green-200 bg-white shadow-b-cari md:rounded-b-xl " +
        (tampilan === "peta" ? "p-16 md:right-auto md:w-520 md:p-20" : "p-8")
      }
    >
      {tampilan === "daftar" ? (
        <>
          <button
            type="button"
            data-pilihan
            data-peta
            onClick={() => setTampilan("peta")}
            className="flex w-full items-center gap-12 rounded-b-sm px-12 py-12 text-left transition-colors duration-160 ease-beranda hover:bg-green-50 focus-visible:bg-green-50"
          >
            <span className="grid size-36 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
              <Ikon d={IKON_PETA} className="size-18" />
            </span>
            <span>
              <span className="block text-b5-sm font-bold text-green-700 md:text-b5">{t.pilihPeta}</span>
              <span className="block text-b6-sm text-muted-kuat">{t.otomatis}</span>
            </span>
          </button>
          <div aria-hidden className="mx-12 my-6 border-t border-green-200" />
          <ul role="listbox" aria-label={t.daftar}>
            {areaAntarOptions.map((area) => {
              const [nama, kabupaten] = area.split(", ");
              const dipilih = area === nilai;
              return (
                <li key={area} role="presentation">
                  <button
                    type="button"
                    role="option"
                    data-pilihan
                    aria-selected={dipilih}
                    onClick={() => onPilih(area)}
                    className={
                      "flex min-h-44 w-full items-center justify-between gap-12 rounded-b-sm px-12 py-10 text-left transition-colors duration-160 ease-beranda hover:bg-green-50 focus-visible:bg-green-50 " +
                      (dipilih ? "bg-green-50 text-green-700" : "text-ink")
                    }
                  >
                    <span className="text-b5-sm md:text-b5">
                      <span className="font-semibold">{nama}</span>
                      {kabupaten && <span className="text-muted-kuat">, {kabupaten}</span>}
                    </span>
                    {dipilih && <Ikon d={IKON_CENTANG} className="size-18 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <div className="flex items-center gap-8">
            <button
              type="button"
              data-kembali
              onClick={() => setTampilan("daftar")}
              aria-label={t.kembali}
              className="grid size-36 shrink-0 place-items-center rounded-full border border-green-200 text-ink transition-colors duration-160 ease-beranda hover:border-green-700 hover:text-green-700"
            >
              <Ikon d={IKON_KEMBALI} className="size-18" />
            </button>
            <p className="text-b6-sm font-semibold text-muted-kuat md:text-b6">
              {t.petunjuk}
            </p>
          </div>

          {/* isolate: z-index internal Leaflet tetap di dalam kotak ini. */}
          <div className="relative isolate mt-12 h-260 overflow-hidden rounded-b-sm border border-green-200 bg-surface md:h-300">
            <PetaLeaflet posisi={titik} interaktif onPindah={setTitik} />
          </div>

          <div className="mt-14 flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-b6-sm text-muted-kuat md:text-b6">
              {t.terdekat}
              <span className="block text-b5-sm font-bold text-ink md:text-b5">{terdekat.area}</span>
              <span className={diLuar ? "text-error" : undefined}>
                {t.jarak(formatKm.format(terdekat.km))}
                {diLuar && t.diLuar}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onPilih(terdekat.area)}
              className="inline-flex min-h-48 shrink-0 items-center justify-center rounded-b-sm bg-green-700 px-20 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800 md:text-b5"
            >
              {t.pakai}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
