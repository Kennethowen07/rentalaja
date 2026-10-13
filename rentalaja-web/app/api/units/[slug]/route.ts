// Satu-satunya endpoint di prototype ini.
//
//   GET /api/units/:slug  ->  200 DetailUnit | 404 { error }
//
// Sengaja hanya satu: cukup untuk membuktikan halaman detail bisa hidup dari
// data yang diambil lewat HTTP, tanpa perlu merancang seluruh permukaan API
// dulu. Kontrak lengkapnya nanti ada di Langkah 4 handoff.

import { detailUnit } from "@/lib/mock/unit-detail";
import { sewaDariQuery } from "@/lib/sewa";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/units/[slug]">,
) {
  const { slug } = await params;
  // Harga dan kalender bergantung pada rentang sewa, jadi endpoint ini
  // menerima ?mulai=2026-10-28&durasi=5. Tanpa keduanya dipakai besok
  // selama 3 hari, supaya memanggil endpoint tanpa query tetap sah.
  const sewa = sewaDariQuery(new URL(request.url).searchParams, Date.now());
  const detail = detailUnit(slug, sewa);

  if (!detail) {
    return Response.json(
      { error: `Unit "${slug}" tidak ditemukan.` },
      { status: 404 },
    );
  }

  return Response.json(detail);
}
