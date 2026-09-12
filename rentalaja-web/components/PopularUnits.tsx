// README section 5 — band hijau muda, kartu hover lift 2px.
// Seluruh kartu clickable menuju halaman detail unit.

import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { formatRupiah, metaUnit, unitPopuler } from "@/lib/mock/units";

export default function PopularUnits() {
  return (
    <section className="border-y border-green-200 bg-green-50 py-34">
      <div className="container-page">
        <div className="flex flex-wrap items-baseline justify-between gap-12">
          <div>
            <h2 className="text-section text-ink">Unit populer minggu ini</h2>
            <p className="mt-5 text-body text-muted">Canggu, Seminyak, Ubud</p>
          </div>
          <Link
            href="/cari"
            className="text-link-sm text-green-700 transition-colors duration-160 ease-base hover:text-green-800"
          >
            Lihat semua unit →
          </Link>
        </div>

        <ul className="mt-18 grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {unitPopuler.map((u) => (
            <li key={u.id}>
              <Link
                href={`/unit/${u.id}`}
                className="block overflow-hidden rounded-card border border-green-200 bg-white transition duration-160 ease-base hover:-translate-y-2 hover:shadow-card-hover"
              >
                {u.foto ? (
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={u.foto}
                      alt={`Foto ${u.nama}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <ImagePlaceholder label={u.fotoLabel} className="aspect-[16/9]" />
                )}
                <div className="p-14">
                  <h3 className="text-card-title text-ink">{u.nama}</h3>
                  <p className="mt-3 text-meta text-muted">{metaUnit(u)}</p>
                  <p className="mt-11 flex items-baseline gap-5">
                    <span className="text-price text-green-700">
                      {formatRupiah(u.hargaPerHari)}
                    </span>
                    <span className="text-micro text-muted">/hari</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
