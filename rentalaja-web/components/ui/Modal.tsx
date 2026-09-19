"use client";

// Kerangka pop-up bersama: lapisan hitam transparan (bukan pekat) di
// belakang, dialog di tengah, tombol tutup di kanan atas. Escape dan klik di
// luar dialog menutupnya. Fokus dipindah ke tombol tutup saat terbuka dan
// dikembalikan ke elemen yang membukanya saat ditutup.
//
// Modal pembayaran di components/pemesanan/BookingForm.tsx belum memakai ini
// karena ia punya keadaan "sedang memproses" yang tidak boleh ditutup.
//
// Dirender lewat portal ke <body>. Tanpa itu, lapisan gelapnya bisa terkurung:
// elemen dengan backdrop-filter, seperti navbar sticky, menjadi acuan baru
// untuk anak yang position: fixed, jadi overlay hanya menutupi kotak navbar
// alih-alih seluruh layar.

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  judul,
  onTutup,
  lebar = "max-w-[340px]",
  latar = "biasa",
  children,
}: {
  judul: string;
  onTutup: () => void;
  /** Kelas lebar maksimum dialog, ditulis utuh supaya Tailwind menemukannya. */
  lebar?: string;
  /** "pekat" untuk dialog yang menuntut perhatian penuh, misalnya masuk dan
   *  daftar: halaman di belakangnya digelapkan lebih dalam dan diburamkan. */
  latar?: "biasa" | "pekat";
  children: React.ReactNode;
}) {
  const judulId = useId();
  const tutupRef = useRef<HTMLButtonElement>(null);
  // Portal baru boleh dipasang setelah komponen hidup di browser, karena
  // document.body tidak ada saat render di server.
  const [siap, setSiap] = useState(false);

  useEffect(() => setSiap(true), []);

  // Halaman di belakang dikunci supaya tidak ikut bergulir saat modal terbuka.
  useEffect(() => {
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = semula;
    };
  }, []);

  useEffect(() => {
    const sebelumnya = document.activeElement as HTMLElement | null;
    tutupRef.current?.focus();
    return () => sebelumnya?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onTutup();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onTutup]);

  if (!siap) return null;

  return createPortal(
    <div
      onClick={onTutup}
      className={`fixed inset-0 z-50 grid place-items-center p-20 ${
        latar === "pekat" ? "bg-ink/72 backdrop-blur-[8px]" : "bg-ink/55 backdrop-blur-[2px]"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={judulId}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${lebar} rounded-card border border-line bg-white p-20 shadow-search`}
      >
        <div className="flex items-center justify-between gap-12">
          <h2 id={judulId} className="text-result-head text-ink">
            {judul}
          </h2>
          <button
            ref={tutupRef}
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="grid size-44 shrink-0 place-items-center rounded-input text-section text-muted transition-colors duration-160 ease-base hover:bg-surface-2 hover:text-ink"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
