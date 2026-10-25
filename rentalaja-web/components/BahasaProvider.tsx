"use client";

// Bahasa aktif untuk client component. Nilainya diisi root layout
// app/[lang]/layout.tsx dari segmen URL.

import { createContext, useContext } from "react";
import { jalur as jalurUntuk, type Bahasa } from "@/lib/i18n";

const KonteksBahasa = createContext<Bahasa>("id");

export function BahasaProvider({ bahasa, children }: { bahasa: Bahasa; children: React.ReactNode }) {
  return <KonteksBahasa.Provider value={bahasa}>{children}</KonteksBahasa.Provider>;
}

export function useBahasa() {
  const bahasa = useContext(KonteksBahasa);
  return { bahasa, jalur: (path: string) => jalurUntuk(bahasa, path) };
}
