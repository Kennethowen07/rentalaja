// Satu-satunya pintu data panel mitra. Semua fungsi async walau isinya mock,
// supaya nanti cukup isi fungsinya yang diganti fetch ke API tanpa menyentuh
// komponen (project-brief, bagian "Status dan tech stack").

import { cache } from "react";
import { connection } from "next/server";
import type { DataBeranda, Mitra, PesananMenunggu, UnitKeluar } from "./tipe";
import { MENIT, namaBulan, pukulWita } from "./waktu";

/** Waktu server satu request. Di-cache per request supaya layout dan halaman
 *  memakai milidetik yang sama, dan `connection()` membuat halaman dirender
 *  saat request, bukan diprerender dengan jam build yang basi. */
const waktuServer = cache(async () => {
  await connection();
  return Date.now();
});

export async function ambilMitra(): Promise<Mitra> {
  return {
    nama: "Bali Motor Rent",
    pemilik: "Pak Wayan",
    jumlahUnit: 18,
    area: "Canggu, Badung",
  };
}

export async function ambilPesananMenunggu(): Promise<{
  sekarangServer: number;
  pesanan: PesananMenunggu[];
}> {
  const sekarang = await waktuServer();
  // Mock: pesanan masuk 18 dan 6 menit sebelum request. Karena dihitung ulang
  // tiap request, demo tidak pernah kehabisan pesanan menunggu. API sungguhan
  // mengembalikan createdAt tetap dari database.
  return {
    sekarangServer: sekarang,
    pesanan: [
      { id: "RA-284207", masukPada: sekarang - 18 * MENIT },
      { id: "RA-284211", masukPada: sekarang - 6 * MENIT },
    ],
  };
}

export async function ambilBeranda(): Promise<DataBeranda> {
  const sekarang = await waktuServer();

  const daftar: UnitKeluar[] = [
    {
      id: "honda-scoopy-2023",
      nama: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      penyewa: "Adi Prasetyo",
      foto: "/units/honda-scoopy-2023.jpeg",
      kembaliPada: pukulWita(sekarang, 2, 9),
    },
    {
      id: "yamaha-nmax-155",
      nama: "Yamaha NMAX 155",
      plat: "DK 1902 CD",
      penyewa: "Sarah Miller",
      foto: "/units/yamaha-nmax-2022.webp",
      kembaliPada: pukulWita(sekarang, 0, 17),
    },
    {
      id: "honda-pcx-160",
      nama: "Honda PCX 160",
      plat: "DK 5127 AB",
      penyewa: "Kevin Tan",
      foto: "/units/honda-pcx-160-2023.webp",
      kembaliPada: pukulWita(sekarang, -1, 9),
    },
    {
      id: "honda-beat-2022",
      nama: "Honda Beat 2022",
      plat: "DK 7734 EF",
      penyewa: "Putu Andika",
      foto: "/units/honda-beat-2022.webp",
      kembaliPada: pukulWita(sekarang, 3, 8),
    },
  ];

  const unitKeluarPerHari = [6, 8, 3, 2, 4, 4, 7];

  return {
    sekarang,
    pesananHariIni: { masuk: 7, dikonfirmasi: 5 },
    unitKeluar: { jumlah: 6, totalUnit: 18, daftar },
    pendapatan: {
      bulan: namaBulan(sekarang),
      nilai: "Rp 24,8jt",
      keterangan: `naik 18% dari ${namaBulan(sekarang, -1)}`,
    },
    mingguIni: unitKeluarPerHari.map((jumlah, i) => ({
      tanggal: pukulWita(sekarang, i, 12),
      jumlah,
    })),
  };
}
