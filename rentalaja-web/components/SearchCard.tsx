"use client";

// README section 3 + Interactions/State Management.
//
// Urutan field: Area antar, Tanggal ambil, Tanggal kembali, Jam ambil.
// Field "Durasi" dari desain awal diganti "Tanggal kembali" atas permintaan
// pemilik proyek: orang lebih mudah menyebut tanggal pulangnya daripada
// menghitung jumlah hari.
//
// /cari masih membaca ?durasi= (lihat app/cari/page.tsx), jadi durasi tetap
// dikirim, dihitung dari selisih kedua tanggal. Jam kembali mengikuti jam
// ambil, sama seperti sebelumnya.
//
// Penyimpangan sadar dari desain: desain menampilkan "12 Sep 2026" sebagai
// tanggal ambil, padahal README juga menetapkan "Tanggal tidak boleh di masa
// lalu". Default diisi hari ini, tanggal kembali tiga hari setelahnya.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { areaAntarOptions, jamAmbilOptions } from "@/lib/mock/areas";

type Jenis = "motor" | "mobil";

type SearchForm = {
  jenis: Jenis;
  area: string;
  tanggalAmbil: string; // yyyy-mm-dd
  tanggalKembali: string; // yyyy-mm-dd
  jamAmbil: string; // "09.00"
};

type FieldTervalidasi = "area" | "tanggalAmbil" | "tanggalKembali";
type Errors = Partial<Record<FieldTervalidasi, string>>;

/** Urutan fokus saat submit gagal, mengikuti urutan visual field. */
const URUTAN_FIELD: FieldTervalidasi[] = ["area", "tanggalAmbil", "tanggalKembali"];

const DURASI_AWAL = 3;
const HARI_MS = 24 * 60 * 60 * 1000;

const formatTanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
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
    next.tanggalKembali = "Tanggal kembali harus setelah tanggal ambil.";
  }
  return next;
}

const KELAS_FIELD =
  "w-full rounded-input border bg-white px-12 py-11 text-nav-strong text-ink";

export default function SearchCard() {
  const router = useRouter();

  // Kedua tanggal sengaja kosong pada render pertama. Mengisinya dengan
  // new Date() saat inisialisasi state akan menghasilkan nilai berbeda di
  // server dan di browser, yaitu hydration mismatch.
  const [form, setForm] = useState<SearchForm>({
    jenis: "motor",
    area: areaAntarOptions[0],
    tanggalAmbil: "",
    tanggalKembali: "",
    jamAmbil: "09.00",
  });
  const [minTanggal, setMinTanggal] = useState("");
  const [sudahSubmit, setSudahSubmit] = useState(false);

  const areaRef = useRef<HTMLSelectElement>(null);
  const tanggalAmbilRef = useRef<HTMLInputElement>(null);
  const tanggalKembaliRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hariIni = isoTanggalLokal(new Date());
    setMinTanggal(hariIni);
    setForm((f) =>
      f.tanggalAmbil
        ? f
        : { ...f, tanggalAmbil: hariIni, tanggalKembali: geserHari(hariIni, DURASI_AWAL) },
    );
  }, []);

  const durasi = selisihHari(form.tanggalAmbil, form.tanggalKembali);
  const kembaliSah = durasi !== null && durasi >= 1;
  const kembaliTeks = kembaliSah
    ? formatTanggalPanjang.format(parseIso(form.tanggalKembali)!)
    : null;

  const errors = hitungErrors(form, minTanggal);
  // Jangan tampilkan error sebelum user pernah menekan "Cari unit".
  const errorTampil: Errors = sudahSubmit ? errors : {};

  function ubahTanggalAmbil(nilai: string) {
    setForm((f) => {
      // Kalau tanggal ambil dimajukan sampai melewati tanggal kembali,
      // tanggal kembali ikut digeser supaya lama sewanya tetap sama, alih-alih
      // meninggalkan form dalam keadaan tidak sah.
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
      const ref =
        fieldGagal === "area"
          ? areaRef
          : fieldGagal === "tanggalAmbil"
            ? tanggalAmbilRef
            : tanggalKembaliRef;
      ref.current?.focus();
      return;
    }

    const query = new URLSearchParams({
      jenis: form.jenis,
      area: form.area,
      mulai: form.tanggalAmbil,
      jam: form.jamAmbil,
      durasi: String(durasi),
    });
    router.push(`/cari?${query.toString()}`);
  }

  const tabAktif =
    "rounded-pill bg-green-100 px-16 py-8 text-tab text-green-700";
  const tabNonaktif =
    "rounded-pill border border-line px-16 py-8 text-nav-strong text-muted";

  return (
    <div className="container-page relative z-1">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Cari unit"
        className="-mt-32 rounded-search border border-green-200 bg-white p-16 shadow-search sm:-mt-46"
      >
        {/* Tab jenis kendaraan */}
        <div
          className="mb-14 flex gap-8"
          role="group"
          aria-label="Jenis kendaraan"
        >
          {(["motor", "mobil"] as const).map((jenis) => (
            <button
              key={jenis}
              type="button"
              aria-pressed={form.jenis === jenis}
              onClick={() => setForm((f) => ({ ...f, jenis }))}
              className={form.jenis === jenis ? tabAktif : tabNonaktif}
            >
              {jenis === "motor" ? "Motor" : "Mobil"}
            </button>
          ))}
        </div>

        <div className="grid items-end gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.9fr_auto]">
          {/* Area antar */}
          <div>
            <label htmlFor="area" className="mb-6 block text-label text-muted">
              Area antar
            </label>
            <select
              id="area"
              ref={areaRef}
              required
              value={form.area}
              aria-invalid={Boolean(errorTampil.area)}
              aria-describedby={errorTampil.area ? "area-error" : undefined}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className={`${KELAS_FIELD} ${
                errorTampil.area ? "border-error" : "border-line"
              }`}
            >
              {areaAntarOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {errorTampil.area && (
              <p
                id="area-error"
                role="alert"
                className="mt-6 text-body-sm text-error"
              >
                {errorTampil.area}
              </p>
            )}
          </div>

          {/* Tanggal ambil */}
          <div>
            <label
              htmlFor="tanggal-ambil"
              className="mb-6 block text-label text-muted"
            >
              Tanggal ambil
            </label>
            <input
              id="tanggal-ambil"
              ref={tanggalAmbilRef}
              type="date"
              required
              value={form.tanggalAmbil}
              min={minTanggal || undefined}
              aria-invalid={Boolean(errorTampil.tanggalAmbil)}
              aria-describedby={
                errorTampil.tanggalAmbil ? "tanggal-ambil-error" : undefined
              }
              onChange={(e) => ubahTanggalAmbil(e.target.value)}
              className={`${KELAS_FIELD} ${
                errorTampil.tanggalAmbil ? "border-error" : "border-line"
              }`}
            />
            {errorTampil.tanggalAmbil && (
              <p
                id="tanggal-ambil-error"
                role="alert"
                className="mt-6 text-body-sm text-error"
              >
                {errorTampil.tanggalAmbil}
              </p>
            )}
          </div>

          {/* Tanggal kembali */}
          <div>
            <label
              htmlFor="tanggal-kembali"
              className="mb-6 block text-label text-muted"
            >
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
              aria-invalid={Boolean(errorTampil.tanggalKembali)}
              aria-describedby={
                errorTampil.tanggalKembali ? "tanggal-kembali-error" : undefined
              }
              onChange={(e) =>
                setForm((f) => ({ ...f, tanggalKembali: e.target.value }))
              }
              className={`${KELAS_FIELD} ${
                errorTampil.tanggalKembali ? "border-error" : "border-line"
              }`}
            />
            {errorTampil.tanggalKembali && (
              <p
                id="tanggal-kembali-error"
                role="alert"
                className="mt-6 text-body-sm text-error"
              >
                {errorTampil.tanggalKembali}
              </p>
            )}
          </div>

          {/* Jam ambil */}
          <div>
            <label
              htmlFor="jam-ambil"
              className="mb-6 block text-label text-muted"
            >
              Jam ambil
            </label>
            <select
              id="jam-ambil"
              value={form.jamAmbil}
              onChange={(e) =>
                setForm((f) => ({ ...f, jamAmbil: e.target.value }))
              }
              className={`${KELAS_FIELD} border-line`}
            >
              {jamAmbilOptions.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* <1024px tombol jatuh ke baris terakhir, full width */}
          <button
            type="submit"
            className="col-span-full w-full rounded-input bg-green-700 px-30 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800 lg:col-span-1 lg:w-auto"
          >
            Cari unit
          </button>
        </div>

        {/* Durasi tidak lagi diisi, tapi tetap disebut di sini supaya orang
            tahu berapa hari yang akan dibayar. */}
        <p aria-live="polite" className="mt-11 text-body-sm text-muted">
          {kembaliTeks ? (
            <>
              Sewa{" "}
              <strong className="text-body-strong text-ink">{durasi} hari</strong>,
              kembali{" "}
              <strong className="text-body-strong text-ink">
                {kembaliTeks} pukul {form.jamAmbil}
              </strong>
              . Hasil pencarian hanya menampilkan unit yang kosong di rentang
              itu.
            </>
          ) : (
            "Pilih tanggal ambil dan tanggal kembali untuk melihat lama sewa."
          )}
        </p>
      </form>
    </div>
  );
}
