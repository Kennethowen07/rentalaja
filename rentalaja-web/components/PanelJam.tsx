"use client";

// Popover "Jam ambil" di kotak pencarian beranda, gaya yang sama dengan
// kalender tanggal dan panel area. Menggantikan <select> bawaan browser
// (25 Okt 2026), yang tampil sebagai daftar abu-abu khas sistem operasi.
//
// Jam disusun tiga kolom supaya 15 pilihan muat tanpa gulir. Panah kiri/
// kanan pindah satu jam, atas/bawah satu baris. Esc menutup panel; klik di
// luar ditangani pemanggil (SearchCard).

import { useEffect, useRef, type KeyboardEvent } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import { jamAmbilOptions } from "@/lib/mock/areas";

const KOLOM = 3;

export default function PanelJam({
  nilai,
  onPilih,
  onTutup,
}: {
  nilai: string;
  onPilih: (jam: string) => void;
  onTutup: () => void;
}) {
  const { bahasa } = useBahasa();
  const wadahRef = useRef<HTMLDivElement>(null);

  // Fokus ke jam yang terpilih, atau jam pertama, saat panel dibuka.
  useEffect(() => {
    (
      wadahRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ??
      wadahRef.current?.querySelector<HTMLElement>("[role=option]")
    )?.focus();
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onTutup();
      return;
    }
    const langkah = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: KOLOM, ArrowUp: -KOLOM }[e.key];
    if (!langkah) return;
    const tombol = [...(wadahRef.current?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
    const i = tombol.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    tombol[Math.min(Math.max(i + langkah, 0), tombol.length - 1)]?.focus();
  }

  return (
    <div
      ref={wadahRef}
      onKeyDown={onKeyDown}
      // HP: field jam ada di kolom kiri, jadi panel melebar sampai tepi
      // kanan tombol "Cari unit". Mulai 768px panel menempel di kanan field.
      className="absolute top-full left-0 z-20 mt-8 w-[calc(200%+--spacing(12))] rounded-b-lg border border-green-200 bg-white p-8 shadow-b-cari md:right-0 md:left-auto md:w-300 md:rounded-b-xl md:p-12"
    >
      <ul role="listbox" aria-label={bahasa === "en" ? "Pick-up time" : "Jam ambil"} className="grid grid-cols-3 gap-4">
        {jamAmbilOptions.map((jam) => {
          const dipilih = jam === nilai;
          return (
            <li key={jam} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={dipilih}
                onClick={() => onPilih(jam)}
                className={
                  "flex min-h-44 w-full items-center justify-center rounded-b-sm text-b5-sm font-semibold tabular-nums transition-colors duration-160 ease-beranda md:text-b5 " +
                  (dipilih
                    ? "bg-green-700 text-white"
                    : "text-ink hover:bg-green-50 hover:text-green-700 focus-visible:bg-green-50")
                }
              >
                {/* Nilainya tetap "09.00"; tampilannya "09:00" di bahasa Inggris. */}
                {bahasa === "en" ? jam.replace(".", ":") : jam}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
