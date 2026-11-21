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
import { masuk, masukDemo, type Akun } from "@/app/actions/akun";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";

export type ModeAuth = "masuk" | "daftar";

/** Jeda sebelum masuk otomatis, meniru waktu tunggu verifikasi sungguhan. */
const JEDA_MASUK_MS = 4000;
// Disimpan dengan nama Indonesianya; Navbar menerjemahkannya saat tampil.
const NAMA_AKUN = "Akun Demo";
const MIN_SANDI = 6;

const TEKS = kamus({
  id: {
    masuk: "Masuk",
    daftar: "Daftar",
    belumPunya: "Belum punya akun rentalaja?",
    sudahPunya: "Sudah punya akun rentalaja?",
    email: "Email",
    contohEmail: "nama@email.com",
    sandi: "Kata sandi",
    minimal: (n: number) => `Minimal ${n} karakter`,
    sembunyikan: "Sembunyikan",
    lihat: "Lihat",
    bantuanSandi:
      "Isi bebas, jangan pakai kata sandi aslimu. Isian ini tidak diperiksa dan tidak dikirim ke mana pun.",
    memverifikasi: "Memverifikasi",
    buatAkun: "Buat akun",
    memverifikasiEmail: (email: string) => `Memverifikasi ${email}. Sebentar ya.`,
    atau: "atau",
    masukGoogle: "Masuk dengan Google",
    daftarGoogle: "Daftar dengan Google",
    catatan: (akun: string) =>
      `Prototype portofolio. Tidak ada akun sungguhan, tidak ada autentikasi, dan tombol Google tidak menghubungi Google. Apa pun yang diisi akan masuk sebagai ${akun}.`,
    akunDemo: "Akun Demo",
    bantuanNyata: "Pendaftaran belum dibuka. Pakai akun demo di bawah, atau akun yang sudah terdaftar.",
    daftarBelumBuka: "Pendaftaran akun belum dibuka. Untuk mencoba, masuk dengan akun demo.",
    demoPenyewa: "Masuk sebagai penyewa demo",
    demoMitra: "Masuk sebagai mitra demo",
    catatanNyata: "Prototype portofolio. Akun demo memakai data contoh, bukan data orang sungguhan.",
    galatServer: "Server sedang tidak bisa dihubungi. Coba lagi sebentar.",
  },
  en: {
    masuk: "Log in",
    daftar: "Sign up",
    belumPunya: "Don't have a rentalaja account?",
    sudahPunya: "Already have a rentalaja account?",
    email: "Email",
    contohEmail: "name@email.com",
    sandi: "Password",
    minimal: (n: number) => `At least ${n} characters`,
    sembunyikan: "Hide",
    lihat: "Show",
    bantuanSandi:
      "Type anything, don't use your real password. This field isn't checked and isn't sent anywhere.",
    memverifikasi: "Verifying",
    buatAkun: "Create account",
    memverifikasiEmail: (email: string) => `Verifying ${email}. One moment.`,
    atau: "or",
    masukGoogle: "Log in with Google",
    daftarGoogle: "Sign up with Google",
    catatan: (akun: string) =>
      `Portfolio prototype. There are no real accounts and no authentication, and the Google button doesn't contact Google. Whatever you enter logs you in as ${akun}.`,
    akunDemo: "Demo account",
    bantuanNyata: "Sign-ups aren't open yet. Use a demo account below, or an existing account.",
    daftarBelumBuka: "Sign-ups aren't open yet. To try it out, log in with a demo account.",
    demoPenyewa: "Log in as demo renter",
    demoMitra: "Log in as demo provider",
    catatanNyata: "Portfolio prototype. Demo accounts use sample data, not real people.",
    galatServer: "The server can't be reached right now. Try again shortly.",
  },
});

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
  nyata,
  adaDemo,
  onTutup,
  onGantiMode,
  onBerhasil,
}: {
  mode: ModeAuth;
  /** true = login sungguhan lewat rentalaja-api (lihat AkunProvider). */
  nyata: boolean;
  /** Mode nyata: tampilkan tombol masuk sekali klik sebagai akun demo. */
  adaDemo: boolean;
  onTutup: () => void;
  onGantiMode: (mode: ModeAuth) => void;
  /** Mode simulasi mengirim nama akun demo; mode nyata mengirim akunnya. */
  onBerhasil: (hasil: string | Akun) => void;
}) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const masukMode = mode === "masuk";
  // Mode nyata tidak memaksakan panjang minimal: aturan kata sandi milik
  // server, dan akun yang sudah ada tidak boleh terkunci oleh aturan baru.
  const sah = emailSah(email) && (nyata ? sandi.length > 0 : sandi.length >= MIN_SANDI);

  // Timer dibersihkan kalau modal keburu ditutup, supaya tidak ada state yang
  // diubah setelah komponen mati.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** Mode nyata: kirim ke server, tampilkan galatnya kalau gagal. Kata sandi
   *  dikosongkan setelah gagal, email tetap. */
  async function jalankan(aksi: () => Promise<{ ok: true; akun: Akun } | { ok: false; pesan: string }>) {
    if (memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      const h = await aksi();
      if (h.ok) return onBerhasil(h.akun);
      setGalat(bahasa === "en" ? terjemahGalat(h.pesan) : h.pesan);
      setSandi("");
    } catch {
      setGalat(t.galatServer);
    }
    setMemproses(false);
  }

  function mulaiMasuk() {
    if (nyata) return void jalankan(() => masuk(email, sandi));
    if (memproses) return;
    setMemproses(true);
    timerRef.current = setTimeout(() => onBerhasil(NAMA_AKUN), JEDA_MASUK_MS);
  }

  const kelasIsian =
    "mt-6 w-full rounded-input border border-line px-14 py-13 text-lead text-ink placeholder:text-placeholder disabled:bg-surface-2 disabled:text-muted";
  const kelasTombolKedua =
    "mt-12 flex w-full items-center justify-center gap-10 rounded-input border border-line py-13 text-btn text-ink transition-colors duration-160 ease-base hover:border-green-700 disabled:text-muted";

  // Mode nyata belum punya pendaftaran: layar Daftar hanya memberi tahu itu.
  if (nyata && !masukMode) {
    return (
      <Modal judul={t.daftar} onTutup={onTutup} lebar="max-w-[420px]" latar="pekat">
        <div key={mode} className="animasi-modal-isi">
          <p className="mt-2 text-body text-muted">{t.daftarBelumBuka}</p>
          <button
            type="button"
            onClick={() => onGantiMode("masuk")}
            className="mt-16 flex w-full items-center justify-center rounded-input bg-green-700 py-13 text-btn text-white hover:bg-green-800"
          >
            {t.masuk}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      judul={masukMode ? t.masuk : t.daftar}
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
          {masukMode ? t.belumPunya : t.sudahPunya}{" "}
          <button
            type="button"
            disabled={memproses}
            onClick={() => onGantiMode(masukMode ? "daftar" : "masuk")}
            className="text-nav-strong text-green-700 hover:underline disabled:text-muted"
          >
            {masukMode ? t.daftar : t.masuk}
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
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete={nyata ? "email" : "off"}
            disabled={memproses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.contohEmail}
            className={kelasIsian}
          />

          <label htmlFor="sandi" className="mt-14 block text-label text-ink">
            {t.sandi}
          </label>
          <div className="relative">
            <input
              id="sandi"
              type={lihatSandi ? "text" : "password"}
              // Simulasi: off, isiannya tidak dipakai, jadi jangan sampai
              // pengelola kata sandi menawarkan menyimpannya.
              autoComplete={nyata ? "current-password" : "off"}
              disabled={memproses}
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              placeholder={nyata ? "" : t.minimal(MIN_SANDI)}
              aria-describedby="bantuan-sandi"
              aria-invalid={galat ? true : undefined}
              className={`${kelasIsian} pr-64`}
            />
            <button
              type="button"
              disabled={memproses}
              onClick={() => setLihatSandi((v) => !v)}
              className="absolute top-6 right-0 bottom-0 px-14 text-link-sm text-green-700 hover:underline disabled:text-muted"
            >
              {lihatSandi ? t.sembunyikan : t.lihat}
            </button>
          </div>
          <p id="bantuan-sandi" className="mt-6 text-body-sm text-muted">
            {nyata ? t.bantuanNyata : t.bantuanSandi}
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
            {memproses ? t.memverifikasi : masukMode ? t.masuk : t.buatAkun}
          </button>
        </form>

        {/* Hanya emailnya yang disebut, kata sandi tidak pernah ditampilkan
            ulang di mana pun. */}
        <p
          aria-live="polite"
          role={galat ? "alert" : undefined}
          className={`mt-8 text-body-sm ${galat ? "text-red-700" : "text-muted"}`}
        >
          {galat ?? (memproses && email ? t.memverifikasiEmail(email.trim()) : "")}
        </p>

        {(!nyata || adaDemo) && (
          <div className="mt-12 flex items-center gap-12">
            <span className="h-1 flex-1 bg-line" />
            <span className="text-body-sm text-muted">{t.atau}</span>
            <span className="h-1 flex-1 bg-line" />
          </div>
        )}

        {nyata ? (
          adaDemo && (
            <>
              <button
                type="button"
                disabled={memproses}
                onClick={() => jalankan(() => masukDemo("PENYEWA"))}
                className={kelasTombolKedua}
              >
                {t.demoPenyewa}
              </button>
              <button
                type="button"
                disabled={memproses}
                onClick={() => jalankan(() => masukDemo("MITRA"))}
                className={kelasTombolKedua}
              >
                {t.demoMitra}
              </button>
            </>
          )
        ) : (
          <button type="button" disabled={memproses} onClick={mulaiMasuk} className={`${kelasTombolKedua} mt-16`}>
            <LogoGoogle />
            {masukMode ? t.masukGoogle : t.daftarGoogle}
          </button>
        )}

        <p className="mt-12 text-micro text-muted">{nyata ? t.catatanNyata : t.catatan(t.akunDemo)}</p>
      </div>
    </Modal>
  );
}

/** Pesan galat dari server berbahasa Indonesia; untuk halaman /en
 *  diterjemahkan di sini. Pesan yang tidak dikenal tampil apa adanya. */
function terjemahGalat(pesan: string): string {
  const peta: Record<string, string> = {
    "Email atau kata sandi salah.": "Incorrect email or password.",
    "Server sedang tidak bisa dihubungi. Coba lagi sebentar.": "The server can't be reached right now. Try again shortly.",
    "Akun demo belum disiapkan di situs ini.": "Demo accounts aren't set up on this site.",
    "Login sungguhan belum aktif di situs ini.": "Real login isn't enabled on this site.",
  };
  return peta[pesan] ?? pesan;
}
