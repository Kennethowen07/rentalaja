"use client";

// Keterangan metrik "Pesanan masuk hari ini". Ikut jam yang sama dengan
// callout, supaya angka "menunggu" di sini tidak berbeda dengan callout
// setelah ada pesanan yang batal otomatis.

import { usePesananMenunggu } from "./PesananMenungguProvider";

export default function KeteranganPesananHariIni({ dikonfirmasi }: { dikonfirmasi: number }) {
  const { semua, menunggu } = usePesananMenunggu();
  const batal = semua.length - menunggu.length;
  return (
    <>
      {dikonfirmasi} dikonfirmasi, {menunggu.length} menunggu
      {batal > 0 && `, ${batal} batal otomatis`}
    </>
  );
}
