// STUB. Layar 2 "Hasil pencarian" ada di Langkah 3 handoff dan belum
// dikerjakan. Halaman ini cuma membuktikan search card mengirim query yang
// benar, supaya tombol "Cari unit" tidak berujung 404 saat didemokan.

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function CariPage({ searchParams }: PageProps<"/cari">) {
  const params = await searchParams;
  const baris = (["jenis", "area", "mulai", "jam", "durasi"] as const).map(
    (kunci) => [kunci, params[kunci]] as const,
  );

  return (
    <>
      <Navbar />
      <main className="container-page py-38">
        <p className="text-eyebrow text-green-700 uppercase">Belum dibangun</p>
        <h1 className="mt-10 text-h2 text-ink">Hasil pencarian</h1>
        <p className="mt-9 max-w-[580px] text-body text-muted">
          Layar ini bagian dari Langkah 3 handoff dan belum diimplementasikan.
          Parameter di bawah adalah yang dikirim search card di halaman utama.
        </p>

        <dl className="mt-18 grid max-w-[580px] gap-12 rounded-card border border-green-200 bg-green-25 p-18">
          {baris.map(([kunci, nilai]) => (
            <div key={kunci} className="flex justify-between gap-16">
              <dt className="text-label text-muted">{kunci}</dt>
              <dd className="text-nav-strong text-ink">
                {typeof nilai === "string" && nilai ? nilai : "—"}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/"
          className="mt-18 inline-block text-link-sm text-green-700"
        >
          ← Kembali ke halaman utama
        </Link>
      </main>
      <Footer />
    </>
  );
}
