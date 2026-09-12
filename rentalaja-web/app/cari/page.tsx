// Layar 2 · Hasil pencarian.
//
// Pill kiri di filter bar diisi dari query yang dikirim search card landing
// page (/cari?jenis=&area=&mulai=&jam=&durasi=). Chip tanggal memakai tiga
// rentang preset dari file desain, bukan tanggal dari query — itu yang
// mendemokan "ganti tanggal, daftarnya berubah".

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchResults from "@/components/cari/SearchResults";

function ringkasan(
  params: Awaited<PageProps<"/cari">["searchParams"]>,
): string {
  const jenisRaw = typeof params.jenis === "string" ? params.jenis : "";
  const jenis = jenisRaw === "mobil" ? "Mobil" : "Motor";

  const areaRaw = typeof params.area === "string" ? params.area : "";
  const area = areaRaw.split(",")[0]?.trim() || "Canggu";

  return `${jenis} · ${area}`;
}

export default async function CariPage({ searchParams }: PageProps<"/cari">) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <main>
        <SearchResults ringkasanFilter={ringkasan(params)} />
      </main>
      <Footer />
    </>
  );
}
