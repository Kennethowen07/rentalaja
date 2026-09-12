// Satu-satunya endpoint di prototype ini.
//
//   GET /api/units/:slug  ->  200 DetailUnit | 404 { error }
//
// Sengaja hanya satu: cukup untuk membuktikan halaman detail bisa hidup dari
// data yang diambil lewat HTTP, tanpa perlu merancang seluruh permukaan API
// dulu. Kontrak lengkapnya nanti ada di Langkah 4 handoff.

import { detailUnit } from "@/lib/mock/unit-detail";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/units/[slug]">,
) {
  const { slug } = await params;
  const detail = detailUnit(slug);

  if (!detail) {
    return Response.json(
      { error: `Unit "${slug}" tidak ditemukan.` },
      { status: 404 },
    );
  }

  return Response.json(detail);
}
