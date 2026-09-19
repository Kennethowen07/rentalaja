"use client";

// Modal Masuk dan Daftar, mengikuti pola yang lazim dipakai aplikasi lokal:
// satu kolom isian, tombol lanjut yang mati sampai isinya sah, pemisah "atau",
// lalu satu tombol masuk cepat.
//
// PENTING, ini simulasi. Tidak ada backend, tidak ada kode yang dikirim, dan
// tombol Google tidak menghubungi Google. Nomor atau email yang diketik hanya
// hidup di state komponen ini selama modal terbuka, tidak disimpan dan tidak
// dikirim ke mana pun. Kalimat itu juga ditulis di layar supaya tidak ada yang
// mengira sedang menyerahkan data sungguhan.
//
// Tidak ada isian kata sandi, sengaja: prototype tidak boleh meminta kata
// sandi sungguhan. Setelah menekan lanjut, modal menahan 4 detik seolah
// memverifikasi, lalu masuk sebagai "Akun Demo".

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

export type ModeAuth = "masuk" | "daftar";

/** Jeda sebelum masuk otomatis, meniru waktu tunggu verifikasi sungguhan. */
const JEDA_MASUK_MS = 4000;
const NAMA_AKUN = "Akun Demo";

/** Nomor ponsel Indonesia sederhana, atau email. Keduanya diterima baik saat
 *  masuk maupun daftar. */
function isianSah(nilai: string) {
  const bersih = nilai.trim();
  const nomor = bersih.replace(/[\s-]/g, "");
  const nomorSah = /^(\+62|62|0)8\d{7,11}$/.test(nomor);
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
  const [nilai, setNilai] = useState("");
  const [memproses, setMemproses] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const masuk = mode === "masuk";
  const sah = isianSah(nilai);

  // Timer dibersihkan kalau modal keburu ditutup, supaya tidak ada state yang
  // diubah setelah komponen mati.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function mulaiMasuk() {
    if (memproses) return;
    setMemproses(true);
    timerRef.current = setTimeout(() => onBerhasil(NAMA_AKUN), JEDA_MASUK_MS);
  }

  const kelasIsian =
    "mt-2 w-full rounded-input border border-line px-14 py-13 text-lead text-ink placeholder:text-placeholder disabled:bg-surface-2 disabled:text-muted";

  return (
    <Modal
      judul={masuk ? "Masuk" : "Daftar"}
      // Selama memproses, modal tidak bisa ditutup, sama seperti jendela
      // pembayaran yang sedang menunggu.
      onTutup={memproses ? () => {} : onTutup}
      lebar="max-w-[420px]"
      latar="pekat"
    >
      {/* key membuat React memasang ulang isinya setiap kali mode berganti,
          jadi animasi tukar berjalan lagi alih-alih isi lama hilang begitu
          saja. */}
      <div key={mode} className="animasi-modal-isi">
        <p className="mt-2 text-body text-muted">
          {masuk ? "Belum punya akun rentalaja?" : "Sudah punya akun rentalaja?"}{" "}
          <button
            type="button"
            disabled={memproses}
            onClick={() => onGantiMode(masuk ? "daftar" : "masuk")}
            className="text-nav-strong text-green-700 hover:underline disabled:text-muted"
          >
            {masuk ? "Daftar" : "Masuk"}
          </button>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sah) return;
            mulaiMasuk();
          }}
          className="mt-16"
        >
          <label htmlFor="identitas" className="sr-only">
            Nomor ponsel atau email
          </label>
          <input
            id="identitas"
            type="text"
            autoComplete="off"
            disabled={memproses}
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
            placeholder="Nomor ponsel atau email"
            className={kelasIsian}
          />

          <button
            type="submit"
            disabled={!sah || memproses}
            className={`mt-12 flex w-full items-center justify-center gap-10 rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
              sah && !memproses
                ? "bg-green-700 text-white hover:bg-green-800"
                : memproses
                  ? "bg-green-700/70 text-white"
                  : "bg-surface-2 text-placeholder"
            }`}
          >
            {memproses && (
              <span
                aria-hidden
                className="size-16 animate-spin rounded-pill border-2 border-white/40 border-t-white"
              />
            )}
            {memproses ? "Memverifikasi" : "Selanjutnya"}
          </button>
        </form>

        <p aria-live="polite" className="mt-8 text-body-sm text-muted">
          {memproses
            ? `Memverifikasi ${nilai.trim() || NAMA_AKUN}. Sebentar ya.`
            : "Tanpa kata sandi. Cukup nomor ponsel atau email."}
        </p>

        <div className="mt-16 flex items-center gap-12">
          <span className="h-1 flex-1 bg-line" />
          <span className="text-body-sm text-muted">atau</span>
          <span className="h-1 flex-1 bg-line" />
        </div>

        <button
          type="button"
          disabled={memproses}
          onClick={mulaiMasuk}
          className="mt-16 flex w-full items-center justify-center gap-10 rounded-input border border-line py-13 text-btn text-ink transition-colors duration-160 ease-base hover:border-green-700 disabled:text-muted"
        >
          <LogoGoogle />
          {masuk ? "Masuk dengan Google" : "Daftar dengan Google"}
        </button>

        <p className="mt-12 text-micro text-muted">
          Prototype portofolio. Tidak ada akun sungguhan, tidak ada kode yang dikirim, dan
          tombol Google tidak menghubungi Google. Apa pun yang diisi akan masuk sebagai{" "}
          {NAMA_AKUN}.
        </p>
      </div>
    </Modal>
  );
}
