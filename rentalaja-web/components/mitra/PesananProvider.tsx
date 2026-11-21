"use client";

// Keadaan pesanan untuk seluruh panel: badge sidebar, callout Beranda, dan
// daftar di layar Pesanan membaca sumber yang sama,
// jadi angka di sidebar tidak mungkin berbeda dengan isi tabel.
//
// Jamnya berangkat dari timestamp server, lalu maju memakai jam browser yang
// dikoreksi selisih terhadap server, jadi jam laptop yang salah tidak
// menggeser countdown batas 1 jam.
//
// Pembatalan otomatis di sini hanya turunan tampilan: pesanan pending yang
// lewat batas dihitung sebagai cancelled tanpa mengubah data aslinya. Di
// produk sungguhan pembatalan itu harus terjadi di server.

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { terimaPesanan, tolakPesanan } from "@/app/actions/mitra";
import { useBahasa } from "@/components/BahasaProvider";
import { BATAS_BALAS_MS, type Pesanan } from "@/lib/mitra/tipe";

type Nilai = {
  sekarang: number;
  /** Seluruh pesanan, kedaluwarsa sudah ditandai cancelled. */
  pesanan: Pesanan[];
  menunggu: Pesanan[];
  terima: (id: string) => void;
  tolak: (id: string) => void;
};

const Konteks = createContext<Nilai | null>(null);

export function PesananProvider({
  sekarangServer,
  pesanan,
  nyata = false,
  children,
}: {
  sekarangServer: number;
  pesanan: Pesanan[];
  /** true = data dari rentalaja-api: terima/tolak dikirim ke server. */
  nyata?: boolean;
  children: React.ReactNode;
}) {
  // Render pertama memakai waktu server supaya HTML server dan hasil hidrasi
  // identik.
  const { bahasa } = useBahasa();
  const en = bahasa === "en";
  const [sekarang, setSekarang] = useState(sekarangServer);
  const [daftar, setDaftar] = useState(pesanan);
  const router = useRouter();
  // Salinan terbaru untuk dikembalikan kalau server menolak aksi.
  const daftarRef = useRef(daftar);
  daftarRef.current = daftar;

  // Data baru dari server (router.refresh() setelah aksi) menggantikan state
  // lokal, termasuk perubahan optimistis yang tadi dibuat di sini.
  useEffect(() => {
    setDaftar(pesanan);
  }, [pesanan]);

  /** Mode API: kirim aksi, lalu muat ulang data dari server. Kalau ditolak
   *  (mis. batas 1 jam baru saja lewat), tampilan dikembalikan. */
  const kirim = useCallback(
    async (aksi: () => Promise<{ ok: true } | { ok: false; pesan: string }>, sebelum: Pesanan[]) => {
      const h = await aksi().catch(() => ({ ok: false as const, pesan: en ? "The server can't be reached right now." : "Server sedang tidak bisa dihubungi." }));
      if (!h.ok) {
        setDaftar(sebelum);
        window.alert(h.pesan);
      }
      router.refresh();
    },
    [router, en],
  );

  useEffect(() => {
    const selisih = sekarangServer - Date.now();
    const detak = () => setSekarang(Date.now() + selisih);
    detak();
    const id = setInterval(detak, 15_000);
    return () => clearInterval(id);
  }, [sekarangServer]);

  const terima = useCallback((id: string) => {
    if (nyata) void kirim(() => terimaPesanan(id), daftarRef.current);
    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? { ...p, status: "active" as const, kembaliPada: p.selesai, masukPada: undefined }
          : p,
      ),
    );
  }, [nyata, kirim]);

  const tolak = useCallback((id: string) => {
    if (nyata) void kirim(() => tolakPesanan(id), daftarRef.current);
    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "cancelled" as const,
              masukPada: undefined,
              alasan: en ? "Declined by the provider" : "Ditolak penyedia",
            }
          : p,
      ),
    );
  }, [en, nyata, kirim]);

  const nilai = useMemo<Nilai>(() => {
    const sesudahBatas = daftar.map((p) =>
      p.status === "pending" && p.masukPada && p.masukPada + BATAS_BALAS_MS <= sekarang
        ? {
            ...p,
            status: "cancelled" as const,
            alasan: en ? "Cancelled automatically, past the 1-hour limit" : "Batal otomatis, lewat batas 1 jam",
          }
        : p,
    );

    return {
      sekarang,
      pesanan: sesudahBatas,
      menunggu: sesudahBatas.filter((p) => p.status === "pending"),
      terima,
      tolak,
    };
  }, [daftar, sekarang, terima, tolak, en]);

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function usePesanan() {
  const nilai = useContext(Konteks);
  if (!nilai) {
    throw new Error("usePesanan harus dipakai di dalam PesananProvider");
  }
  return nilai;
}
