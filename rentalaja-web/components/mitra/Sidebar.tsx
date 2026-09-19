"use client";

// Sidebar panel mitra. >= 900px: kolom tetap 270px, sticky setinggi layar.
// < 900px: bar atas + drawer (README/Interactions, Responsif).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Mitra } from "@/lib/mitra/tipe";
import { usePesananMenunggu } from "./PesananMenungguProvider";

const menu = [
  { label: "Beranda", href: "/mitra" },
  { label: "Pesanan", href: "/mitra/pesanan" },
  { label: "Unit kendaraan", href: "/mitra/unit" },
  { label: "Kalender", href: "/mitra/kalender" },
  { label: "Serah terima", href: "/mitra/serah-terima" },
  { label: "Pendapatan", href: "/mitra/pendapatan" },
  { label: "Ulasan", href: "/mitra/ulasan" },
];

export default function Sidebar({ mitra }: { mitra: Mitra }) {
  const pathname = usePathname();
  const { menunggu } = usePesananMenunggu();
  const [terbuka, setTerbuka] = useState(false);
  const tombolMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!terbuka) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTerbuka(false);
        tombolMenuRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [terbuka]);

  return (
    <aside className="sidebar-mitra bg-mitra-sidebar min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-dvh min-[900px]:w-270 min-[900px]:shrink-0 min-[900px]:overflow-y-auto">
      <div className="flex h-full flex-col px-20 py-14 min-[900px]:py-32">
        <div className="flex items-center justify-between">
          <Link href="/mitra" className="block rounded-m-thumb px-10">
            <span className="block text-m-logo text-white">rentalaja</span>
            <span className="block pt-2 text-m-sublogo text-mitra-nav-sub">Panel mitra</span>
          </Link>
          <button
            ref={tombolMenuRef}
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-controls="menu-mitra"
            aria-label={terbuka ? "Tutup menu" : "Buka menu"}
            className="grid size-44 place-items-center rounded-m-thumb min-[900px]:hidden"
          >
            <span aria-hidden className="flex flex-col gap-5">
              <span className="h-2 w-20 rounded-pill bg-white" />
              <span className="h-2 w-20 rounded-pill bg-white" />
              <span className="h-2 w-20 rounded-pill bg-white" />
            </span>
          </button>
        </div>

        <div
          id="menu-mitra"
          className={`${terbuka ? "flex" : "hidden"} flex-1 flex-col min-[900px]:flex`}
        >
          <nav aria-label="Navigasi panel mitra" className="mt-20 grid gap-4 min-[900px]:mt-34">
            {menu.map((item) => {
              const aktif =
                item.href === "/mitra"
                  ? pathname === "/mitra"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge = item.href === "/mitra/pesanan" ? menunggu.length : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={aktif ? "page" : undefined}
                  onClick={() => setTerbuka(false)}
                  className={`flex items-center justify-between rounded-m-thumb px-12 py-11 transition-colors duration-160 ease-base ${
                    aktif
                      ? "bg-white text-m-nav-aktif text-mitra-primer"
                      : "text-m-nav text-mitra-nav hover:bg-mitra-nav-hover"
                  }`}
                >
                  {item.label}
                  {badge > 0 && (
                    <span
                      className={`rounded-pill px-8 py-2 text-m-badge ${
                        aktif ? "bg-mitra-sidebar text-white" : "bg-white text-mitra-sidebar"
                      }`}
                    >
                      {badge}
                      <span className="sr-only"> menunggu konfirmasi</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-24 border-t border-mitra-sidebar-garis px-10 pt-16 min-[900px]:mt-auto">
            <p className="text-m-mitra-nama text-white">{mitra.nama}</p>
            <p className="mt-3 text-m-mitra-meta text-mitra-nav-sub">
              {mitra.pemilik} · {mitra.jumlahUnit} unit
              <br />
              {mitra.area}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
