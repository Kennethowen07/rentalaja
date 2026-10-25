"use client";

// Callout Beranda. Hanya muncul kalau ada pesanan menunggu; menit "masuk ...
// lalu" berjalan dari timestamp server, dan pesanan yang lewat 1 jam hilang
// sendiri dari hitungan tanpa perlu reload.

import Link from "next/link";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";
import { MENIT } from "@/lib/mitra/waktu";

const TEKS = kamus({
  id: {
    kosong: "Tidak ada pesanan yang menunggu konfirmasi.",
    judul: (n: number) => `${n} pesanan menunggu konfirmasi`,
    baru: "Yang tertua baru saja masuk.",
    menit: (m: number) => `Yang tertua masuk ${m} menit lalu.`,
    batas: "Batas balas 1 jam, lewat itu pesanan batal otomatis.",
    tinjau: "Tinjau",
  },
  en: {
    kosong: "No bookings are awaiting confirmation.",
    judul: (n: number) => `${n} ${n === 1 ? "booking" : "bookings"} awaiting confirmation`,
    baru: "The oldest one just came in.",
    menit: (m: number) => `The oldest came in ${m} ${m === 1 ? "minute" : "minutes"} ago.`,
    batas: "You have 1 hour to reply; after that the booking is cancelled automatically.",
    tinjau: "Review",
  },
});
import { usePesanan } from "./PesananProvider";
import { kelasTombol } from "./ui";

export default function CalloutPesanan() {
  const { menunggu, sekarang } = usePesanan();
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];

  if (menunggu.length === 0) {
    return (
      <p className="mt-32 text-m-body text-mitra-muted">
        {t.kosong}
      </p>
    );
  }

  const tertua = Math.min(...menunggu.map((p) => p.masukPada ?? sekarang));
  const menit = Math.floor((sekarang - tertua) / MENIT);

  return (
    <section
      aria-labelledby="judul-callout"
      className="mt-32 flex flex-col gap-16 rounded-m-callout border border-mitra-primer bg-mitra-tint px-20 py-22 shadow-m-panel min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between min-[640px]:gap-20 min-[640px]:px-28 min-[640px]:py-26"
    >
      <div>
        <h2 id="judul-callout" aria-live="polite" className="text-m-callout-judul text-mitra-primer">
          {t.judul(menunggu.length)}
        </h2>
        <p className="mt-5 text-m-callout text-mitra-callout">
          {menit < 1 ? t.baru : t.menit(menit)} {t.batas}
        </p>
      </div>
      <Link
        href={jalur("/mitra/pesanan?tab=menunggu")}
        className={`${kelasTombol.primer} shrink-0 self-start px-20 py-12 min-[640px]:self-auto`}
      >
        {t.tinjau}
      </Link>
    </section>
  );
}
