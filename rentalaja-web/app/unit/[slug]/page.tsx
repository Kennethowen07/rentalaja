// STUB. Layar 3 "Detail unit" ada di Langkah 3 handoff dan belum dikerjakan.
// Ada supaya kartu unit di landing page tidak berujung 404 saat didemokan.

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { unitPopuler } from "@/lib/mock/units";

export default async function UnitPage({ params }: PageProps<"/unit/[slug]">) {
  const { slug } = await params;
  const unit = unitPopuler.find((u) => u.id === slug);

  return (
    <>
      <Navbar />
      <main className="container-page py-38">
        <p className="text-eyebrow text-green-700 uppercase">Belum dibangun</p>
        <h1 className="mt-10 text-h2 text-ink">
          {unit ? unit.nama : "Detail unit"}
        </h1>
        <p className="mt-9 max-w-[580px] text-body text-muted">
          Layar detail unit bagian dari Langkah 3 handoff dan belum
          diimplementasikan. Slug yang diterima route ini:{" "}
          <strong className="text-body-strong text-ink">{slug}</strong>.
        </p>

        <div className="mt-18 flex flex-wrap items-center gap-12">
          <Link
            href="/pemesanan"
            className="rounded-input bg-green-700 px-22 py-13 text-btn-sm text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            Pesan unit ini
          </Link>
          <Link href="/cari" className="text-link-sm text-green-700">
            ← Kembali ke hasil pencarian
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
