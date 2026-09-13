"use client";

// Peta lokasi lewat Google Maps Embed API — gratis tanpa batas pemakaian dan
// tanpa dependency npm. Butuh NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY di .env.local
// (lihat .env.example). Nilainya di-inline saat build, jadi dev server harus
// di-restart setelah key ditambahkan.
//
// Jatuh ke gambar peta statis kalau key belum diisi atau browser melaporkan
// sedang offline. Batasannya: koneksi yang lambat tapi masih "online" tidak
// bisa dideteksi dari luar iframe lintas-origin, jadi di kondisi itu iframe
// akan tampil kosong alih-alih jatuh ke gambar.

import Image from "next/image";
import { useEffect, useState } from "react";

// Harus referensi langsung: Next hanya meng-inline process.env.NEXT_PUBLIC_*
// yang ditulis utuh, bukan lewat variabel perantara.
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "";

const PETA_CADANGAN = "/peta-titik-antar.webp";

export default function PetaLokasi({
  alamat,
  className = "",
  sizes = "100vw",
}: {
  alamat: string;
  /** Ukuran dan margin kotak peta, mis. "mt-8 h-200" atau "aspect-[16/9]". */
  className?: string;
  sizes?: string;
}) {
  const [online, setOnline] = useState(true);
  const [alamatTampil, setAlamatTampil] = useState(alamat);

  useEffect(() => {
    const perbarui = () => setOnline(navigator.onLine);
    perbarui();
    window.addEventListener("online", perbarui);
    window.addEventListener("offline", perbarui);
    return () => {
      window.removeEventListener("online", perbarui);
      window.removeEventListener("offline", perbarui);
    };
  }, []);

  // Tunda pembaruan peta sampai pengguna berhenti mengetik alamat, supaya
  // iframe tidak dimuat ulang di setiap huruf.
  useEffect(() => {
    const timer = setTimeout(() => setAlamatTampil(alamat), 700);
    return () => clearTimeout(timer);
  }, [alamat]);

  const kotak = `relative overflow-hidden rounded-input border border-line bg-surface ${className}`;

  if (KEY && online) {
    const q = encodeURIComponent(`${alamatTampil}, Bali`);
    return (
      <div className={kotak}>
        <iframe
          title={`Peta Google Maps: ${alamatTampil}`}
          src={`https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${q}&language=id`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <>
      <div className={kotak}>
        <Image
          src={PETA_CADANGAN}
          alt={`Peta ilustrasi area sekitar ${alamatTampil}`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
      <p className="mt-6 text-micro text-muted">
        Peta ilustrasi, bukan lokasi sebenarnya.
      </p>
    </>
  );
}
