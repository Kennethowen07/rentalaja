"use client";

// Callout Beranda. Hanya muncul kalau ada pesanan menunggu; pesanan yang
// lewat 1 jam hilang sendiri dari hitungan tanpa perlu reload.

import Link from "next/link";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";

const TEKS = kamus({
  id: {
    kosong: "Tidak ada pesanan yang menunggu konfirmasi.",
    judul: (n: number) => `${n} Pesanan Menunggu Konfirmasi`,
    tinjau: "Tinjau",
  },
  en: {
    kosong: "No bookings are awaiting confirmation.",
    judul: (n: number) => `${n} ${n === 1 ? "Booking" : "Bookings"} Awaiting Confirmation`,
    tinjau: "Review",
  },
});
import { usePesanan } from "./PesananProvider";
import { kelasTombol } from "./ui";

export default function CalloutPesanan() {
  const { menunggu } = usePesanan();
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];

  if (menunggu.length === 0) {
    return (
      <p className="mt-32 text-m-body text-mitra-muted">
        {t.kosong}
      </p>
    );
  }

  return (
    <section
      aria-labelledby="judul-callout"
      className="mt-32 flex flex-col gap-16 rounded-m-callout border border-mitra-primer bg-mitra-tint px-20 py-22 shadow-m-panel min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between min-[640px]:gap-20 min-[640px]:px-28 min-[640px]:py-26"
    >
      <h2 id="judul-callout" aria-live="polite" className="text-m-callout-judul text-mitra-primer">
        {t.judul(menunggu.length)}
      </h2>
      <Link
        href={jalur("/mitra/pesanan?tab=menunggu")}
        className={`${kelasTombol.primer} shrink-0 self-start px-20 py-12 min-[640px]:self-auto`}
      >
        {t.tinjau}
      </Link>
    </section>
  );
}
