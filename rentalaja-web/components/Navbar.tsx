"use client";

// README section 1 + Responsive: sticky sejak scroll 0, tinggi 60px.
// Di bawah 640px nav diganti hamburger + drawer.
//
// Struktur: HANYA DUA anak langsung yang terlihat di tiap breakpoint —
// wordmark di kiri, satu grup di kanan. Versi sebelumnya punya tiga anak
// dengan justify-between, yang membuat blok link melayang di tengah
// navbar alih-alih menempel di kanan bersama Masuk/Daftar.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthModal, { type ModeAuth, type Peran } from "@/components/auth/AuthModal";

const navLinks = [
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "Jadi penyedia", href: "#jadi-penyedia" },
  { label: "Bantuan", href: "#faq" },
];

export default function Navbar() {
  const [drawerTerbuka, setDrawerTerbuka] = useState(false);
  // Masuk dan daftar hanya simulasi, jadi akunnya cukup hidup di state
  // navbar. Lihat catatan di components/auth/AuthModal.tsx.
  const [modeAuth, setModeAuth] = useState<ModeAuth | null>(null);
  const [akun, setAkun] = useState<{ nama: string; peran: Peran } | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Navbar ini juga dirender di /cari dan /unit/[slug], jadi status aktif
  // harus mengikuti rute sebenarnya, bukan di-hardcode ke "Sewa".
  const pathname = usePathname();
  const router = useRouter();
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
      <div className="container-page flex h-60 items-stretch justify-between">
        <Link
          href="/"
          className="flex items-center text-wordmark text-green-700"
        >
          rentalaja
        </Link>

        <div className="hidden items-stretch gap-26 sm:flex">
          <nav
            aria-label="Navigasi utama"
            className="flex items-stretch gap-26"
          >
            {/* Link aktif ditandai underline 2px #0F6B4F */}
            <Link
              href="/"
              aria-current={diBeranda ? "page" : undefined}
              className={`flex items-center text-nav-strong text-ink transition-colors duration-160 ease-base hover:text-green-700 ${
                diBeranda ? "border-b-2 border-green-700" : ""
              }`}
            >
              Sewa
            </Link>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex items-center text-nav text-ink transition-colors duration-160 ease-base hover:text-green-700"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-10 flex items-center gap-10">
            {akun ? (
              <>
                <span className="max-w-160 truncate text-nav text-muted">
                  {akun.nama}
                  {akun.peran === "mitra" ? " · Mitra" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setAkun(null)}
                  className="rounded-input border border-line px-16 py-9 text-nav-strong text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:text-green-700"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModeAuth("masuk")}
                  className="text-nav-strong text-ink transition-colors duration-160 ease-base hover:text-green-700"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setModeAuth("daftar")}
                  className="rounded-input bg-green-700 px-16 py-9 text-nav-strong text-white transition-colors duration-160 ease-base hover:bg-green-800"
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
          className="my-auto grid size-44 place-items-center rounded-input sm:hidden"
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
          className="container-page flex flex-col border-t border-green-200 pt-8 pb-16 sm:hidden"
        >
          <Link
            href="/"
            aria-current={diBeranda ? "page" : undefined}
            onClick={tutupDrawer}
            className={`flex min-h-44 items-center text-nav-strong ${
              diBeranda ? "text-green-700" : "text-ink"
            }`}
          >
            Sewa
          </Link>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={tutupDrawer}
              className="flex min-h-44 items-center text-nav text-ink"
            >
              {l.label}
            </a>
          ))}
          {akun ? (
            <>
              <span className="flex min-h-44 items-center text-nav text-muted">
                {akun.nama}
                {akun.peran === "mitra" ? " · Mitra" : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAkun(null);
                  tutupDrawer();
                }}
                className="mt-8 grid min-h-44 place-items-center rounded-input border border-line text-nav-strong text-ink"
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
                className="flex min-h-44 items-center text-nav-strong text-ink"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerTerbuka(false);
                  setModeAuth("daftar");
                }}
                className="mt-8 grid min-h-44 place-items-center rounded-input bg-green-700 text-nav-strong text-white"
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
          onBerhasil={(identitas, peran) => {
            setAkun({ nama: identitas, peran });
            setModeAuth(null);
            // Mitra langsung dibawa ke panelnya, penyewa tetap di halaman.
            if (peran === "mitra") router.push("/mitra");
          }}
        />
      )}
    </header>
  );
}
