// Layar 2 · Hasil pencarian.
//
// Pill kiri di filter bar diisi dari query yang dikirim search card landing
// page (/cari?jenis=&area=&mulai=&jam=&durasi=). Chip tanggal memakai tiga
// rentang preset dari file desain, bukan tanggal dari query — itu yang
// mendemokan "ganti tanggal, daftarnya berubah".

import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchResults from "@/components/cari/SearchResults";
import { bangunRentang, type PilihanTanggal } from "@/lib/mock/search";

function ringkasan(
  params: Awaited<PageProps<"/cari">["searchParams"]>,
): string {
  const jenisRaw = typeof params.jenis === "string" ? params.jenis : "";
  const jenis = jenisRaw === "mobil" ? "Mobil" : "Motor";

  const areaRaw = typeof params.area === "string" ? params.area : "";
  const area = areaRaw.split(",")[0]?.trim() || "Canggu";

  return `${jenis} · ${area}`;
}

/** Tanggal pilihan penyewa dari query, atau null kalau halaman ini dibuka
 *  langsung tanpa lewat form pencarian. */
function pilihanDariQuery(
  params: Awaited<PageProps<"/cari">["searchParams"]>,
): PilihanTanggal | null {
  const mulai = typeof params.mulai === "string" ? params.mulai : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mulai)) return null;

  const durasi = Number.parseInt(
    typeof params.durasi === "string" ? params.durasi : "",
    10,
  );
  // Batas atas 60 hari supaya angka aneh di URL tidak menghasilkan label
  // tanggal yang melompat bertahun-tahun. Durasi yang tidak masuk akal hanya
  // membatalkan durasinya, bukan tanggalnya: tanggal yang dipilih penyewa
  // tetap lebih berharga daripada dibuang gara-gara angka di sebelahnya.
  const hari = Number.isFinite(durasi) && durasi >= 1 && durasi <= 60 ? durasi : 3;

  return { mulai, hari };
}

export default async function CariPage({ searchParams }: PageProps<"/cari">) {
  const params = await searchParams;
  // Rentang tanggal dihitung per permintaan, jadi halaman ini tidak pernah
  // menawarkan tanggal yang sudah lewat.
  await connection();
  const rentang = bangunRentang(Date.now(), pilihanDariQuery(params));

  return (
    <>
      <Navbar />
      <main>
        <SearchResults ringkasanFilter={ringkasan(params)} daftarRentang={rentang} />
      </main>
      <Footer />
    </>
  );
}
