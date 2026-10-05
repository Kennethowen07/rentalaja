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
import { kreditFoto } from "@/lib/mock/kredit-foto";

export const metadata = {
  title: "Kredit foto — rentalaja",
  description:
    "Sumber, pembuat, dan lisensi setiap foto kendaraan yang dipakai di rentalaja.",
};

export default function KreditPage() {
  return (
    <>
      <Navbar />
      <main className="container-page pt-28 pb-40">
        <h1 className="text-h1-md text-ink">Kredit foto</h1>
        <p className="mt-10 max-w-620 text-body text-muted">
          Semua foto kendaraan di sini berlisensi bebas dari Wikimedia Commons.
          Tidak ada foto yang diambil dari hasil pencarian gambar biasa. Foto
          berlisensi CC BY-SA boleh dipakai ulang selama pembuatnya disebut,
          lisensinya ditautkan, dan perubahannya diterangkan — itulah isi daftar
          ini.
        </p>

        <ul className="mt-26 grid gap-18 sm:grid-cols-2">
          {kreditFoto.map((k) => (
            <li key={k.berkas} className="rounded-card border border-line p-16">
              <div className="relative h-150 overflow-hidden rounded-result bg-surface-2">
                <Image
                  src={`/units/${k.berkas}`}
                  alt={`Foto ${k.unit}`}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-12 text-nav-strong text-ink">{k.unit}</p>
              <dl className="mt-8 grid gap-4">
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">Pembuat</dt>
                  <dd className="text-body-sm text-ink">{k.pembuat}</dd>
                </div>
                <div className="flex gap-8">
                  <dt className="w-72 shrink-0 text-body-sm text-muted">Lisensi</dt>
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
                  <dt className="w-72 shrink-0 text-body-sm text-muted">Sumber</dt>
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
                  <dt className="w-72 shrink-0 text-body-sm text-muted">Perubahan</dt>
                  <dd className="text-body-sm text-muted">{k.perubahan}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <p className="mt-26 max-w-620 text-body-sm text-muted">
          Klausa share-alike pada CC BY-SA mengikat karya turunan dari fotonya,
          bukan kode atau isi situs ini.
        </p>
      </main>
      <Footer />
    </>
  );
}
