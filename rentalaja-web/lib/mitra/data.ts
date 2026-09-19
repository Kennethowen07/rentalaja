// Satu-satunya pintu data panel mitra. Semua fungsi async walau isinya mock,
// supaya nanti cukup isi fungsinya yang diganti fetch ke API tanpa menyentuh
// komponen (project-brief, bagian "Status dan tech stack").
//
// Daftar pesanan adalah sumber tunggal: Beranda menurunkan "unit yang lagi
// keluar" dari pesanan berstatus active, jadi kedua layar tidak bisa lagi
// menampilkan angka yang berbeda.

import { cache } from "react";
import { connection } from "next/server";
import type { DataBeranda, Mitra, Pesanan, SerahTerima, Unit, UnitKeluar } from "./tipe";
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
      plat: "DK 8912 GH",
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
      plat: "DK 8912 GH",
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

// 18 unit, sesuai kicker "18 unit terdaftar" di spec. Mock desain hanya
// menggambar 6 baris padahal chipnya menghitung 18; kalau itu ditiru mentah,
// chip "Kosong · 11" akan membuka daftar kosong. Plat unit yang sedang
// disewa sengaja sama dengan plat di daftar pesanan, karena status "sedang
// keluar" diturunkan dari pesanan berjalan, bukan disimpan dua kali.
function semuaUnit(sekarang: number): Unit[] {
  const motor = (
    id: string,
    nama: string,
    plat: string,
    foto: string | null,
    spesifikasi: string,
    hargaPerHari: number,
    status: Unit["status"] = "available",
    servisSampai?: number,
  ): Unit => ({ id, nama, plat, foto, spesifikasi, hargaPerHari, status, servisSampai });

  return [
    // Enam unit di bawah platnya cocok dengan pesanan berstatus active.
    motor("u-01", "Honda Scoopy 2023", "DK 4821 XY", "/units/honda-scoopy-2023.jpeg", "matic 110cc · 2 helm", 70_000),
    motor("u-02", "Yamaha NMAX 155", "DK 1902 CD", "/units/yamaha-nmax-2022.webp", "matic 155cc · 2 helm", 110_000),
    motor("u-03", "Honda PCX 160", "DK 5127 AB", "/units/honda-pcx-160-2023.webp", "matic 160cc · 2 helm", 120_000),
    motor("u-04", "Honda Beat 2022", "DK 7734 EF", "/units/honda-beat-2022.webp", "matic 110cc · 1 helm", 65_000),
    motor("u-05", "Vespa Sprint 2021", "DK 2251 MN", "/units/vespa-sprint-2021.webp", "matic 150cc · 2 helm", 150_000),
    motor("u-06", "Yamaha Fino 2021", "DK 6043 PQ", "/units/yamaha-fino-2021.webp", "matic 125cc · 2 helm", 75_000),

    motor("u-07", "Toyota Avanza 2021", "DK 8890 GH", "/units/toyota-avanza-2021.webp", "MPV 7 kursi · bensin", 285_000),
    motor("u-08", "Toyota Avanza 2021", "DK 8912 GH", "/units/toyota-avanza-2021.webp", "MPV 7 kursi · bensin", 285_000),
    motor("u-09", "Honda Scoopy 2023", "DK 4835 XY", "/units/honda-scoopy-2023.jpeg", "matic 110cc · 2 helm", 70_000),
    motor("u-10", "Honda Scoopy 2022", "DK 4102 TR", "/units/honda-scoopy-2023.jpeg", "matic 110cc · 2 helm", 65_000),
    motor("u-11", "Honda Beat 2022", "DK 7740 EF", "/units/honda-beat-2022.webp", "matic 110cc · 1 helm", 65_000),
    motor("u-12", "Honda Beat 2021", "DK 7128 LM", "/units/honda-beat-2022.webp", "matic 110cc · 1 helm", 60_000),
    motor("u-13", "Yamaha NMAX 155", "DK 1955 CD", "/units/yamaha-nmax-2022.webp", "matic 155cc · 2 helm", 110_000),
    motor("u-14", "Yamaha Fino 2021", "DK 6077 PQ", "/units/yamaha-fino-2021.webp", "matic 125cc · 2 helm", 75_000),
    motor("u-15", "Vespa Sprint 2021", "DK 2260 MN", "/units/vespa-sprint-2021.webp", "matic 150cc · 2 helm", 150_000),
    motor("u-16", "Honda PCX 160", "DK 5130 AB", "/units/honda-pcx-160-2023.webp", "matic 160cc · 2 helm", 120_000),
    // Plat ini dipakai pesanan yang masih menunggu konfirmasi.
    motor("u-17", "Honda Vario 160", "DK 3390 GH", null, "matic 160cc · 2 helm", 95_000),

    motor("u-18", "Honda Vario 160", "DK 3312 JK", null, "matic 160cc · 2 helm", 95_000, "service", pukulWita(sekarang, 2, 17)),
  ];
}

export async function ambilUnit(): Promise<Unit[]> {
  const sekarang = await waktuServer();
  return semuaUnit(sekarang);
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

// Jadwal serah terima hari ini. Foto empat sisi hanya tersedia untuk Scoopy,
// jadi dua baris yang memang menampilkan foto memakai unit itu.
function semuaSerahTerima(sekarang: number): SerahTerima[] {
  const sisiKosong = ["depan", "belakang", "kiri", "kanan"].map((label) => ({
    label,
    foto: null,
  }));
  const sisiScoopy = ["depan", "belakang", "kiri", "kanan"].map((label) => ({
    label,
    foto: `/serah-terima/scoopy-${label}.webp`,
  }));

  return [
    {
      id: "st-01",
      jenis: "antar",
      unit: "Honda Vario 160",
      plat: "DK 3390 GH",
      foto: null,
      penyewa: "Dewi Anggraini",
      telepon: "+62 812-0000-0101",
      waktu: pukulWita(sekarang, 0, 13),
      titik: "Villa Canggu, Jl. Pantai Batu Bolong",
      status: "jadwal",
      sisi: sisiKosong,
      kondisi: [],
    },
    {
      id: "st-02",
      jenis: "ambil",
      unit: "Yamaha NMAX 155",
      plat: "DK 1902 CD",
      foto: "/units/yamaha-nmax-2022.webp",
      penyewa: "Sarah Miller",
      telepon: "+62 812-0000-0104",
      waktu: pukulWita(sekarang, 0, 17),
      titik: "Villa Berawa",
      catatan: "deposit Rp 300.000 ditahan",
      status: "jadwal",
      sisi: sisiKosong,
      kondisi: [],
    },
    {
      id: "st-03",
      jenis: "ambil",
      unit: "Honda PCX 160",
      plat: "DK 5127 AB",
      foto: "/units/honda-pcx-160-2023.webp",
      penyewa: "Kevin Tan",
      telepon: "+62 812-0000-0105",
      waktu: pukulWita(sekarang, -1, 9),
      titik: "Kantor rental",
      catatan: "belum ada konfirmasi",
      telat: true,
      status: "jadwal",
      sisi: sisiKosong,
      kondisi: [],
    },
    {
      id: "st-04",
      jenis: "ambil",
      unit: "Honda Scoopy 2023",
      plat: "DK 4835 XY",
      foto: "/units/honda-scoopy-2023.jpeg",
      penyewa: "Rina Wijaya",
      telepon: "+62 812-0000-0109",
      waktu: pukulWita(sekarang, -1, 16),
      titik: "Kantor rental",
      status: "menunggu-foto",
      sisi: sisiKosong,
      kondisi: [],
    },
    {
      id: "st-05",
      jenis: "antar",
      unit: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      foto: "/units/honda-scoopy-2023.jpeg",
      penyewa: "Adi Prasetyo",
      telepon: "+62 812-0000-0103",
      waktu: pukulWita(sekarang, 0, 9),
      titik: "Villa Canggu, Jl. Pantai Batu Bolong",
      status: "selesai",
      sisi: sisiScoopy,
      kondisi: [
        { label: "Odometer", nilai: "18.204 km" },
        { label: "Bensin", nilai: "Setengah" },
        { label: "Helm", nilai: "2 · jas hujan 1" },
        { label: "Goresan tercatat", nilai: "Spakbor kanan" },
      ],
    },
  ];
}

export async function ambilSerahTerima(): Promise<SerahTerima[]> {
  const sekarang = await waktuServer();
  return semuaSerahTerima(sekarang);
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
