"use client";

// Keadaan pesanan untuk seluruh panel: badge sidebar, callout Beranda,
// keterangan metrik, dan daftar di layar Pesanan membaca sumber yang sama,
// jadi angka di sidebar tidak mungkin berbeda dengan isi tabel.
//
// Jamnya berangkat dari timestamp server, lalu maju memakai jam browser yang
// dikoreksi selisih terhadap server, jadi jam laptop yang salah tidak
// menggeser countdown batas 1 jam.
//
// Pembatalan otomatis di sini hanya turunan tampilan: pesanan pending yang
// lewat batas dihitung sebagai cancelled tanpa mengubah data aslinya. Di
// produk sungguhan pembatalan itu harus terjadi di server.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import { teksStatusBayar } from "@/lib/mitra/data-teks";
import { BATAS_BALAS_MS, type Pesanan } from "@/lib/mitra/tipe";

type Nilai = {
  sekarang: number;
  /** Seluruh pesanan, kedaluwarsa sudah ditandai cancelled. */
  pesanan: Pesanan[];
  menunggu: Pesanan[];
  /** Pesanan yang tadinya menunggu lalu diterima penyedia di sesi ini. */
  jumlahDiterima: number;
  /** Ditolak penyedia atau batal otomatis di sesi ini. */
  jumlahBatal: number;
  terima: (id: string) => void;
  tolak: (id: string) => void;
};

const Konteks = createContext<Nilai | null>(null);

export function PesananProvider({
  sekarangServer,
  pesanan,
  children,
}: {
  sekarangServer: number;
  pesanan: Pesanan[];
  children: React.ReactNode;
}) {
  // Render pertama memakai waktu server supaya HTML server dan hasil hidrasi
  // identik.
  const { bahasa } = useBahasa();
  const en = bahasa === "en";
  const dikembalikan = teksStatusBayar(bahasa).dikembalikan;
  const [sekarang, setSekarang] = useState(sekarangServer);
  const [daftar, setDaftar] = useState(pesanan);

  useEffect(() => {
    const selisih = sekarangServer - Date.now();
    const detak = () => setSekarang(Date.now() + selisih);
    detak();
    const id = setInterval(detak, 15_000);
    return () => clearInterval(id);
  }, [sekarangServer]);

  const terima = useCallback((id: string) => {
    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? { ...p, status: "active" as const, kembaliPada: p.selesai, masukPada: undefined }
          : p,
      ),
    );
  }, []);

  const tolak = useCallback((id: string) => {
    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "cancelled" as const,
              masukPada: undefined,
              statusBayar: dikembalikan,
              alasan: en ? "Declined by the provider" : "Ditolak penyedia",
            }
          : p,
      ),
    );
  }, [dikembalikan, en]);

  const nilai = useMemo<Nilai>(() => {
    const sesudahBatas = daftar.map((p) =>
      p.status === "pending" && p.masukPada && p.masukPada + BATAS_BALAS_MS <= sekarang
        ? {
            ...p,
            status: "cancelled" as const,
            statusBayar: dikembalikan,
            alasan: en ? "Cancelled automatically, past the 1-hour limit" : "Batal otomatis, lewat batas 1 jam",
          }
        : p,
    );

    const idAwalMenunggu = new Set(
      pesanan.filter((p) => p.status === "pending").map((p) => p.id),
    );
    const bekasMenunggu = sesudahBatas.filter((p) => idAwalMenunggu.has(p.id));

    return {
      sekarang,
      pesanan: sesudahBatas,
      menunggu: sesudahBatas.filter((p) => p.status === "pending"),
      jumlahDiterima: bekasMenunggu.filter((p) => p.status === "active").length,
      jumlahBatal: bekasMenunggu.filter((p) => p.status === "cancelled").length,
      terima,
      tolak,
    };
  }, [daftar, pesanan, sekarang, terima, tolak, dikembalikan, en]);

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function usePesanan() {
  const nilai = useContext(Konteks);
  if (!nilai) {
    throw new Error("usePesanan harus dipakai di dalam PesananProvider");
  }
  return nilai;
}
