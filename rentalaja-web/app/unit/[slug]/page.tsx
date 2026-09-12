// Layar 3 · Detail unit.
//
// Halaman ini sengaja TIDAK mengimpor data detail langsung. Ia memanggil
// GET /api/units/:slug lewat HTTP supaya endpoint itu benar-benar terpakai,
// bukan sekadar ada. Konsekuensinya ada satu hop ekstra di server — wajar
// untuk prototype, tapi kalau nanti endpointnya diganti backend sungguhan,
// yang berubah cuma base URL-nya.

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UnitDetail from "@/components/unit/UnitDetail";
import type { DetailUnit } from "@/lib/mock/unit-detail";

async function ambilDetail(slug: string): Promise<DetailUnit | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";

  const res = await fetch(
    `${proto}://${host}/api/units/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;

  return (await res.json()) as DetailUnit;
}

export default async function UnitPage({ params }: PageProps<"/unit/[slug]">) {
  const { slug } = await params;
  const data = await ambilDetail(slug);

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
