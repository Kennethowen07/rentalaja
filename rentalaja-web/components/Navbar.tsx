"use client";

// README section 1 + Responsive: sticky sejak scroll 0, tinggi 60px.
// Di bawah 640px nav diganti hamburger + drawer.

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "Jadi penyedia", href: "#jadi-penyedia" },
  { label: "Bantuan", href: "#faq" },
];

export default function Navbar() {
  const [drawerTerbuka, setDrawerTerbuka] = useState(false);

  return (
    <header className="sticky top-0 z-5 border-b border-green-200 bg-white/94 backdrop-blur-[8px]">
      <div className="container-page flex h-60 items-stretch justify-between">
        <Link
          href="/"
          className="flex items-center text-wordmark text-green-700"
        >
          rentalaja
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-stretch gap-26 sm:flex"
        >
          {/* "Sewa" = link aktif, ditandai underline 2px #0F6B4F */}
          <Link
            href="/"
            aria-current="page"
            className="flex items-center border-b-2 border-green-700 text-nav-strong text-ink"
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

        <div className="ml-10 hidden items-center gap-10 sm:flex">
          <a
            href="#masuk"
            className="text-nav-strong text-ink transition-colors duration-160 ease-base hover:text-green-700"
          >
            Masuk
          </a>
          <a
            href="#daftar"
            className="rounded-input bg-green-700 px-16 py-9 text-nav-strong text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            Daftar
          </a>
        </div>

        {/* Target sentuh 44px sesuai README/Accessibility */}
        <button
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
            aria-current="page"
            onClick={() => setDrawerTerbuka(false)}
            className="flex min-h-44 items-center text-nav-strong text-green-700"
          >
            Sewa
          </Link>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setDrawerTerbuka(false)}
              className="flex min-h-44 items-center text-nav text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#masuk"
            onClick={() => setDrawerTerbuka(false)}
            className="flex min-h-44 items-center text-nav-strong text-ink"
          >
            Masuk
          </a>
          <a
            href="#daftar"
            onClick={() => setDrawerTerbuka(false)}
            className="mt-8 grid min-h-44 place-items-center rounded-input bg-green-700 text-nav-strong text-white"
          >
            Daftar
          </a>
        </nav>
      )}
    </header>
  );
}
