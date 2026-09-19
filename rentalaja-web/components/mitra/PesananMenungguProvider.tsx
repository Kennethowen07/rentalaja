"use client";

// Satu jam bersama untuk semua yang bergantung pada batas balas 1 jam:
// badge sidebar, callout Beranda, dan keterangan metrik. Waktunya berangkat
// dari timestamp server, lalu maju dengan jam browser yang dikoreksi selisih
// terhadap server, jadi jam laptop yang salah tidak menggeser countdown.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BATAS_BALAS_MS, type PesananMenunggu } from "@/lib/mitra/tipe";

type Nilai = {
  sekarang: number;
  /** Semua pesanan yang dikirim server, termasuk yang sudah lewat batas. */
  semua: PesananMenunggu[];
  /** Hanya yang masih dalam batas balas. */
  menunggu: PesananMenunggu[];
};

const Konteks = createContext<Nilai | null>(null);

export function PesananMenungguProvider({
  sekarangServer,
  pesanan,
  children,
}: {
  sekarangServer: number;
  pesanan: PesananMenunggu[];
  children: React.ReactNode;
}) {
  // Render pertama memakai waktu server supaya HTML server dan hasil
  // hidrasi identik.
  const [sekarang, setSekarang] = useState(sekarangServer);

  useEffect(() => {
    const selisih = sekarangServer - Date.now();
    const detak = () => setSekarang(Date.now() + selisih);
    detak();
    const id = setInterval(detak, 15_000);
    return () => clearInterval(id);
  }, [sekarangServer]);

  const nilai = useMemo(
    () => ({
      sekarang,
      semua: pesanan,
      menunggu: pesanan.filter((p) => p.masukPada + BATAS_BALAS_MS > sekarang),
    }),
    [sekarang, pesanan],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function usePesananMenunggu() {
  const nilai = useContext(Konteks);
  if (!nilai) {
    throw new Error("usePesananMenunggu harus dipakai di dalam PesananMenungguProvider");
  }
  return nilai;
}
