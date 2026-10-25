"use client";

// Beranda v3 (design-lab/approved/round-1.html): sticky sejak scroll 0,
// tinggi 64px di HP dan 72px mulai 768px. Di bawah 768px nav diganti
// hamburger + drawer.
//
// Struktur: HANYA DUA anak langsung yang terlihat di tiap breakpoint —
// wordmark di kiri, satu grup di kanan. Versi sebelumnya punya tiga anak
// dengan justify-between, yang membuat blok link melayang di tengah
// navbar alih-alih menempel di kanan bersama Masuk/Daftar.
//
// Tombol ID | EN membuka halaman yang sama di bahasa lain (lihat
// lib/i18n.ts); query ikut dibawa supaya tanggal dan unit tidak hilang.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import { BAHASA, gantiBahasa, kamus } from "@/lib/i18n";

const TEKS = kamus({
  id: {
    sewa: "Sewa",
    caraKerja: "Cara kerja",
    jadiPenyedia: "Jadi penyedia",
    bantuan: "Bantuan",
    navUtama: "Navigasi utama",
    riwayatChat: "Riwayat chat",
    chat: "Chat",
    keluar: "Keluar",
    masuk: "Masuk",
    daftar: "Daftar",
    bukaMenu: "Buka menu",
    tutupMenu: "Tutup menu",
    akunDemo: "Akun Demo",
    bahasa: "Bahasa",
  },
  en: {
    sewa: "Rent",
    caraKerja: "How it works",
    jadiPenyedia: "Become a provider",
    bantuan: "Help",
    navUtama: "Main navigation",
    riwayatChat: "Chat history",
    chat: "Chat",
    keluar: "Log out",
    masuk: "Log in",
    daftar: "Sign up",
    bukaMenu: "Open menu",
    tutupMenu: "Close menu",
    akunDemo: "Demo account",
    bahasa: "Language",
  },
});

/** Akun demo tersimpan dengan nama Indonesianya; tampilannya ikut bahasa. */
function namaAkun(akun: string, akunDemo: string) {
  return akun === "Akun Demo" ? akunDemo : akun;
}

/** Ikon balon chat, menuju riwayat chat. Hanya tampil setelah masuk. */
function IkonChat() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" />
    </svg>
  );
}

/** Pilihan ID | EN: tautan ke halaman yang sama di bahasa lain. */
function PilihBahasa({ label, besar = false }: { label: string; besar?: boolean }) {
  const { bahasa } = useBahasa();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={label} className="flex items-center rounded-pill border border-green-200 p-3">
      {BAHASA.map((b) => {
        const href = gantiBahasa(pathname, b);
        const aktif = b === bahasa;
        return (
          <Link
            key={b}
            href={href}
            hrefLang={b}
            lang={b}
            aria-current={aktif ? "true" : undefined}
            onClick={(e) => {
              if (aktif) {
                e.preventDefault();
                return;
              }
              // Query (tanggal, unit, tab) ikut dibawa ke bahasa lain.
              if (window.location.search) {
                e.preventDefault();
                router.push(href + window.location.search);
              }
            }}
            className={`grid place-items-center rounded-pill font-bold uppercase transition-colors duration-160 ease-beranda ${
              besar ? "h-40 w-56 text-b5-sm" : "h-32 w-40 text-b6"
            } ${aktif ? "bg-green-700 text-white" : "text-muted-kuat hover:text-green-700"}`}
          >
            {b}
          </Link>
        );
      })}
    </div>
  );
}

// Diawali "/" supaya tetap berfungsi dari halaman selain beranda.
const navLinks = [
  { kunci: "caraKerja", href: "/#cara-kerja" },
  { kunci: "jadiPenyedia", href: "/jadi-penyedia" },
  { kunci: "bantuan", href: "/#faq" },
] as const;

export default function Navbar() {
  const [drawerTerbuka, setDrawerTerbuka] = useState(false);
  // Masuk dan daftar masih simulasi; statusnya dibagi lewat AkunProvider
  // supaya tombol "Hubungi penyedia" dan /chat ikut tahu.
  const { akun, keluar, mintaMasuk } = useAkun();
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Navbar ini juga dirender di /cari dan /unit/[slug], jadi status aktif
  // harus mengikuti rute sebenarnya, bukan di-hardcode ke "Sewa".
  const pathname = usePathname();
  const diBeranda = pathname === jalur("/");
  const diChat = pathname === jalur("/chat");

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
    <header className="skala-beranda sticky top-0 z-5 border-b border-green-200 bg-white/94 backdrop-blur-[8px]">
      <div className="container-beranda flex h-64 items-stretch justify-between md:h-72">
        {/* alt jadi nama tautan ini bagi pembaca layar, jangan dikosongkan. */}
        <Link href={jalur("/")} className="flex items-center">
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
          <nav aria-label={t.navUtama} className="flex items-stretch gap-32">
            {/* Link aktif ditandai underline 2px #0F6B4F */}
            <Link
              href={jalur("/")}
              aria-current={diBeranda ? "page" : undefined}
              className={`flex items-center text-b5 font-semibold transition-colors duration-160 ease-beranda hover:text-green-700 ${
                diBeranda ? "border-b-2 border-green-700 text-green-700" : "text-ink"
              }`}
            >
              {t.sewa}
            </Link>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={jalur(l.href)}
                aria-current={pathname === jalur(l.href) ? "page" : undefined}
                className={"flex items-center text-b5 transition-colors duration-160 ease-beranda hover:text-green-700 " +
                  (pathname === jalur(l.href)
                    ? "border-b-2 border-green-700 font-semibold text-green-700"
                    : "font-medium text-ink")}
              >
                {t[l.kunci]}
              </a>
            ))}
          </nav>

          <div className="ml-16 flex items-center gap-20">
            <PilihBahasa label={t.bahasa} />
            {akun ? (
              <>
                <Link
                  href={jalur("/chat")}
                  aria-label={t.riwayatChat}
                  title={t.riwayatChat}
                  aria-current={diChat ? "page" : undefined}
                  className={`relative grid size-44 place-items-center rounded-pill transition-colors duration-160 ease-beranda hover:bg-green-100 hover:text-green-700 ${
                    diChat ? "bg-green-100 text-green-700" : "text-ink"
                  }`}
                >
                  <IkonChat />
                </Link>
                <span className="max-w-160 truncate text-b6 text-muted-kuat">{namaAkun(akun, t.akunDemo)}</span>
                <button
                  type="button"
                  onClick={keluar}
                  className="min-h-44 rounded-b-sm border border-green-200 px-20 text-b5 font-semibold text-ink transition-colors duration-160 ease-beranda hover:border-green-700 hover:text-green-700"
                >
                  {t.keluar}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => mintaMasuk("masuk")}
                  className="min-h-44 text-b5 font-semibold text-ink transition-colors duration-160 ease-beranda hover:text-green-700"
                >
                  {t.masuk}
                </button>
                <button
                  type="button"
                  onClick={() => mintaMasuk("daftar")}
                  className="min-h-44 rounded-b-sm bg-green-700 px-20 text-b5 font-bold text-white transition-colors duration-160 ease-beranda hover:bg-green-800"
                >
                  {t.daftar}
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
          aria-label={drawerTerbuka ? t.tutupMenu : t.bukaMenu}
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
          aria-label={t.navUtama}
          className="container-beranda flex flex-col border-t border-green-200 pt-8 pb-16 md:hidden"
        >
          <Link
            href={jalur("/")}
            aria-current={diBeranda ? "page" : undefined}
            onClick={tutupDrawer}
            className={`flex min-h-56 items-center border-b border-green-200 text-b4-sm font-semibold ${
              diBeranda ? "text-green-700" : "text-ink"
            }`}
          >
            {t.sewa}
          </Link>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={jalur(l.href)}
              aria-current={pathname === jalur(l.href) ? "page" : undefined}
              onClick={tutupDrawer}
              className={"flex min-h-56 items-center border-b border-green-200 text-b4-sm font-semibold " +
                (pathname === jalur(l.href) ? "text-green-700" : "text-ink")}
            >
              {t[l.kunci]}
            </a>
          ))}
          <div className="flex min-h-56 items-center justify-between border-b border-green-200">
            <span className="text-b4-sm font-semibold text-ink">{t.bahasa}</span>
            <PilihBahasa label={t.bahasa} besar />
          </div>
          {akun ? (
            <>
              <Link
                href={jalur("/chat")}
                aria-current={diChat ? "page" : undefined}
                onClick={tutupDrawer}
                className={`flex min-h-56 items-center gap-10 border-b border-green-200 text-b4-sm font-semibold ${
                  diChat ? "text-green-700" : "text-ink"
                }`}
              >
                <IkonChat />
                {t.chat}
              </Link>
              <span className="flex min-h-56 items-center text-b5-sm text-muted-kuat">{namaAkun(akun, t.akunDemo)}</span>
              <button
                type="button"
                onClick={() => {
                  keluar();
                  tutupDrawer();
                }}
                className="mt-16 grid min-h-52 place-items-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700"
              >
                {t.keluar}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setDrawerTerbuka(false);
                  mintaMasuk("masuk");
                }}
                className="mt-16 grid min-h-52 place-items-center rounded-b-sm border-[1.5px] border-green-700 text-b5-sm font-bold text-green-700"
              >
                {t.masuk}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerTerbuka(false);
                  mintaMasuk("daftar");
                }}
                className="mt-12 grid min-h-52 place-items-center rounded-b-sm bg-green-700 text-b5-sm font-bold text-white"
              >
                {t.daftar}
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
