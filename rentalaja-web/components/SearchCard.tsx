"use client";

// README section 3 + Interactions/State Management.
//
// Dua penyimpangan sadar dari nilai harfiah di desain, keduanya karena
// desain bertentangan dengan aturannya sendiri:
//
// 1. Desain menampilkan "12 Sep 2026" sebagai tanggal ambil, padahal README
//    juga menetapkan "Tanggal tidak boleh di masa lalu". Tanggal itu sudah
//    lewat, jadi default diisi hari ini dan "12 Sep 2026" diperlakukan
//    sebagai ilustrasi kanvas.
// 2. Desain menulis durasi "3 hari" tapi helper text menyebut kembali
//    "14 Sep" (= +2 hari). Karena helper harus dihitung live, rumus yang
//    dipakai adalah tanggalAmbil + durasiHari.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { areaAntarOptions, jamAmbilOptions } from "@/lib/mock/areas";

type Jenis = "motor" | "mobil";

type SearchForm = {
  jenis: Jenis;
  area: string;
  tanggalAmbil: string; // yyyy-mm-dd
  jamAmbil: string; // "09.00"
  durasiHari: number;
};

type Errors = Partial<Record<"area" | "tanggalAmbil" | "durasiHari", string>>;

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

function tanggalKembali(
  tanggalAmbil: string,
  durasiHari: number,
): string | null {
  const mulai = parseIso(tanggalAmbil);
  if (!mulai || !Number.isFinite(durasiHari) || durasiHari < 1) return null;
  const kembali = new Date(
    mulai.getFullYear(),
    mulai.getMonth(),
    mulai.getDate() + durasiHari,
  );
  return formatTanggalPanjang.format(kembali);
}

const KELAS_FIELD =
  "w-full rounded-input border bg-white px-12 py-11 text-nav-strong text-ink";

export default function SearchCard() {
  const router = useRouter();

  // tanggalAmbil sengaja kosong pada render pertama. Mengisinya dengan
  // new Date() saat inisialisasi state akan menghasilkan nilai berbeda di
  // server dan di browser, yaitu hydration mismatch.
  const [form, setForm] = useState<SearchForm>({
    jenis: "motor",
    area: areaAntarOptions[0],
    tanggalAmbil: "",
    jamAmbil: "09.00",
    durasiHari: 3,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [minTanggal, setMinTanggal] = useState("");

  useEffect(() => {
    const hariIni = isoTanggalLokal(new Date());
    setMinTanggal(hariIni);
    setForm((f) => (f.tanggalAmbil ? f : { ...f, tanggalAmbil: hariIni }));
  }, []);

  const kembali = tanggalKembali(form.tanggalAmbil, form.durasiHari);

  function validasi(): Errors {
    const next: Errors = {};
    if (!form.area) next.area = "Pilih area antar.";
    if (!form.tanggalAmbil) {
      next.tanggalAmbil = "Pilih tanggal ambil.";
    } else if (minTanggal && form.tanggalAmbil < minTanggal) {
      next.tanggalAmbil = "Tanggal tidak boleh di masa lalu.";
    }
    if (!Number.isFinite(form.durasiHari) || form.durasiHari < 1) {
      next.durasiHari = "Durasi minimal 1 hari.";
    }
    return next;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasil = validasi();
    setErrors(hasil);
    if (Object.keys(hasil).length > 0) return;

    const query = new URLSearchParams({
      jenis: form.jenis,
      area: form.area,
      mulai: form.tanggalAmbil,
      jam: form.jamAmbil,
      durasi: String(form.durasiHari),
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

        <div className="grid items-end gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.8fr_auto]">
          {/* Area antar */}
          <div>
            <label htmlFor="area" className="mb-6 block text-label text-muted">
              Area antar
            </label>
            <select
              id="area"
              value={form.area}
              aria-invalid={Boolean(errors.area)}
              aria-describedby={errors.area ? "area-error" : undefined}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className={`${KELAS_FIELD} ${
                errors.area ? "border-error" : "border-line"
              }`}
            >
              {areaAntarOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {errors.area && (
              <p id="area-error" className="mt-6 text-body-sm text-error">
                {errors.area}
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
              type="date"
              value={form.tanggalAmbil}
              min={minTanggal || undefined}
              aria-invalid={Boolean(errors.tanggalAmbil)}
              aria-describedby={
                errors.tanggalAmbil ? "tanggal-ambil-error" : undefined
              }
              onChange={(e) =>
                setForm((f) => ({ ...f, tanggalAmbil: e.target.value }))
              }
              className={`${KELAS_FIELD} ${
                errors.tanggalAmbil ? "border-error" : "border-line"
              }`}
            />
            {errors.tanggalAmbil && (
              <p
                id="tanggal-ambil-error"
                className="mt-6 text-body-sm text-error"
              >
                {errors.tanggalAmbil}
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

          {/* Durasi */}
          <div>
            <label
              htmlFor="durasi"
              className="mb-6 block text-label text-muted"
            >
              Durasi
            </label>
            <div className="relative">
              <input
                id="durasi"
                type="number"
                min={1}
                inputMode="numeric"
                value={Number.isFinite(form.durasiHari) ? form.durasiHari : ""}
                aria-invalid={Boolean(errors.durasiHari)}
                aria-describedby={errors.durasiHari ? "durasi-error" : undefined}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    durasiHari: Number.parseInt(e.target.value, 10),
                  }))
                }
                className={`${KELAS_FIELD} pr-44 ${
                  errors.durasiHari ? "border-error" : "border-line"
                }`}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2 text-nav-strong text-ink"
              >
                hari
              </span>
            </div>
            {errors.durasiHari && (
              <p id="durasi-error" className="mt-6 text-body-sm text-error">
                {errors.durasiHari}
              </p>
            )}
          </div>

          {/* <1024px tombol jatuh ke baris terakhir, full width */}
          <button
            type="submit"
            className="col-span-full w-full rounded-input bg-green-700 px-30 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800 lg:col-span-1 lg:w-auto"
          >
            Cari unit
          </button>
        </div>

        <p aria-live="polite" className="mt-11 text-body-sm text-muted">
          {kembali ? (
            <>
              Kembali{" "}
              <strong className="text-body-strong text-ink">
                {kembali} pukul {form.jamAmbil}
              </strong>
              . Hasil pencarian hanya menampilkan unit yang kosong di rentang
              itu.
            </>
          ) : (
            "Lengkapi tanggal ambil dan durasi untuk melihat tanggal kembali."
          )}
        </p>
      </form>
    </div>
  );
}
