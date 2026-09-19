"use client";

// Callout Beranda. Hanya muncul kalau ada pesanan menunggu; menit "masuk ...
// lalu" berjalan dari timestamp server, dan pesanan yang lewat 1 jam hilang
// sendiri dari hitungan tanpa perlu reload.

import Link from "next/link";
import { MENIT } from "@/lib/mitra/waktu";
import { usePesananMenunggu } from "./PesananMenungguProvider";
import { kelasTombol } from "./ui";

export default function CalloutPesanan() {
  const { menunggu, sekarang } = usePesananMenunggu();

  if (menunggu.length === 0) {
    return (
      <p className="mt-32 text-m-body text-mitra-muted">
        Tidak ada pesanan yang menunggu konfirmasi.
      </p>
    );
  }

  const tertua = Math.min(...menunggu.map((p) => p.masukPada));
  const menit = Math.floor((sekarang - tertua) / MENIT);

  return (
    <section
      aria-labelledby="judul-callout"
      className="mt-32 flex flex-col gap-16 rounded-m-callout border border-mitra-primer bg-mitra-tint px-20 py-22 shadow-m-panel min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between min-[640px]:gap-20 min-[640px]:px-28 min-[640px]:py-26"
    >
      <div>
        <h2 id="judul-callout" aria-live="polite" className="text-m-callout-judul text-mitra-primer">
          {menunggu.length} pesanan menunggu konfirmasi
        </h2>
        <p className="mt-5 text-m-callout text-mitra-callout">
          {menit < 1 ? "Yang tertua baru saja masuk." : `Yang tertua masuk ${menit} menit lalu.`}{" "}
          Batas balas 1 jam, lewat itu pesanan batal otomatis.
        </p>
      </div>
      <Link
        href="/mitra/pesanan"
        className={`${kelasTombol.primer} shrink-0 self-start px-20 py-12 min-[640px]:self-auto`}
      >
        Tinjau
      </Link>
    </section>
  );
}
