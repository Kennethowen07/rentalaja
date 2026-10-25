// Halaman kredit foto.
//
// Ada karena kewajiban lisensi, bukan karena desain memintanya: foto unit
// berlisensi CC BY-SA mensyaratkan nama pembuat, tautan lisensi, dan
// keterangan perubahan tampil di tempat fotonya dipakai. Menaruh delapan
// baris itu di footer akan membuat footernya lebih panjang dari isinya, jadi
// footer hanya menautkan ke sini.

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { kreditFoto, terjemahKredit } from "@/lib/mock/kredit-foto";

const TEKS = kamus({
  id: {
    judulHalaman: "Kredit foto — rentalaja",
    deskripsi: "Sumber, pembuat, dan lisensi setiap foto kendaraan yang dipakai di rentalaja.",
    judul: "Kredit foto",
    intro:
      "Semua foto kendaraan di sini berlisensi bebas dari Wikimedia Commons. Tidak ada foto yang diambil dari hasil pencarian gambar biasa. Foto berlisensi CC BY-SA boleh dipakai ulang selama pembuatnya disebut, lisensinya ditautkan, dan perubahannya diterangkan — itulah isi daftar ini.",
    foto: (nama: string) => `Foto ${nama}`,
    pembuat: "Pembuat",
    lisensi: "Lisensi",
    sumber: "Sumber",
    perubahan: "Perubahan",
    penutup: "Klausa share-alike pada CC BY-SA mengikat karya turunan dari fotonya, bukan kode atau isi situs ini.",
  },
  en: {
    judulHalaman: "Photo credits — rentalaja",
    deskripsi: "Source, author, and license of every vehicle photo used on rentalaja.",
    judul: "Photo credits",
    intro:
      "Every vehicle photo here is freely licensed from Wikimedia Commons. None were taken from ordinary image search results. CC BY-SA photos may be reused as long as the author is credited, the license is linked, and the changes are described — that's what this list is for.",
    foto: (nama: string) => `Photo of ${nama}`,
    pembuat: "Author",
    lisensi: "License",
    sumber: "Source",
    perubahan: "Changes",
    penutup: "The share-alike clause of CC BY-SA applies to derivative works of the photos, not to this site's code or content.",
  },
});

export async function generateMetadata() {
  const t = TEKS[await bahasaAktif()];
  return { title: t.judulHalaman, description: t.deskripsi };
}

export default async function KreditPage() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <>
      <Navbar />
      <main className="container-page pt-28 pb-40">
        <h1 className="text-h1-md text-ink">{t.judul}</h1>
        <p className="mt-10 max-w-620 text-body text-muted">{t.intro}</p>

        <ul className="mt-26 grid gap-18 sm:grid-cols-2">
          {kreditFoto.map((k) => (
            <li key={k.berkas} className="rounded-card border border-line p-16">
              <div className="relative h-150 overflow-hidden rounded-result bg-surface-2">
                <Image
                  src={k.berkas.includes("/") ? `/${k.berkas}` : `/units/${k.berkas}`}
                  alt={t.foto(terjemahKredit(k.unit, bahasa))}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-12 text-nav-strong text-ink">{terjemahKredit(k.unit, bahasa)}</p>
              <dl className="mt-8 grid gap-4">
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">{t.pembuat}</dt>
                  <dd className="text-body-sm text-ink">{k.pembuat}</dd>
                </div>
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">{t.lisensi}</dt>
                  <dd className="text-body-sm text-ink">
                    <a
                      href={k.lisensiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-green-700"
                    >
                      {k.lisensi}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">{t.sumber}</dt>
                  <dd className="min-w-0 text-body-sm text-ink">
                    <a
                      href={k.halaman}
                      target="_blank"
                      rel="noreferrer"
                      className="break-words underline hover:text-green-700"
                    >
                      {k.judul}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">{t.perubahan}</dt>
                  <dd className="text-body-sm text-muted">{terjemahKredit(k.perubahan, bahasa)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <p className="mt-26 max-w-620 text-body-sm text-muted">{t.penutup}</p>
      </main>
      <Footer />
    </>
  );
}
