"use client";

// Keterangan metrik "Pesanan masuk hari ini". Ikut keadaan pesanan yang sama
// dengan callout dan badge sidebar, jadi begitu satu pesanan diterima atau
// ditolak di layar Pesanan, angka di Beranda ikut berubah.

import { usePesanan } from "./PesananProvider";

export default function KeteranganPesananHariIni({ dikonfirmasi }: { dikonfirmasi: number }) {
  const { menunggu, jumlahDiterima, jumlahBatal } = usePesanan();
  return (
    <>
      {dikonfirmasi + jumlahDiterima} dikonfirmasi, {menunggu.length} menunggu
      {jumlahBatal > 0 && `, ${jumlahBatal} batal`}
    </>
  );
}
