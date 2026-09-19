"use client";

// Modal Masuk dan Daftar: email, kata sandi, lalu jeda 4 detik seolah
// memverifikasi, dan masuk sebagai "Akun Demo".
//
// PENTING, ini simulasi. Tidak ada backend dan tidak ada autentikasi. Email
// dan kata sandi yang diketik hanya hidup di state komponen ini selama modal
// terbuka: tidak disimpan, tidak dikirim ke mana pun, dan tidak pernah ikut
// dicatat di pesan mana pun. Tombol Google juga tidak menghubungi Google.
//
// Karena orang terbiasa mengetik kata sandi aslinya, layar ini menulis
// terang-terangan bahwa isiannya tidak dipakai dan menyarankan memakai kata
// sandi bebas. Itu bagian dari desainnya, jangan dihapus.

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

export type ModeAuth = "masuk" | "daftar";

/** Jeda sebelum masuk otomatis, meniru waktu tunggu verifikasi sungguhan. */
const JEDA_MASUK_MS = 4000;
const NAMA_AKUN = "Akun Demo";
const MIN_SANDI = 6;

function emailSah(nilai: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(nilai.trim());
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
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const masuk = mode === "masuk";
  const sah = emailSah(email) && sandi.length >= MIN_SANDI;

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
    "mt-6 w-full rounded-input border border-line px-14 py-13 text-lead text-ink placeholder:text-placeholder disabled:bg-surface-2 disabled:text-muted";

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
          <label htmlFor="email" className="block text-label text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="off"
            disabled={memproses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className={kelasIsian}
          />

          <label htmlFor="sandi" className="mt-14 block text-label text-ink">
            Kata sandi
          </label>
          <div className="relative">
            <input
              id="sandi"
              type={lihatSandi ? "text" : "password"}
              // Sengaja off: isian ini tidak dipakai, jadi jangan sampai
              // pengelola kata sandi menawarkan menyimpannya.
              autoComplete="off"
              disabled={memproses}
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              placeholder={`Minimal ${MIN_SANDI} karakter`}
              aria-describedby="bantuan-sandi"
              className={`${kelasIsian} pr-64`}
            />
            <button
              type="button"
              disabled={memproses}
              onClick={() => setLihatSandi((v) => !v)}
              className="absolute top-6 right-0 bottom-0 px-14 text-link-sm text-green-700 hover:underline disabled:text-muted"
            >
              {lihatSandi ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
          <p id="bantuan-sandi" className="mt-6 text-body-sm text-muted">
            Isi bebas, jangan pakai kata sandi aslimu. Isian ini tidak diperiksa dan tidak
            dikirim ke mana pun.
          </p>

          <button
            type="submit"
            disabled={!sah || memproses}
            className={`mt-14 flex w-full items-center justify-center gap-10 rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
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
            {memproses ? "Memverifikasi" : masuk ? "Masuk" : "Buat akun"}
          </button>
        </form>

        {/* Hanya emailnya yang disebut, kata sandi tidak pernah ditampilkan
            ulang di mana pun. */}
        <p aria-live="polite" className="mt-8 text-body-sm text-muted">
          {memproses ? `Memverifikasi ${email.trim()}. Sebentar ya.` : ""}
        </p>

        <div className="mt-12 flex items-center gap-12">
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
          Prototype portofolio. Tidak ada akun sungguhan, tidak ada autentikasi, dan tombol
          Google tidak menghubungi Google. Apa pun yang diisi akan masuk sebagai {NAMA_AKUN}.
        </p>
      </div>
    </Modal>
  );
}
