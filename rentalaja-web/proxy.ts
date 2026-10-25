// Routing bahasa. Semua halaman ada di app/[lang]:
//   /en, /en/...   -> diteruskan apa adanya (bahasa Inggris)
//   /id, /id/...   -> dialihkan ke alamat tanpa awalan, supaya satu halaman
//                     tidak punya dua URL
//   lainnya        -> ditulis ulang ke /id/... (bahasa Indonesia, alamat di
//                     browser tidak berubah)

import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) return;

  if (pathname === "/id" || pathname.startsWith("/id/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/id" : `/id${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // API, aset Next, dan berkas statis (apa pun yang berekstensi, mis.
  // /units/honda-beat-2022.webp, /icon.png) tidak melewati routing bahasa.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
