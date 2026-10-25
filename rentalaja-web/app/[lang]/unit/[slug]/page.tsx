// Layar 3 · Detail unit.
//
// Halaman ini sengaja TIDAK mengimpor data detail langsung. Ia memanggil
// GET /api/units/:slug lewat HTTP supaya endpoint itu benar-benar terpakai,
// bukan sekadar ada. Konsekuensinya ada satu hop ekstra di server — wajar
// untuk prototype, tapi kalau nanti endpointnya diganti backend sungguhan,
// yang berubah cuma base URL-nya.

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UnitDetail from "@/components/unit/UnitDetail";
import type { Bahasa } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import type { DetailUnit } from "@/lib/mock/unit-detail";
import { paramSewa, sewaDariParams, type Sewa } from "@/lib/sewa";

async function ambilDetail(slug: string, sewa: Sewa, bahasa: Bahasa): Promise<DetailUnit | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";

  // Rentang sewa ikut dikirim supaya harga, label tanggal, dan strip kalender
  // yang dihitung endpoint memakai tanggal yang dipilih penyewa di /cari,
  // bukan tanggal default.
  const res = await fetch(
    `${proto}://${host}/api/units/${encodeURIComponent(slug)}?${paramSewa(sewa)}&bahasa=${bahasa}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;

  return (await res.json()) as DetailUnit;
}

export default async function UnitPage({
  params,
  searchParams,
}: PageProps<"/[lang]/unit/[slug]">) {
  const { slug } = await params;
  await connection();
  const sewa = sewaDariParams(await searchParams, Date.now());
  const data = await ambilDetail(slug, sewa, await bahasaAktif());

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
