// Kartu hasil pencarian — Layar 2 di .dc.html turn 1a.
// Unit yang sudah tersewa dibuat opacity .55, border lebih pucat, CTA mati,
// dan seluruh kartunya tidak bisa diklik.

import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { desimal, jalur, kamus, type Bahasa } from "@/lib/i18n";
import { formatRupiah } from "@/lib/mock/units";
import { jenisUnit, tagPaket, type HasilUrut } from "@/lib/mock/search";
import { paramSewa, type Sewa } from "@/lib/sewa";

const TEKS = kamus({
  id: {
    foto: (nama: string) => `Foto ${nama}`,
    fotoUnit: "foto unit",
    tersewa: "Sudah tersewa",
    total: (hari: number) => ` total ${hari} hari`,
    perHari: "/hari",
    detail: "Lihat detail",
    tidakTersedia: "Tidak tersedia",
  },
  en: {
    foto: (nama: string) => `Photo of ${nama}`,
    fotoUnit: "vehicle photo",
    tersewa: "Already booked",
    total: (hari: number) => ` total for ${hari} ${hari === 1 ? "day" : "days"}`,
    perHari: "/day",
    detail: "View details",
    tidakTersedia: "Not available",
  },
});

export default function ResultCard({
  hasil,
  sewa,
  bahasa,
}: {
  bahasa: Bahasa;
  hasil: HasilUrut;
  /** Rentang yang sedang dilihat. Ikut dibawa ke halaman detail lewat query,
   *  supaya harga dan kalender di sana memakai tanggal yang sama. */
  sewa: Sewa;
}) {
  const t = TEKS[bahasa];
  const { unit, kosong } = hasil;
  const hari = sewa.hari;
  const total = unit.hargaPerHari * hari;

  const isi = (
    <>
      <div className="relative aspect-[16/9]">
        {unit.foto ? (
          <Image
            src={unit.foto}
            alt={t.foto(unit.nama)}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder label={t.fotoUnit} className="absolute inset-0" />
        )}
        {/* Badge "Kosong" dihapus atas permintaan pemilik proyek; yang
            tersisa hanya penanda untuk unit yang tidak bisa dipesan. */}
        {!kosong && (
          <span className="absolute top-8 left-8 rounded-pill bg-muted px-8 py-4 text-badge-sm text-white">
            {t.tersewa}
          </span>
        )}
      </div>

      <div className="px-14 pt-13 pb-15">
        <p className="text-kind text-muted uppercase">{jenisUnit(unit.jenis, bahasa)}</p>
        <h3 className="mt-3 text-card-title text-ink">{unit.nama}</h3>
        <p className="mt-3 text-meta text-muted">
          ★ {desimal(unit.rating, bahasa)} · {unit.area} · {unit.tahun}
        </p>

        <ul className="mt-9 flex flex-wrap gap-5">
          {tagPaket[bahasa][unit.kategori].map((tag) => (
            <li
              key={tag}
              className="rounded-tag border border-line px-6 py-3 text-tag text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-12 border-t border-line pt-11">
          <p className="text-price text-ink">
            {formatRupiah(total)}
            <span className="text-micro text-muted">{t.total(hari)}</span>
          </p>
          <p className="mt-2 text-micro text-muted">
            {formatRupiah(unit.hargaPerHari)} {t.perHari}
          </p>
        </div>

        <p
          className={`mt-11 rounded-input py-10 text-center text-cta-sm ${
            kosong ? "bg-green-700 text-white" : "bg-surface-2 text-placeholder"
          }`}
        >
          {kosong ? t.detail : t.tidakTersedia}
        </p>
      </div>
    </>
  );

  const kelasKartu = `overflow-hidden rounded-result border bg-white ${
    kosong ? "border-line" : "border-line-soft opacity-55"
  }`;

  if (!kosong) {
    return <div className={kelasKartu}>{isi}</div>;
  }

  return (
    <Link
      href={jalur(bahasa, `/unit/${unit.id}?${paramSewa(sewa)}`)}
      className={`block ${kelasKartu} transition duration-160 ease-base hover:-translate-y-2 hover:shadow-card-hover`}
    >
      {isi}
    </Link>
  );
}
