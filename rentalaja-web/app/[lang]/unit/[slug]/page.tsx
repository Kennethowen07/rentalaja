// Layar 3 · Detail unit.
//
// Datanya dari lib/api/unit.ts: rentalaja-api (GET /unit/:slug) kalau
// API_URL diisi, selain itu mock yang sama dengan GET /api/units/:slug.
// Dulu halaman ini memanggil /api/units lewat HTTP ke dirinya sendiri; itu
// tidak perlu lagi karena backend sungguhan sudah ada.

import { notFound } from "next/navigation";
import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UnitDetail from "@/components/unit/UnitDetail";
import { ambilDetailUnit } from "@/lib/api/unit";
import { bahasaAktif } from "@/lib/i18n-server";
import { sewaDariParams } from "@/lib/sewa";

export default async function UnitPage({
  params,
  searchParams,
}: PageProps<"/[lang]/unit/[slug]">) {
  const { slug } = await params;
  await connection();
  // Rentang sewa ikut dipakai supaya harga dan strip tanggal memakai tanggal
  // yang dipilih penyewa di /cari, bukan tanggal default.
  const sewa = sewaDariParams(await searchParams, Date.now());
  const data = await ambilDetailUnit(slug, sewa, await bahasaAktif());

  if (!data) notFound();

  return (
    <>
      <Navbar />
      <main>
        <UnitDetail data={data} />
      </main>
      <Footer />
    </>
  );
}
