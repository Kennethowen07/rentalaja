// Satu-satunya pintu data panel mitra. Semua fungsi async walau isinya mock,
// supaya nanti cukup isi fungsinya yang diganti fetch ke API tanpa menyentuh
// komponen (project-brief, bagian "Status dan tech stack").
//
// Daftar pesanan adalah sumber tunggal: Beranda menurunkan "unit yang lagi
// keluar" dari pesanan berstatus active, jadi kedua layar tidak bisa lagi
// menampilkan angka yang berbeda.

import { cache } from "react";
import { connection } from "next/server";
import type { DataBeranda, Mitra, Pesanan, UnitKeluar } from "./tipe";
import { MENIT, namaBulan, pukulWita } from "./waktu";

/** Waktu server satu request. Di-cache per request supaya layout dan halaman
 *  memakai milidetik yang sama, dan `connection()` membuat halaman dirender
 *  saat request, bukan diprerender dengan jam build yang basi. */
const waktuServer = cache(async () => {
  await connection();
  return Date.now();
});

export async function ambilWaktuServer(): Promise<number> {
  return waktuServer();
}

export async function ambilMitra(): Promise<Mitra> {
  return {
    nama: "Bali Motor Rent",
    pemilik: "Pak Wayan",
    jumlahUnit: 18,
    area: "Canggu, Badung",
  };
}

// Nomor telepon memakai awalan contoh, bukan nomor asli siapa pun.
function semuaPesanan(sekarang: number): Pesanan[] {
  return [
    {
      id: "RA-284207",
      unit: "Honda Vario 160",
      plat: "DK 3390 GH",
      foto: null,
      penyewa: "Dewi Anggraini",
      telepon: "+62 812-0000-0101",
      mulai: pukulWita(sekarang, 1, 9),
      selesai: pukulWita(sekarang, 3, 9),
      total: "Rp 285.000",
      statusBayar: "DP 30% terbayar",
      status: "pending",
      masukPada: sekarang - 18 * MENIT,
      titik: "antar ke Villa Canggu",
    },
    {
      id: "RA-284211",
      unit: "Toyota Avanza 2021",
      plat: "DK 8812 JK",
      foto: "/units/toyota-avanza-2021.webp",
      penyewa: "Michael Lim",
      telepon: "+62 812-0000-0102",
      mulai: pukulWita(sekarang, 2, 9),
      selesai: pukulWita(sekarang, 5, 9),
      total: "Rp 1.140.000",
      statusBayar: "DP 30% terbayar",
      status: "pending",
      masukPada: sekarang - 41 * MENIT,
      titik: "ambil di kantor",
    },

    {
      id: "RA-284102",
      unit: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      foto: "/units/honda-scoopy-2023.jpeg",
      penyewa: "Adi Prasetyo",
      telepon: "+62 812-0000-0103",
      mulai: pukulWita(sekarang, 0, 9),
      selesai: pukulWita(sekarang, 2, 9),
      kembaliPada: pukulWita(sekarang, 2, 9),
      total: "Rp 215.000",
      statusBayar: "Lunas",
      status: "active",
    },
    {
      id: "RA-284077",
      unit: "Yamaha NMAX 155",
      plat: "DK 1902 CD",
      foto: "/units/yamaha-nmax-2022.webp",
      penyewa: "Sarah Miller",
      telepon: "+62 812-0000-0104",
      mulai: pukulWita(sekarang, -2, 17),
      selesai: pukulWita(sekarang, 0, 17),
      kembaliPada: pukulWita(sekarang, 0, 17),
      total: "Rp 330.000",
      statusBayar: "Sisa tunai Rp 231.000",
      status: "active",
    },
    {
      id: "RA-283998",
      unit: "Honda PCX 160",
      plat: "DK 5127 AB",
      foto: "/units/honda-pcx-160-2023.webp",
      penyewa: "Kevin Tan",
      telepon: "+62 812-0000-0105",
      mulai: pukulWita(sekarang, -4, 9),
      selesai: pukulWita(sekarang, -1, 9),
      kembaliPada: pukulWita(sekarang, -1, 9),
      total: "Rp 480.000",
      statusBayar: "Lunas",
      status: "active",
      denda: "denda berjalan Rp 120.000",
    },
    {
      id: "RA-284150",
      unit: "Honda Beat 2022",
      plat: "DK 7734 EF",
      foto: "/units/honda-beat-2022.webp",
      penyewa: "Putu Andika",
      telepon: "+62 812-0000-0106",
      mulai: pukulWita(sekarang, -1, 8),
      selesai: pukulWita(sekarang, 3, 8),
      kembaliPada: pukulWita(sekarang, 3, 8),
      total: "Rp 300.000",
      statusBayar: "Lunas",
      status: "active",
    },
    {
      id: "RA-284166",
      unit: "Vespa Sprint 2021",
      plat: "DK 2251 MN",
      foto: "/units/vespa-sprint-2021.webp",
      penyewa: "Nicolas Meyer",
      telepon: "+62 812-0000-0107",
      mulai: pukulWita(sekarang, 0, 10),
      selesai: pukulWita(sekarang, 4, 10),
      kembaliPada: pukulWita(sekarang, 4, 10),
      total: "Rp 520.000",
      statusBayar: "Lunas",
      status: "active",
    },
    {
      id: "RA-284181",
      unit: "Yamaha Fino 2021",
      plat: "DK 6043 PQ",
      foto: "/units/yamaha-fino-2021.webp",
      penyewa: "Ayu Lestari",
      telepon: "+62 812-0000-0108",
      mulai: pukulWita(sekarang, -1, 11),
      selesai: pukulWita(sekarang, 1, 11),
      kembaliPada: pukulWita(sekarang, 1, 11),
      total: "Rp 190.000",
      statusBayar: "Sisa tunai Rp 133.000",
      status: "active",
    },

    {
      id: "RA-283812",
      unit: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      foto: "/units/honda-scoopy-2023.jpeg",
      penyewa: "Rina Wijaya",
      telepon: "+62 812-0000-0109",
      mulai: pukulWita(sekarang, -9, 9),
      selesai: pukulWita(sekarang, -6, 9),
      selesaiPada: pukulWita(sekarang, -6, 9),
      total: "Rp 215.000",
      statusBayar: "Lunas",
      status: "completed",
    },
    {
      id: "RA-283744",
      unit: "Toyota Avanza 2021",
      plat: "DK 8812 JK",
      foto: "/units/toyota-avanza-2021.webp",
      penyewa: "James Carter",
      telepon: "+62 812-0000-0110",
      mulai: pukulWita(sekarang, -12, 8),
      selesai: pukulWita(sekarang, -8, 8),
      selesaiPada: pukulWita(sekarang, -8, 8),
      total: "Rp 1.140.000",
      statusBayar: "Lunas",
      status: "completed",
    },
    {
      id: "RA-283905",
      unit: "Honda Beat 2022",
      plat: "DK 7734 EF",
      foto: "/units/honda-beat-2022.webp",
      penyewa: "Gede Surya",
      telepon: "+62 812-0000-0111",
      mulai: pukulWita(sekarang, -7, 10),
      selesai: pukulWita(sekarang, -5, 10),
      selesaiPada: pukulWita(sekarang, -5, 10),
      total: "Rp 150.000",
      statusBayar: "Lunas",
      status: "completed",
    },

    {
      id: "RA-283860",
      unit: "Yamaha NMAX 155",
      plat: "DK 1902 CD",
      foto: "/units/yamaha-nmax-2022.webp",
      penyewa: "Tom Becker",
      telepon: "+62 812-0000-0112",
      mulai: pukulWita(sekarang, -3, 9),
      selesai: pukulWita(sekarang, -1, 9),
      total: "Rp 330.000",
      statusBayar: "DP dikembalikan",
      status: "cancelled",
      alasan: "Dibatalkan penyewa",
    },
  ];
}

export async function ambilPesanan(): Promise<{
  sekarangServer: number;
  pesanan: Pesanan[];
}> {
  const sekarang = await waktuServer();
  // Mock: dua pesanan menunggu dihitung ulang tiap request (masuk 18 dan 41
  // menit lalu), jadi demo tidak pernah kehabisan pesanan menunggu. API
  // sungguhan mengembalikan createdAt tetap, dan pembatalan otomatis setelah
  // 1 jam harus terjadi di server, bukan hanya disembunyikan di client.
  return { sekarangServer: sekarang, pesanan: semuaPesanan(sekarang) };
}

export async function ambilBeranda(): Promise<DataBeranda> {
  const sekarang = await waktuServer();
  const berjalan = semuaPesanan(sekarang).filter((p) => p.status === "active");

  const daftar: UnitKeluar[] = berjalan.slice(0, 4).map((p) => ({
    id: p.id,
    nama: p.unit,
    plat: p.plat,
    penyewa: p.penyewa,
    foto: p.foto,
    kembaliPada: p.kembaliPada ?? p.selesai,
  }));

  const unitKeluarPerHari = [6, 8, 3, 2, 4, 4, 7];

  return {
    sekarang,
    pesananHariIni: { masuk: 7, dikonfirmasi: 5 },
    unitKeluar: { jumlah: berjalan.length, totalUnit: 18, daftar },
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
