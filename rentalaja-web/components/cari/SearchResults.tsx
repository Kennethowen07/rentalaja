// Layar 2 · Hasil pencarian.
//
// Filter bar hanya merangkum pencarian penyewa: jenis dan area, lalu
// rentang tanggal yang dicari. Chip rentang lain dan filter Harga, Jenis
// motor, Antar jemput dihapus atas permintaan pemilik proyek (25 Okt 2026),
// begitu juga kotak-kotaknya: ringkasan tampil sebagai satu baris teks.
// Karena tidak ada lagi chip untuk mengganti tanggal, ada tautan
// "Ubah pencarian" kembali ke form di beranda.

import Link from "next/link";
import ResultCard from "@/components/cari/ResultCard";
import { type Kategori, type RentangTanggal, urutkanHasil } from "@/lib/mock/search";

export default function SearchResults({
  ringkasanFilter,
  kategori,
  rentang,
}: {
  ringkasanFilter: string;
  kategori: Kategori;
  /** Dihitung di server dari tanggal pilihan penyewa, lihat app/cari/page.tsx. */
  rentang: RentangTanggal;
}) {
  const hasil = urutkanHasil(kategori);

  return (
    <>
      {/* Filter bar sticky, menempel tepat di bawah navbar 64px / 72px */}
      <div className="sticky top-64 z-4 border-b border-green-200 bg-white md:top-72">
        <div className="container-beranda flex flex-wrap items-center gap-x-24 gap-y-8 py-16 md:py-20">
          <p className="flex items-center gap-10 text-b5-sm font-semibold md:text-b5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="size-20 text-green-700"
            >
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {ringkasanFilter}
          </p>
          <span aria-hidden className="hidden h-24 w-px bg-green-200 sm:block" />
          <p className="flex items-center gap-10 text-b5-sm font-semibold md:text-b5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="size-20 text-green-700"
            >
              <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
            {rentang.label}
            <span className="font-medium text-muted-kuat">· {rentang.hari} hari</span>
          </p>
          <Link
            href="/"
            className="ml-auto flex min-h-44 items-center text-b6-sm font-semibold text-green-700 decoration-2 underline-offset-4 hover:underline md:text-b6"
          >
            Ubah pencarian
          </Link>
        </div>
      </div>

      <div className="container-beranda pt-24 pb-28">
        {/* Baris jumlah unit dan "Urutkan" dihapus atas permintaan pemilik
            proyek. Judul tetap ada untuk pembaca layar. */}
        <h1 className="sr-only">Hasil pencarian</h1>

        <ul className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((h) => (
            <li key={h.unit.id}>
              <ResultCard hasil={h} sewa={{ mulai: rentang.mulai, hari: rentang.hari }} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
