// Layar 2 · Hasil pencarian.
//
// Pill kiri di filter bar diisi dari query yang dikirim search card landing
// page (/cari?jenis=&area=&mulai=&jam=&durasi=), begitu juga pill tanggal:
// hanya rentang yang dicari, tanpa chip rentang lain.

import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchResults from "@/components/cari/SearchResults";
import { bahasaAktif } from "@/lib/i18n-server";
import { type Kategori, rentangDari } from "@/lib/mock/search";
import { sewaDariParams } from "@/lib/sewa";

function ringkasan(
  params: Awaited<PageProps<"/[lang]/cari">["searchParams"]>,
  en: boolean,
): string {
  const jenisRaw = typeof params.jenis === "string" ? params.jenis : "";
  const jenis = jenisRaw === "mobil" ? (en ? "Car" : "Mobil") : en ? "Scooter" : "Motor";

  const areaRaw = typeof params.area === "string" ? params.area : "";
  const area = areaRaw.split(",")[0]?.trim() || "Canggu";

  return `${jenis} · ${area}`;
}

/** ?jenis=mobil dari tab di search card beranda; selain itu motor. */
function kategoriDari(params: Awaited<PageProps<"/[lang]/cari">["searchParams"]>): Kategori {
  return params.jenis === "mobil" ? "mobil" : "motor";
}

export default async function CariPage({ searchParams }: PageProps<"/[lang]/cari">) {
  const params = await searchParams;
  // Rentang dihitung per permintaan: tanggal lampau di URL digeser ke besok
  // oleh sewaDariParams, dan itu bergantung pada jam sekarang.
  await connection();
  const bahasa = await bahasaAktif();
  const rentang = rentangDari(sewaDariParams(params, Date.now()), bahasa);

  return (
    <>
      <Navbar />
      <main>
        <SearchResults
          ringkasanFilter={ringkasan(params, bahasa === "en")}
          kategori={kategoriDari(params)}
          rentang={rentang}
        />
      </main>
      <Footer />
    </>
  );
}
