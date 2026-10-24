"use client";

// Beranda v3, kotak pencarian (design-lab/approved/round-1.html).
//
// Atas permintaan pemilik proyek (25 Okt 2026) semua field mulai KOSONG dan
// hanya menampilkan placeholder ("Area antar", "Tanggal ambil", ...), dan
// kalimat "Sewa 3 hari, kembali ..." di bawah form dihapus karena
// mengganggu. Akibatnya jam ambil tidak lagi punya nilai bawaan, jadi ikut
// divalidasi seperti field lain.
//
// /cari masih membaca ?durasi= (lihat app/cari/page.tsx), jadi durasi tetap
// dikirim, dihitung dari selisih kedua tanggal.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { areaAntarOptions, jamAmbilOptions } from "@/lib/mock/areas";
import { heroStats } from "@/lib/mock/stats";

type Jenis = "motor" | "mobil";

type SearchForm = {
  jenis: Jenis;
  area: string;
  tanggalAmbil: string; // yyyy-mm-dd
  tanggalKembali: string; // yyyy-mm-dd
  jamAmbil: string; // "09.00"
};

type FieldTervalidasi = "area" | "tanggalAmbil" | "tanggalKembali" | "jamAmbil";
type Errors = Partial<Record<FieldTervalidasi, string>>;

/** Urutan fokus saat submit gagal, mengikuti urutan visual field. */
const URUTAN_FIELD: FieldTervalidasi[] = ["area", "tanggalAmbil", "tanggalKembali", "jamAmbil"];

const HARI_MS = 24 * 60 * 60 * 1000;

const formatTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** yyyy-mm-dd dari komponen tanggal LOKAL.
 *  toISOString() tidak dipakai karena bergeser ke UTC dan bisa memundurkan
 *  tanggal satu hari untuk pengguna di WITA (UTC+8). */
function isoTanggalLokal(d: Date): string {
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

function parseIso(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const tanggal = new Date(y, m - 1, d);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

function geserHari(iso: string, hari: number): string {
  const d = parseIso(iso);
  if (!d) return "";
  return isoTanggalLokal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + hari));
}

/** Jumlah hari dari ambil ke kembali. Math.round menyerap geseran satu jam
 *  kalau rentangnya melewati pergantian jam musim panas di zona pengguna. */
function selisihHari(ambil: string, kembali: string): number | null {
  const a = parseIso(ambil);
  const b = parseIso(kembali);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / HARI_MS);
}

/** "25 Okt 2026". Intl menulis "Okt." dengan titik; titiknya dibuang. */
function tampilTanggal(iso: string): string | null {
  const d = parseIso(iso);
  return d ? formatTanggal.format(d).replace(".", "") : null;
}

/** Fungsi murni, dipanggil saat render supaya pesan error selalu
 *  mencerminkan isi form saat ini. */
function hitungErrors(form: SearchForm, minTanggal: string): Errors {
  const next: Errors = {};
  if (!form.area) next.area = "Pilih area antar.";
  if (!form.tanggalAmbil) {
    next.tanggalAmbil = "Pilih tanggal ambil.";
  } else if (minTanggal && form.tanggalAmbil < minTanggal) {
    next.tanggalAmbil = "Tanggal tidak boleh di masa lalu.";
  }
  if (!form.tanggalKembali) {
    next.tanggalKembali = "Pilih tanggal kembali.";
  } else if (form.tanggalAmbil && form.tanggalKembali <= form.tanggalAmbil) {
    next.tanggalKembali = "Harus setelah tanggal ambil.";
  }
  if (!form.jamAmbil) next.jamAmbil = "Pilih jam ambil.";
  return next;
}

const IKON = {
  lokasi: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  kalender: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  kalenderCek: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9.5 15l2 2 3.5-3.5" />
    </>
  ),
  jam: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
};

function Svg({ children, className }: { children: ReactNode; className: string }) {
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
      {children}
    </svg>
  );
}

/** Bingkai satu field: ikon di kiri, kontrol di dalam, pesan error di bawah. */
function Field({
  ikon,
  error,
  errorId,
  dropdown = false,
  className = "",
  children,
}: {
  ikon: ReactNode;
  error?: string;
  errorId: string;
  dropdown?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div
        className={`relative flex h-64 items-center rounded-b-sm border-[1.5px] bg-white transition-colors duration-160 ease-beranda focus-within:border-green-700 focus-within:ring-3 focus-within:ring-green-700/20 ${
          error ? "border-error" : "border-garis-field hover:border-garis-field-hover"
        }`}
      >
        <Svg className="pointer-events-none absolute top-1/2 left-12 size-20 -translate-y-1/2 text-green-700 md:left-16">
          {ikon}
        </Svg>
        {children}
        {dropdown && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-12 size-16 -translate-y-1/2 text-muted-kuat md:right-16"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-6 text-b6-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Teks di dalam field: abu saat masih placeholder, hitam saat terisi.
 *  Di HP kedua field tanggal selebar penuh, karena "Tanggal kembali" tidak
 *  muat di field selebar setengah layar 390px. */
const kelasIsi = (terisi: boolean) =>
  `truncate text-b5-sm font-semibold whitespace-nowrap md:text-b5 ${terisi ? "text-ink" : "text-muted-kuat"}`;

const kelasSelect =
  "absolute inset-0 size-full appearance-none rounded-b-sm bg-transparent pr-36 pl-40 focus-visible:shadow-none md:pr-40 md:pl-48";

export default function SearchCard() {
  const router = useRouter();

  const [form, setForm] = useState<SearchForm>({
    jenis: "motor",
    area: "",
    tanggalAmbil: "",
    tanggalKembali: "",
    jamAmbil: "",
  });
  // Diisi setelah mount: new Date() saat render pertama akan berbeda antara
  // server dan browser (hydration mismatch).
  const [minTanggal, setMinTanggal] = useState("");
  const [sudahSubmit, setSudahSubmit] = useState(false);

  const areaRef = useRef<HTMLSelectElement>(null);
  const tanggalAmbilRef = useRef<HTMLInputElement>(null);
  const tanggalKembaliRef = useRef<HTMLInputElement>(null);
  const jamAmbilRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setMinTanggal(isoTanggalLokal(new Date()));
  }, []);

  const errors = hitungErrors(form, minTanggal);
  // Jangan tampilkan error sebelum user pernah menekan "Cari unit".
  const errorTampil: Errors = sudahSubmit ? errors : {};

  function ubahTanggalAmbil(nilai: string) {
    setForm((f) => {
      // Kalau tanggal ambil dimajukan sampai melewati tanggal kembali,
      // tanggal kembali ikut digeser supaya lama sewanya tetap sama.
      if (nilai && f.tanggalKembali && f.tanggalKembali <= nilai) {
        const lama = selisihHari(f.tanggalAmbil, f.tanggalKembali);
        const geser = lama && lama >= 1 ? lama : 1;
        return { ...f, tanggalAmbil: nilai, tanggalKembali: geserHari(nilai, geser) };
      }
      return { ...f, tanggalAmbil: nilai };
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahSubmit(true);

    const fieldGagal = URUTAN_FIELD.find((f) => errors[f]);
    if (fieldGagal) {
      // WCAG 3.3.1: pindahkan fokus ke field invalid pertama supaya
      // pengguna screen reader tahu submit gagal dan di mana letaknya.
      const ref = {
        area: areaRef,
        tanggalAmbil: tanggalAmbilRef,
        tanggalKembali: tanggalKembaliRef,
        jamAmbil: jamAmbilRef,
      }[fieldGagal];
      ref.current?.focus();
      return;
    }

    const query = new URLSearchParams({
      jenis: form.jenis,
      area: form.area,
      mulai: form.tanggalAmbil,
      jam: form.jamAmbil,
      durasi: String(selisihHari(form.tanggalAmbil, form.tanggalKembali)),
    });
    router.push(`/cari?${query.toString()}`);
  }

  const atributError = (f: FieldTervalidasi) => ({
    "aria-invalid": Boolean(errorTampil[f]),
    "aria-describedby": errorTampil[f] ? `${f}-error` : undefined,
  });

  /** Klik di mana pun pada field membuka pemilih tanggal (Chrome, Edge,
   *  Safari 16+). Browser lain tetap bisa lewat keyboard. */
  function bukaPemilih(e: React.MouseEvent<HTMLInputElement>) {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // showPicker melempar kalau dipanggil tanpa gestur pengguna.
    }
  }

  const tampilAmbil = tampilTanggal(form.tanggalAmbil);
  const tampilKembali = tampilTanggal(form.tanggalKembali);

  return (
    <div className="container-beranda relative z-2 -mt-130 md:-mt-76">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Cari unit"
        className="rounded-b-lg bg-white p-16 shadow-b-cari md:rounded-b-xl md:p-24"
      >
        <div
          role="group"
          aria-label="Jenis kendaraan"
          className="flex h-44 w-full rounded-b-sm bg-green-100 p-4 md:inline-flex md:w-auto"
        >
          {(["motor", "mobil"] as const).map((jenis) => (
            <button
              key={jenis}
              type="button"
              aria-pressed={form.jenis === jenis}
              onClick={() => setForm((f) => ({ ...f, jenis }))}
              className={`flex-1 rounded-[10px] text-b5-sm font-semibold transition-colors duration-160 ease-beranda md:w-120 md:flex-none md:text-b5 ${
                form.jenis === jenis
                  ? "bg-green-700 text-white shadow-b-1"
                  : "text-ink hover:text-green-700"
              }`}
            >
              {jenis === "motor" ? "Motor" : "Mobil"}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 items-start gap-12 md:mt-16 min-[75rem]:grid-cols-[minmax(0,1fr)_210px_210px_185px_165px]">
          <Field
            ikon={IKON.lokasi}
            dropdown
            error={errorTampil.area}
            errorId="area-error"
            className="col-span-2 min-[75rem]:col-span-1"
          >
            <label htmlFor="area" className="sr-only">
              Area antar
            </label>
            <select
              id="area"
              ref={areaRef}
              required
              value={form.area}
              {...atributError("area")}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className={`${kelasSelect} ${kelasIsi(Boolean(form.area))}`}
            >
              <option value="" disabled>
                Area antar
              </option>
              {areaAntarOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field
            ikon={IKON.kalender}
            error={errorTampil.tanggalAmbil}
            errorId="tanggalAmbil-error"
            className="col-span-2 md:col-span-1"
          >
            <span aria-hidden className={`min-w-0 pr-8 pl-40 md:pl-48 ${kelasIsi(Boolean(tampilAmbil))}`}>
              {tampilAmbil ?? "Tanggal ambil"}
            </span>
            <label htmlFor="tanggal-ambil" className="sr-only">
              Tanggal ambil
            </label>
            <input
              id="tanggal-ambil"
              ref={tanggalAmbilRef}
              type="date"
              required
              value={form.tanggalAmbil}
              min={minTanggal || undefined}
              {...atributError("tanggalAmbil")}
              onClick={bukaPemilih}
              onChange={(e) => ubahTanggalAmbil(e.target.value)}
              className="input-tanggal-tersembunyi"
            />
          </Field>

          <Field
            ikon={IKON.kalenderCek}
            error={errorTampil.tanggalKembali}
            errorId="tanggalKembali-error"
            className="col-span-2 md:col-span-1"
          >
            <span aria-hidden className={`min-w-0 pr-8 pl-40 md:pl-48 ${kelasIsi(Boolean(tampilKembali))}`}>
              {tampilKembali ?? "Tanggal kembali"}
            </span>
            <label htmlFor="tanggal-kembali" className="sr-only">
              Tanggal kembali
            </label>
            <input
              id="tanggal-kembali"
              ref={tanggalKembaliRef}
              type="date"
              required
              value={form.tanggalKembali}
              // Paling cepat sehari setelah tanggal ambil.
              min={geserHari(form.tanggalAmbil, 1) || minTanggal || undefined}
              {...atributError("tanggalKembali")}
              onClick={bukaPemilih}
              onChange={(e) => setForm((f) => ({ ...f, tanggalKembali: e.target.value }))}
              className="input-tanggal-tersembunyi"
            />
          </Field>

          <Field ikon={IKON.jam} dropdown error={errorTampil.jamAmbil} errorId="jamAmbil-error">
            <label htmlFor="jam-ambil" className="sr-only">
              Jam ambil
            </label>
            <select
              id="jam-ambil"
              ref={jamAmbilRef}
              required
              value={form.jamAmbil}
              {...atributError("jamAmbil")}
              onChange={(e) => setForm((f) => ({ ...f, jamAmbil: e.target.value }))}
              className={`${kelasSelect} ${kelasIsi(Boolean(form.jamAmbil))}`}
            >
              <option value="" disabled>
                Jam ambil
              </option>
              {jamAmbilOptions.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            className="flex h-64 items-center justify-center gap-10 rounded-b-sm bg-green-700 px-16 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800 active:bg-green-900 md:px-20 md:text-b5"
          >
            <Svg className="size-20">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" />
            </Svg>
            Cari unit
          </button>
        </div>
      </form>

      {/* Di desktop angka ini ada di hero; di HP hero terlalu sempit. */}
      <dl className="mt-20 grid grid-cols-[1fr_1.1fr_1.4fr] md:hidden">
        {heroStats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col-reverse border-l border-green-200 pr-8 pl-10 first:border-l-0 first:pl-0"
          >
            <dt className="mt-2 text-b6-sm text-muted-kuat">{s.label}</dt>
            <dd className="text-b3-sm whitespace-nowrap text-green-900 tabular-nums">
              {s.angka}
              {s.akhiran && (
                <span className="ml-2 text-b6-sm font-semibold text-muted-kuat">{s.akhiran}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
