"use client";

// Modal Masuk dan Daftar, mengikuti pola yang lazim dipakai aplikasi lokal:
// satu kolom isian, tombol lanjut yang mati sampai isinya sah, pemisah "atau",
// lalu satu tombol masuk cepat.
//
// PENTING, ini simulasi. Tidak ada backend, tidak ada SMS yang dikirim, dan
// tombol Google tidak menghubungi Google. Nomor yang diketik hanya hidup di
// state komponen ini selama modal terbuka, tidak disimpan dan tidak dikirim
// ke mana pun. Kalimat itu juga ditulis di layar supaya tidak ada yang
// mengira sedang menyerahkan data sungguhan.
//
// Tidak ada isian kata sandi, sengaja: alurnya nomor ponsel lalu kode, sama
// seperti kebanyakan aplikasi Indonesia, dan prototype tidak boleh meminta
// kata sandi sungguhan.

import { useState } from "react";
import Modal from "@/components/ui/Modal";

export type ModeAuth = "masuk" | "daftar";

const KODE_DEMO = "1234";

/** Nomor ponsel Indonesia sederhana, atau email kalau sedang masuk. */
function isianSah(nilai: string, mode: ModeAuth) {
  const bersih = nilai.trim();
  const nomor = bersih.replace(/[\s-]/g, "");
  const nomorSah = /^(\+62|62|0)8\d{7,11}$/.test(nomor);
  if (mode === "daftar") return nomorSah;
  return nomorSah || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(bersih);
}

function LogoGoogle() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="size-18 shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function AuthModal({
  mode,
  onTutup,
  onGantiMode,
  onBerhasil,
}: {
  mode: ModeAuth;
  onTutup: () => void;
  onGantiMode: (mode: ModeAuth) => void;
  onBerhasil: (identitas: string) => void;
}) {
  const [tahap, setTahap] = useState<"isian" | "kode">("isian");
  const [nilai, setNilai] = useState("");
  const [kode, setKode] = useState("");
  const [salah, setSalah] = useState(false);

  const masuk = mode === "masuk";
  const sah = isianSah(nilai, mode);
  const kelasIsian =
    "mt-2 w-full rounded-input border border-line px-14 py-13 text-lead text-ink placeholder:text-placeholder";

  function gantiMode(tujuan: ModeAuth) {
    setTahap("isian");
    setKode("");
    setSalah(false);
    onGantiMode(tujuan);
  }

  return (
    <Modal judul={masuk ? "Masuk" : "Daftar"} onTutup={onTutup} lebar="max-w-[420px]">
      {tahap === "isian" ? (
        <>
          <p className="mt-2 text-body text-muted">
            {masuk ? "Belum punya akun rentalaja?" : "Sudah punya akun rentalaja?"}{" "}
            <button
              type="button"
              onClick={() => gantiMode(masuk ? "daftar" : "masuk")}
              className="text-nav-strong text-green-700 hover:underline"
            >
              {masuk ? "Daftar" : "Masuk"}
            </button>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sah) return;
              setTahap("kode");
            }}
            className="mt-16"
          >
            <label htmlFor="identitas" className="sr-only">
              {masuk ? "Nomor ponsel atau email" : "Nomor ponsel"}
            </label>
            <input
              id="identitas"
              type="text"
              inputMode={masuk ? "text" : "tel"}
              autoComplete="off"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              placeholder={masuk ? "Nomor ponsel atau email" : "Nomor ponsel"}
              className={kelasIsian}
            />

            <button
              type="submit"
              disabled={!sah}
              className={`mt-12 w-full rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
                sah ? "bg-green-700 text-white hover:bg-green-800" : "bg-surface-2 text-placeholder"
              }`}
            >
              Selanjutnya
            </button>
          </form>

          <div className="mt-16 flex items-center gap-12">
            <span className="h-1 flex-1 bg-line" />
            <span className="text-body-sm text-muted">atau</span>
            <span className="h-1 flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => onBerhasil("Akun demo Google")}
            className="mt-16 flex w-full items-center justify-center gap-10 rounded-input border border-line py-13 text-btn text-ink transition-colors duration-160 ease-base hover:border-green-700"
          >
            <LogoGoogle />
            {masuk ? "Masuk dengan Google" : "Daftar dengan Google"}
          </button>

          <p className="mt-12 text-micro text-muted">
            Prototype portofolio. Tidak ada akun sungguhan, tidak ada SMS yang dikirim, dan
            tombol Google tidak menghubungi Google.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-body text-muted">
            Masukkan kode verifikasi untuk <span className="text-body-strong">{nilai}</span>.{" "}
            <button
              type="button"
              onClick={() => {
                setTahap("isian");
                setKode("");
                setSalah(false);
              }}
              className="text-nav-strong text-green-700 hover:underline"
            >
              Ganti
            </button>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (kode.trim() !== KODE_DEMO) {
                setSalah(true);
                return;
              }
              onBerhasil(nilai.trim());
            }}
            className="mt-16"
          >
            <label htmlFor="kode" className="sr-only">
              Kode verifikasi
            </label>
            <input
              id="kode"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={kode}
              onChange={(e) => {
                setKode(e.target.value);
                setSalah(false);
              }}
              placeholder="4 digit"
              aria-describedby="bantuan-kode"
              aria-invalid={salah}
              className={`${kelasIsian} tracking-[0.4em]`}
            />

            <p
              id="bantuan-kode"
              aria-live="polite"
              className={`mt-8 text-body-sm ${salah ? "text-error" : "text-muted"}`}
            >
              {salah
                ? `Kode salah. Untuk simulasi ini kodenya ${KODE_DEMO}.`
                : `Tidak ada SMS yang dikirim. Kode simulasinya ${KODE_DEMO}.`}
            </p>

            <button
              type="submit"
              disabled={kode.trim().length !== 4}
              className={`mt-12 w-full rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
                kode.trim().length === 4
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-surface-2 text-placeholder"
              }`}
            >
              {masuk ? "Masuk" : "Buat akun"}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}
