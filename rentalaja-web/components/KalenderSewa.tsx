"use client";

// Kalender pemilih rentang sewa untuk kotak pencarian di beranda.
// Menggantikan input tanggal bawaan browser, yang tampilannya tidak bisa
// diatur, berbeda di tiap browser, dan berbahasa Inggris.
//
// Satu kalender untuk dua field: mode "ambil" lalu "kembali". Logika
// mengisi field ada di pemanggil (SearchCard); komponen ini hanya
// menampilkan bulan, menandai rentang, dan melaporkan tanggal yang diklik.
//
// Keyboard: panah pindah hari/minggu, PageUp/PageDown pindah bulan,
// Home/End ke awal/akhir minggu, Enter/Spasi memilih, Esc menutup.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, lokal } from "@/lib/i18n";
import { geserHari, isoTanggalLokal, parseIso } from "@/lib/tanggal-lokal";

export type ModeKalender = "ambil" | "kembali";

/** Sama dengan batas durasi di lib/sewa.ts dan rentalaja-api. */
export const DURASI_MAKS = 60;

const TEKS = kamus({
  id: {
    pilihAmbil: "Pilih tanggal ambil",
    pilihKembali: "Pilih tanggal kembali",
    sebelumnya: "Bulan sebelumnya",
    berikutnya: "Bulan berikutnya",
    namaHari: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  },
  en: {
    pilihAmbil: "Choose a pick-up date",
    pilihKembali: "Choose a return date",
    sebelumnya: "Previous month",
    berikutnya: "Next month",
    namaHari: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
});

const awalBulan = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const tambahBulan = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const kunciBulan = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** Minggu-minggu satu bulan, Senin di kolom pertama. null = sel kosong. */
function mingguDalam(bulan: Date): (string | null)[][] {
  const kosongDepan = (bulan.getDay() + 6) % 7;
  const jumlahHari = new Date(bulan.getFullYear(), bulan.getMonth() + 1, 0).getDate();
  const sel: (string | null)[] = Array.from({ length: kosongDepan }, () => null);
  for (let h = 1; h <= jumlahHari; h++) {
    sel.push(isoTanggalLokal(new Date(bulan.getFullYear(), bulan.getMonth(), h)));
  }
  while (sel.length % 7) sel.push(null);
  return Array.from({ length: sel.length / 7 }, (_, i) => sel.slice(i * 7, i * 7 + 7));
}

function Panah({ arah }: { arah: "kiri" | "kanan" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-18"
    >
      <path d={arah === "kiri" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export default function KalenderSewa({
  ambil,
  kembali,
  mode,
  minTanggal,
  onPilih,
  onTutup,
}: {
  ambil: string;
  kembali: string;
  mode: ModeKalender;
  /** Hari ini, yyyy-mm-dd. Tanggal sebelumnya tidak bisa dipilih. */
  minTanggal: string;
  onPilih: (iso: string) => void;
  onTutup: () => void;
}) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const { formatBulan, formatLengkap } = useMemo(
    () => ({
      formatBulan: new Intl.DateTimeFormat(lokal(bahasa), { month: "long", year: "numeric" }),
      formatLengkap: new Intl.DateTimeFormat(lokal(bahasa), {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }),
    [bahasa],
  );
  const hariIni = minTanggal || isoTanggalLokal(new Date());
  const awal = (mode === "kembali" ? kembali || geserHari(ambil, 1) : ambil) || hariIni;

  const [tampil, setTampil] = useState(() => awalBulan(parseIso(awal) ?? new Date()));
  const [fokus, setFokus] = useState(awal);
  const [sorot, setSorot] = useState("");
  const wadahRef = useRef<HTMLDivElement>(null);
  // Fokus DOM hanya dipindah saat dibuka dan setelah tombol keyboard,
  // bukan saat bulan digeser lewat tombol panah dengan mouse.
  const pindahkanFokus = useRef(true);

  const batasKembali = ambil ? geserHari(ambil, DURASI_MAKS) : "";
  const nonaktif = (iso: string) =>
    iso < hariIni || (mode === "kembali" && Boolean(ambil) && iso > batasKembali);

  // Ujung rentang: tanggal kembali yang sudah dipilih, atau tanggal yang
  // sedang disorot kursor saat memilih tanggal kembali.
  const ujung =
    mode === "kembali" && sorot && ambil && sorot > ambil && !nonaktif(sorot) ? sorot : kembali;

  // Tanggal yang bisa dicapai dengan Tab. Kalau tanggal fokus tidak ada di
  // bulan yang tampil, dipakai hari pertama yang bisa dipilih di bulan itu.
  const dFokus = parseIso(fokus);
  const fokusTampil =
    dFokus && kunciBulan(dFokus) === kunciBulan(tampil)
      ? fokus
      : (mingguDalam(tampil).flat().find((iso) => iso && !nonaktif(iso)) ?? hariIni);

  useEffect(() => {
    if (!pindahkanFokus.current) return;
    const tombol = wadahRef.current?.querySelector<HTMLButtonElement>(
      `button[data-iso="${fokus}"]`,
    );
    // Tanggalnya ada di bulan lain: geser bulan dulu, efek ini jalan lagi
    // setelah render ulang.
    if (!tombol) {
      const d = parseIso(fokus);
      if (d && kunciBulan(d) !== kunciBulan(tampil)) setTampil(awalBulan(d));
      return;
    }
    tombol.focus();
    pindahkanFokus.current = false;
  }, [fokus, tampil]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onTutup();
      return;
    }
    const d = parseIso(fokus);
    if (!d || !(e.target instanceof HTMLButtonElement) || !e.target.dataset.iso) return;
    const hariKe = (d.getDay() + 6) % 7;
    const geser: Record<string, () => string> = {
      ArrowLeft: () => geserHari(fokus, -1),
      ArrowRight: () => geserHari(fokus, 1),
      ArrowUp: () => geserHari(fokus, -7),
      ArrowDown: () => geserHari(fokus, 7),
      Home: () => geserHari(fokus, -hariKe),
      End: () => geserHari(fokus, 6 - hariKe),
      PageUp: () => isoTanggalLokal(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())),
      PageDown: () => isoTanggalLokal(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())),
    };
    const hitung = geser[e.key];
    if (!hitung) return;
    e.preventDefault();
    const baru = hitung();
    if (baru < hariIni) return;
    pindahkanFokus.current = true;
    setFokus(baru);
  }

  const bisaMundur = kunciBulan(tampil) > kunciBulan(parseIso(hariIni) ?? new Date());

  return (
    <div
      ref={wadahRef}
      role="dialog"
      aria-label={mode === "ambil" ? t.pilihAmbil : t.pilihKembali}
      onKeyDown={onKeyDown}
      className="absolute top-full right-0 left-0 z-20 mt-8 rounded-b-lg border border-green-200 bg-white p-16 shadow-b-cari md:right-auto md:w-360 md:rounded-b-xl md:p-24"
    >
      <p className="text-b6-sm font-semibold text-muted-kuat md:text-b6">
        {mode === "ambil" ? t.pilihAmbil : t.pilihKembali}
      </p>
      <div className="mt-8 flex items-center justify-between gap-12">
        <p aria-live="polite" className="text-b5-sm font-bold capitalize md:text-b5">
          {formatBulan.format(tampil)}
        </p>
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setTampil((t) => tambahBulan(t, -1))}
            disabled={!bisaMundur}
            aria-label={t.sebelumnya}
            className="grid size-40 place-items-center rounded-full border border-green-200 text-ink transition-colors duration-160 ease-beranda hover:border-green-700 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-green-200 disabled:hover:text-ink"
          >
            <Panah arah="kiri" />
          </button>
          <button
            type="button"
            onClick={() => setTampil((t) => tambahBulan(t, 1))}
            aria-label={t.berikutnya}
            className="grid size-40 place-items-center rounded-full border border-green-200 text-ink transition-colors duration-160 ease-beranda hover:border-green-700 hover:text-green-700"
          >
            <Panah arah="kanan" />
          </button>
        </div>
      </div>

      <div className="mt-12" onMouseLeave={() => setSorot("")}>
        {[tampil].map((bulan) => {
          const label = formatBulan.format(bulan);
          return (
            <div key={label}>
              <div role="grid" aria-label={label}>
                <div role="row" className="grid grid-cols-7">
                  {t.namaHari.map((h) => (
                    <span
                      key={h}
                      role="columnheader"
                      className="pb-8 text-center text-b6-sm font-semibold text-muted-kuat"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {mingguDalam(bulan).map((minggu, i) => (
                  <div key={i} role="row" className="grid grid-cols-7">
                    {minggu.map((iso, j) => {
                      if (!iso) return <span key={j} role="gridcell" />;
                      const mati = nonaktif(iso);
                      const ujungAwal = iso === ambil;
                      const ujungAkhir = iso === ujung;
                      const diTengah = Boolean(ambil && ujung) && iso > ambil && iso < ujung;
                      // Pita hijau muda di belakang rentang, terpotong separuh
                      // di sel ujung supaya lingkaran tanggalnya tetap utuh.
                      const pita = diTengah
                        ? "bg-green-100"
                        : ujungAwal && ujung && ujung !== ambil
                          ? "bg-[linear-gradient(to_right,transparent_50%,var(--color-green-100)_50%)]"
                          : ujungAkhir && ambil && ujung !== ambil
                            ? "bg-[linear-gradient(to_right,var(--color-green-100)_50%,transparent_50%)]"
                            : "";
                      return (
                        <div
                          key={iso}
                          role="gridcell"
                          aria-selected={ujungAwal || ujungAkhir}
                          className={"py-2 " + pita}
                        >
                          <button
                            type="button"
                            data-iso={iso}
                            tabIndex={iso === fokusTampil ? 0 : -1}
                            disabled={mati}
                            aria-label={formatLengkap.format(parseIso(iso)!)}
                            aria-current={iso === hariIni ? "date" : undefined}
                            onClick={() => onPilih(iso)}
                            onMouseEnter={() => setSorot(iso)}
                            onFocus={() => setFokus(iso)}
                            className={
                              "mx-auto grid size-40 place-items-center rounded-full text-b6-sm tabular-nums transition-colors duration-160 ease-beranda md:size-44 md:text-b6 " +
                              (ujungAwal || ujungAkhir
                                ? "bg-green-700 font-bold text-white"
                                : mati
                                  ? "cursor-not-allowed text-muted-kuat/40"
                                  : "font-semibold text-ink hover:bg-green-100 hover:text-green-800 " +
                                    (iso === hariIni ? "ring-1 ring-green-700 ring-inset" : ""))
                            }
                          >
                            {Number(iso.slice(8))}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
