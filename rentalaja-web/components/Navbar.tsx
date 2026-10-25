"use client";

// Beranda v3 (design-lab/approved/round-1.html): sticky sejak scroll 0,
// tinggi 64px di HP dan 72px mulai 768px. Di bawah 768px nav diganti
// hamburger + drawer.
//
// Struktur: HANYA DUA anak langsung yang terlihat di tiap breakpoint —
// wordmark di kiri, satu grup di kanan. Versi sebelumnya punya tiga anak
// dengan justify-between, yang membuat blok link melayang di tengah
// navbar alih-alih menempel di kanan bersama Masuk/Daftar.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal, { type ModeAuth } from "@/components/auth/AuthModal";

// Diawali "/" supaya tetap berfungsi dari halaman selain beranda.
const navLinks = [
  { label: "Cara kerja", href: "/#cara-kerja" },
  { label: "Jadi penyedia", href: "/jadi-penyedia" },
  { label: "Bantuan", href: "/#faq" },
];

export default function Navbar() {
  const [drawerTerbuka, setDrawerTerbuka] = useState(false);
  // Masuk dan daftar hanya simulasi, jadi akunnya cukup hidup di state
  // navbar. Lihat catatan di components/auth/AuthModal.tsx.
  const [modeAuth, setModeAuth] = useState<ModeAuth | null>(null);
  const [akun, setAkun] = useState<string | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Navbar ini juga dirender di /cari dan /unit/[slug], jadi status aktif
  // harus mengikuti rute sebenarnya, bukan di-hardcode ke "Sewa".
  const pathname = usePathname();
  const diBeranda = pathname === "/";

  function tutupDrawer() {
    setDrawerTerbuka(false);
    hamburgerRef.current?.focus();
  }

  useEffect(() => {
    if (!drawerTerbuka) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerTerbuka(false);
        hamburgerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerTerbuka]);

  return (
    <header className="sticky top-0 z-5 border-b border-green-200 bg-white/94 backdrop-blur-[8px]">
      <div className="container-beranda flex h-64 items-stretch justify-between md:h-72">
        {/* alt jadi nama tautan ini bagi pembaca layar, jangan dikosongkan. */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-rentalaja.png"
            alt="rentalaja"
            width={402}
            height={240}
            preload
            className="h-34 w-auto md:h-40"
          />
        </Link>

        <div className="hidden items-stretch gap-32 md:flex">
          <nav
            aria-label="Navigasi utama"
            className="flex items-stretch gap-32"
          >
            {/* Link aktif ditandai underline 2px #0F6B4F */}
            <Link
              href="/"
              aria-current={diBeranda ? "page" : undefined}
              className={`flex items-center text-b5 font-semibold transition-colors duration-160 ease-beranda hover:text-green-700 ${
                diBeranda ? "border-b-2 border-green-700 text-green-700" : "text-ink"
              }`}
            >
              Sewa
            </Link>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={"flex items-center text-b5 transition-colors duration-160 ease-beranda hover:text-green-700 " +
                  (pathname === l.href
                    ? "border-b-2 border-green-700 font-semibold text-green-700"
                    : "font-medium text-ink")}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-16 flex items-center gap-20">
            {akun ? (
              <>
                <span className="max-w-160 truncate text-b6 text-muted-kuat">{akun}</span>
                <button
                  type="button"
                  onClick={() => setAkun(null)}
                  className="min-h-44 rounded-b-sm border border-green-200 px-20 text-b5 font-semibold text-ink transition-colors duration-160 ease-beranda hover:border-green-700 hover:text-green-700"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModeAuth("masuk")}
                  className="min-h-44 text-b5 font-semibold text-ink transition-colors duration-160 ease-beranda hover:text-green-700"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setModeAuth("daftar")}
                  className="min-h-44 rounded-b-sm bg-green-700 px-20 text-b5 font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800"
                >
                  Daftar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Target sentuh 44px sesuai README/Accessibility */}
        <button
          ref={hamburgerRef}
          type="button"
          onClick={() => setDrawerTerbuka((v) => !v)}
          aria-expanded={drawerTerbuka}
          aria-controls="menu-mobile"
          aria-label={drawerTerbuka ? "Tutup menu" : "Buka menu"}
          className="my-auto grid size-44 place-items-center rounded-xl border border-green-200 md:hidden"
        >
          <span aria-hidden className="flex flex-col gap-5">
            <span className="h-2 w-20 rounded-pill bg-ink" />
            <span className="h-2 w-20 rounded-pill bg-ink" />
            <span className="h-2 w-20 rounded-pill bg-ink" />
          </span>
        </button>
      </div>

      {drawerTerbuka && (
        <nav
          id="menu-mobile"
          aria-label="Navigasi utama"
          className="container-beranda flex flex-col border-t border-green-200 pt-8 pb-16 md:hidden"
        >
          <Link
            href="/"
            aria-current={diBeranda ? "page" : undefined}
            onClick={tutupDrawer}
            className={`flex min-h-56 items-center border-b border-green-200 text-b4-sm font-semibold ${
              diBeranda ? "text-green-700" : "text-ink"
            }`}
          >
            Sewa
          </Link>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              onClick={tutupDrawer}
              className={"flex min-h-56 items-center border-b border-green-200 text-b4-sm font-semibold " +
                (pathname === l.href ? "text-green-700" : "text-ink")}
            >
              {l.label}
            </a>
          ))}
          {akun ? (
            <>
              <span className="flex min-h-56 items-center text-b5-sm text-muted-kuat">{akun}</span>
              <button
                type="button"
                onClick={() => {
                  setAkun(null);
                  tutupDrawer();
                }}
                className="mt-16 grid min-h-52 place-items-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setDrawerTerbuka(false);
                  setModeAuth("masuk");
                }}
                className="mt-16 grid min-h-52 place-items-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerTerbuka(false);
                  setModeAuth("daftar");
                }}
                className="mt-12 grid min-h-52 place-items-center rounded-b-sm bg-green-700 text-b5-sm font-bold text-white"
              >
                Daftar
              </button>
            </>
          )}
        </nav>
      )}

      {modeAuth && (
        <AuthModal
          mode={modeAuth}
          onTutup={() => setModeAuth(null)}
          onGantiMode={setModeAuth}
          onBerhasil={(identitas) => {
            setAkun(identitas);
            setModeAuth(null);
          }}
        />
      )}
    </header>
  );
}
