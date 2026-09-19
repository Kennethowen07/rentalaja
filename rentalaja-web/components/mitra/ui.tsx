// Potongan UI panel mitra yang dipakai lintas layar. Tanpa hook, jadi bisa
// dipakai komponen server maupun client.

import Image from "next/image";
import Link from "next/link";

export const kelasTombol = {
  primer:
    "inline-flex items-center justify-center whitespace-nowrap rounded-m-tombol border border-mitra-primer bg-mitra-primer text-m-btn text-white transition-colors duration-160 ease-base hover:border-mitra-primer-hover hover:bg-mitra-primer-hover",
  sekunder:
    "inline-flex items-center justify-center whitespace-nowrap rounded-m-tombol border border-mitra-border bg-white text-m-btn-sekunder text-mitra-ink transition-colors duration-160 ease-base hover:border-mitra-border-hover",
};

/** Tombol kecil di dalam baris daftar (spec: 14px, radius 8px). */
export const kelasTombolBaris = {
  primer:
    "inline-flex items-center justify-center whitespace-nowrap rounded-m-thumb border border-mitra-primer bg-mitra-primer px-16 py-9 text-m-btn-baris text-white transition-colors duration-160 ease-base hover:border-mitra-primer-hover hover:bg-mitra-primer-hover",
  sekunder:
    "inline-flex items-center justify-center whitespace-nowrap rounded-m-thumb border border-mitra-border bg-white px-15 py-9 text-m-btn-baris-2 text-mitra-ink transition-colors duration-160 ease-base hover:border-mitra-border-hover",
  // Tindakan merusak memakai plum, bukan merah, sesuai README panel mitra.
  bahaya:
    "inline-flex items-center justify-center whitespace-nowrap rounded-m-thumb border border-mitra-plum bg-mitra-plum px-16 py-9 text-m-btn-baris text-white transition-colors duration-160 ease-base hover:border-mitra-plum-hover hover:bg-mitra-plum-hover",
};

export function TombolLink({
  href,
  varian,
  children,
}: {
  href: string;
  varian: "primer" | "sekunder";
  children: React.ReactNode;
}) {
  const padding = varian === "primer" ? "px-19 py-11" : "px-17 py-11";
  return (
    <Link href={href} className={`${kelasTombol[varian]} ${padding}`}>
      {children}
    </Link>
  );
}

export function HeaderHalaman({
  kicker,
  judul,
  aksi,
}: {
  kicker: string;
  judul: string;
  aksi?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-16">
      <div>
        <p className="text-m-kicker uppercase text-mitra-faint">{kicker}</p>
        <h1 className="mt-8 text-m-h1 text-mitra-ink">{judul}</h1>
      </div>
      {aksi && <div className="flex flex-wrap gap-10">{aksi}</div>}
    </header>
  );
}

/** Titik 7px + label. Status telat dibedakan warna DAN kata ("Lewat ..."). */
export function TitikStatus({ label, telat }: { label: string; telat: boolean }) {
  return (
    <span className="flex items-center gap-9 whitespace-nowrap">
      <span
        aria-hidden
        className={`size-7 shrink-0 rounded-pill ${telat ? "bg-mitra-plum" : "bg-mitra-primer"}`}
      />
      <span className={`text-m-status ${telat ? "text-mitra-plum" : "text-mitra-ink-2"}`}>
        {label}
      </span>
    </span>
  );
}

export function ThumbnailUnit({
  foto,
  nama,
  className = "h-66 w-96",
}: {
  foto: string | null;
  nama: string;
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-m-thumb bg-mitra-panel ${className}`}>
      {foto && (
        <Image src={foto} alt={`Foto ${nama}`} fill sizes="96px" className="object-cover" />
      )}
    </div>
  );
}

/** Pengganti isi layar yang belum dibangun. Judul tetap, isi satu baris
 *  muted, sesuai aturan state kosong di README. */
export function LayarBelumDibangun({ kicker, judul }: { kicker: string; judul: string }) {
  return (
    <>
      <HeaderHalaman kicker={kicker} judul={judul} />
      <p className="mt-32 border-t border-mitra-hairline pt-26 text-m-body text-mitra-faint">
        Layar ini menyusul setelah Beranda disetujui.
      </p>
    </>
  );
}
