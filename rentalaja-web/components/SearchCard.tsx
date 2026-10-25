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
//
// Kedua field tanggal membuka KalenderSewa, kalender buatan sendiri yang
// menggantikan input tanggal bawaan browser (25 Okt 2026). Field area
// membuka PanelArea: daftar area plus "Pilih di peta" yang mendeteksi area
// terdekat dari pin. Field jam membuka PanelJam, juga pengganti <select>.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import KalenderSewa, { DURASI_MAKS, type ModeKalender } from "@/components/KalenderSewa";
import PanelArea from "@/components/PanelArea";
import PanelJam from "@/components/PanelJam";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, lokal, type Bahasa } from "@/lib/i18n";
import { heroStats } from "@/lib/mock/stats";
import { isoTanggalLokal, parseIso, selisihHari } from "@/lib/tanggal-lokal";

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

const TEKS = kamus({
  id: {
    errArea: "Pilih area antar.",
    errAmbil: "Pilih tanggal ambil.",
    errLampau: "Tanggal tidak boleh di masa lalu.",
    errKembali: "Pilih tanggal kembali.",
    errUrutan: "Harus setelah tanggal ambil.",
    errJam: "Pilih jam ambil.",
    cariUnit: "Cari unit",
    jenis: "Jenis kendaraan",
    motor: "Motor",
    mobil: "Mobil",
    area: "Area antar",
    ambil: "Tanggal ambil",
    kembali: "Tanggal kembali",
    jam: "Jam ambil",
    jamPendek: "Jam ambil",
  },
  en: {
    errArea: "Choose a delivery area.",
    errAmbil: "Choose a pick-up date.",
    errLampau: "The date can't be in the past.",
    errKembali: "Choose a return date.",
    errUrutan: "Must be after the pick-up date.",
    errJam: "Choose a pick-up time.",
    cariUnit: "Search",
    jenis: "Vehicle type",
    motor: "Scooter",
    mobil: "Car",
    area: "Delivery area",
    ambil: "Pick-up date",
    kembali: "Return date",
    jam: "Pick-up time",
    // "Pick-up time" terpotong di field jam yang sempit (148px di desktop).
    jamPendek: "Time",
  },
});
type Teks = (typeof TEKS)["id"];

/** "25 Okt 2026" / "25 Oct 2026". Intl menulis "Okt." dengan titik; titiknya dibuang. */
function tampilTanggal(iso: string, bahasa: Bahasa): string | null {
  const d = parseIso(iso);
  if (!d) return null;
  const format = new Intl.DateTimeFormat(lokal(bahasa), { day: "numeric", month: "short", year: "numeric" });
  return format.format(d).replace(".", "");
}

/** Fungsi murni, dipanggil saat render supaya pesan error selalu
 *  mencerminkan isi form saat ini. */
function hitungErrors(form: SearchForm, minTanggal: string, t: Teks): Errors {
  const next: Errors = {};
  if (!form.area) next.area = t.errArea;
  if (!form.tanggalAmbil) {
    next.tanggalAmbil = t.errAmbil;
  } else if (minTanggal && form.tanggalAmbil < minTanggal) {
    next.tanggalAmbil = t.errLampau;
  }
  if (!form.tanggalKembali) {
    next.tanggalKembali = t.errKembali;
  } else if (form.tanggalAmbil && form.tanggalKembali <= form.tanggalAmbil) {
    next.tanggalKembali = t.errUrutan;
  }
  if (!form.jamAmbil) next.jamAmbil = t.errJam;
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
  aktif = false,
  className = "",
  children,
}: {
  ikon: ReactNode;
  error?: string;
  errorId: string;
  dropdown?: boolean;
  /** Kalender untuk field ini sedang terbuka. */
  aktif?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div
        className={`relative flex h-64 items-center rounded-b-sm border-[1.5px] bg-white transition-colors duration-160 ease-beranda focus-within:border-green-700 focus-within:ring-3 focus-within:ring-green-700/20 ${
          aktif
            ? "border-green-700 ring-3 ring-green-700/20"
            : error
              ? "border-error"
              : "border-garis-field hover:border-garis-field-hover"
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

export default function SearchCard() {
  const router = useRouter();
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];

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

  const [kalender, setKalender] = useState<ModeKalender | null>(null);

  const [areaTerbuka, setAreaTerbuka] = useState(false);
  const areaRef = useRef<HTMLButtonElement>(null);
  const areaWadahRef = useRef<HTMLDivElement>(null);
  const tanggalAmbilRef = useRef<HTMLButtonElement>(null);
  const tanggalKembaliRef = useRef<HTMLButtonElement>(null);
  const [jamTerbuka, setJamTerbuka] = useState(false);
  const jamAmbilRef = useRef<HTMLButtonElement>(null);
  const jamWadahRef = useRef<HTMLDivElement>(null);
  const rentangRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMinTanggal(isoTanggalLokal(new Date()));
  }, []);

  // Klik di luar kedua field tanggal dan kalendernya menutup kalender.
  useEffect(() => {
    if (!kalender) return;
    function onPointerDown(e: PointerEvent) {
      if (!rentangRef.current?.contains(e.target as Node)) setKalender(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [kalender]);

  // Sama untuk panel area: klik di luar field area dan panelnya menutupnya.
  useEffect(() => {
    if (!areaTerbuka) return;
    function onPointerDown(e: PointerEvent) {
      if (!areaWadahRef.current?.contains(e.target as Node)) setAreaTerbuka(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [areaTerbuka]);

  // Dan untuk panel jam.
  useEffect(() => {
    if (!jamTerbuka) return;
    function onPointerDown(e: PointerEvent) {
      if (!jamWadahRef.current?.contains(e.target as Node)) setJamTerbuka(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [jamTerbuka]);

  const errors = hitungErrors(form, minTanggal, t);
  // Jangan tampilkan error sebelum user pernah menekan "Cari unit".
  const errorTampil: Errors = sudahSubmit ? errors : {};

  function tutupKalender() {
    const mode = kalender;
    setKalender(null);
    (mode === "kembali" ? tanggalKembaliRef : tanggalAmbilRef).current?.focus();
  }

  /**
   * Alur memilih rentang: tanggal ambil dulu, lalu kalender langsung meminta
   * tanggal kembali. Saat memilih tanggal kembali, tanggal yang tidak lebih
   * lambat dari tanggal ambil dianggap tanggal ambil baru.
   */
  function pilihTanggal(iso: string) {
    if (kalender === "ambil" || !form.tanggalAmbil || iso <= form.tanggalAmbil) {
      setForm((f) => {
        const lama = f.tanggalKembali ? selisihHari(iso, f.tanggalKembali) : null;
        const kembaliMasihSah = lama !== null && lama >= 1 && lama <= DURASI_MAKS;
        return { ...f, tanggalAmbil: iso, tanggalKembali: kembaliMasihSah ? f.tanggalKembali : "" };
      });
      setKalender("kembali");
      return;
    }
    setForm((f) => ({ ...f, tanggalKembali: iso }));
    setKalender(null);
    tanggalKembaliRef.current?.focus();
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
    router.push(jalur(`/cari?${query.toString()}`));
  }

  const atributError = (f: FieldTervalidasi) => ({
    "aria-invalid": Boolean(errorTampil[f]),
    "aria-describedby": errorTampil[f] ? `${f}-error` : undefined,
  });

  const tampilAmbil = tampilTanggal(form.tanggalAmbil, bahasa);
  const tampilKembali = tampilTanggal(form.tanggalKembali, bahasa);
  const tampilJam = form.jamAmbil && bahasa === "en" ? form.jamAmbil.replace(".", ":") : form.jamAmbil;

  return (
    <div className="container-beranda relative z-2 -mt-130 md:-mt-76">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t.cariUnit}
        className="rounded-b-lg bg-white p-16 shadow-b-cari md:rounded-b-xl md:p-24"
      >
        <div
          role="group"
          aria-label={t.jenis}
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
              {jenis === "motor" ? t.motor : t.mobil}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 items-start gap-12 md:mt-16 min-[75rem]:grid-cols-[minmax(0,1fr)_--spacing(560)_--spacing(185)_--spacing(165)]">
          <div ref={areaWadahRef} className="relative col-span-2 min-[75rem]:col-span-1">
            <Field
              ikon={IKON.lokasi}
              dropdown
              error={errorTampil.area}
              errorId="area-error"
              aktif={areaTerbuka}
            >
              <button
                type="button"
                id="area"
                ref={areaRef}
                aria-haspopup="dialog"
                aria-expanded={areaTerbuka}
                aria-label={form.area ? `${t.area}, ${form.area}` : t.area}
                {...atributError("area")}
                onClick={() => {
                  setKalender(null);
                  setJamTerbuka(false);
                  setAreaTerbuka((t) => !t);
                }}
                className={`absolute inset-0 rounded-b-sm pr-36 pl-40 text-left focus-visible:shadow-none md:pr-40 md:pl-48 ${kelasIsi(Boolean(form.area))}`}
              >
                {form.area || t.area}
              </button>
            </Field>
            {areaTerbuka && (
              <PanelArea
                nilai={form.area}
                onPilih={(area) => {
                  setForm((f) => ({ ...f, area }));
                  setAreaTerbuka(false);
                  areaRef.current?.focus();
                }}
                onTutup={() => {
                  setAreaTerbuka(false);
                  areaRef.current?.focus();
                }}
              />
            )}
          </div>

          {/* Kedua field tanggal satu wadah, supaya kalender bisa menempel
              di bawah keduanya dan klik di dalamnya tidak dianggap klik luar. */}
          <div
            ref={rentangRef}
            className="relative col-span-2 grid items-start gap-12 md:grid-cols-2 min-[75rem]:col-span-1"
          >
            <Field
              ikon={IKON.kalender}
              error={errorTampil.tanggalAmbil}
              errorId="tanggalAmbil-error"
              aktif={kalender === "ambil"}
            >
              <button
                type="button"
                id="tanggal-ambil"
                ref={tanggalAmbilRef}
                aria-haspopup="dialog"
                aria-expanded={kalender === "ambil"}
                aria-label={tampilAmbil ? `${t.ambil}, ${tampilAmbil}` : t.ambil}
                {...atributError("tanggalAmbil")}
                onClick={() => {
                  setAreaTerbuka(false);
                  setJamTerbuka(false);
                  setKalender((k) => (k === "ambil" ? null : "ambil"));
                }}
                className={`absolute inset-0 rounded-b-sm pr-8 pl-40 text-left focus-visible:shadow-none md:pl-48 ${kelasIsi(Boolean(tampilAmbil))}`}
              >
                {tampilAmbil ?? t.ambil}
              </button>
            </Field>

            <Field
              ikon={IKON.kalenderCek}
              error={errorTampil.tanggalKembali}
              errorId="tanggalKembali-error"
              aktif={kalender === "kembali"}
            >
              <button
                type="button"
                id="tanggal-kembali"
                ref={tanggalKembaliRef}
                aria-haspopup="dialog"
                aria-expanded={kalender === "kembali"}
                aria-label={tampilKembali ? `${t.kembali}, ${tampilKembali}` : t.kembali}
                {...atributError("tanggalKembali")}
                // Tanpa tanggal ambil, kalender meminta tanggal ambil dulu.
                onClick={() => {
                  setAreaTerbuka(false);
                  setJamTerbuka(false);
                  setKalender((k) =>
                    k === "kembali" ? null : form.tanggalAmbil ? "kembali" : "ambil",
                  );
                }}
                className={`absolute inset-0 rounded-b-sm pr-8 pl-40 text-left focus-visible:shadow-none md:pl-48 ${kelasIsi(Boolean(tampilKembali))}`}
              >
                {tampilKembali ?? t.kembali}
              </button>
            </Field>

            {kalender && (
              <KalenderSewa
                ambil={form.tanggalAmbil}
                kembali={form.tanggalKembali}
                mode={kalender}
                minTanggal={minTanggal}
                onPilih={pilihTanggal}
                onTutup={tutupKalender}
              />
            )}
          </div>

          <div ref={jamWadahRef} className="relative">
            <Field
              ikon={IKON.jam}
              dropdown
              error={errorTampil.jamAmbil}
              errorId="jamAmbil-error"
              aktif={jamTerbuka}
            >
              <button
                type="button"
                id="jam-ambil"
                ref={jamAmbilRef}
                aria-haspopup="listbox"
                aria-expanded={jamTerbuka}
                aria-label={tampilJam ? `${t.jam}, ${tampilJam}` : t.jam}
                {...atributError("jamAmbil")}
                onClick={() => {
                  setKalender(null);
                  setAreaTerbuka(false);
                  setJamTerbuka((t) => !t);
                }}
                className={`absolute inset-0 rounded-b-sm pr-36 pl-40 text-left focus-visible:shadow-none md:pr-40 md:pl-48 ${kelasIsi(Boolean(form.jamAmbil))}`}
              >
                {tampilJam || t.jamPendek}
              </button>
            </Field>
            {jamTerbuka && (
              <PanelJam
                nilai={form.jamAmbil}
                onPilih={(jam) => {
                  setForm((f) => ({ ...f, jamAmbil: jam }));
                  setJamTerbuka(false);
                  jamAmbilRef.current?.focus();
                }}
                onTutup={() => {
                  setJamTerbuka(false);
                  jamAmbilRef.current?.focus();
                }}
              />
            )}
          </div>

          <button
            type="submit"
            className="flex h-64 items-center justify-center gap-10 rounded-b-sm bg-green-700 px-16 text-b5-sm font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800 active:bg-green-900 md:px-20 md:text-b5"
          >
            <Svg className="size-20">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" />
            </Svg>
            {t.cariUnit}
          </button>
        </div>
      </form>

      {/* Di desktop angka ini ada di hero; di HP hero terlalu sempit. */}
      <dl className="mt-20 grid grid-cols-[1fr_1.1fr_1.4fr] md:hidden">
        {heroStats[bahasa].map((s) => (
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
