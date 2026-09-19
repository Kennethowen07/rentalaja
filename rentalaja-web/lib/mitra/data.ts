// Satu-satunya pintu data panel mitra. Semua fungsi async walau isinya mock,
// supaya nanti cukup isi fungsinya yang diganti fetch ke API tanpa menyentuh
// komponen (project-brief, bagian "Status dan tech stack").
//
// Daftar pesanan adalah sumber tunggal: Beranda menurunkan "unit yang lagi
// keluar" dari pesanan berstatus active, jadi kedua layar tidak bisa lagi
// menampilkan angka yang berbeda.

import { cache } from "react";
import { connection } from "next/server";
import type {
  DataBeranda,
  Mitra,
  Periode,
  Pesanan,
  CatatanSerah,
  RingkasanUlasan,
  Transaksi,
  Ulasan,
  Unit,
  UnitKeluar,
} from "./tipe";
import { MENIT, namaBulan, pukulWita, tanggalSingkat } from "./waktu";

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
      mulai: pukulWita(sekarang, 0, 13),
      selesai: pukulWita(sekarang, 2, 13),
      total: "Rp 285.000",
      statusBayar: "DP 30% terbayar",
      status: "pending",
      masukPada: sekarang - 18 * MENIT,
      titik: "Villa Canggu, Jl. Pantai Batu Bolong",
      diantar: true,
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
      titik: "Kantor rental",
      diantar: false,
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
      titik: "Villa Canggu, Jl. Pantai Batu Bolong",
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
      titik: "Villa Berawa",
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
      titik: "Kantor rental",
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
      titik: "Villa Tiying Tutul",
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
      titik: "Hotel Pererenan",
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
      titik: "Kantor rental",
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

// Pendapatan sengaja tidak diturunkan dari daftar pesanan: daftar itu hanya
// contoh belasan pesanan, sementara angka di layar ini mewakili seluruh bulan
// dari 18 unit. Menurunkannya akan membuat angka bulanan terlihat jauh lebih
// kecil daripada di Beranda.
function semuaPeriode(sekarang: number): Periode[] {
  const transaksiTerbaru: Transaksi[] = [
    {
      id: "tr-01",
      judul: "DP masuk · Honda Vario 160",
      meta: `${tanggalSingkat(pukulWita(sekarang, 0, 9, 24))} 09.24 · Dewi Anggraini · BCA VA`,
      nilai: 85_500,
      arah: "masuk",
    },
    {
      id: "tr-02",
      judul: "Tunai diterima · Honda Scoopy 2023",
      meta: `${tanggalSingkat(pukulWita(sekarang, 0, 9, 5))} 09.05 · Adi Prasetyo`,
      nilai: 147_000,
      arah: "masuk",
    },
    {
      id: "tr-03",
      judul: "Biaya layanan · pesanan #RA-284102",
      meta: `${tanggalSingkat(pukulWita(sekarang, 0, 9, 5))} 09.05 · dipotong otomatis`,
      nilai: 10_750,
      arah: "keluar",
    },
    {
      id: "tr-04",
      judul: "DP masuk · Toyota Avanza 2021",
      meta: `${tanggalSingkat(pukulWita(sekarang, -1, 20, 14))} 20.14 · Michael Lim · BCA VA`,
      nilai: 342_000,
      arah: "masuk",
    },
    {
      id: "tr-05",
      judul: "Pencairan ke rekening",
      meta: `${tanggalSingkat(pukulWita(sekarang, -3, 10))} 10.00 · BCA ···4471`,
      nilai: 6_200_000,
      arah: "keluar",
    },
  ];

  const bulanIni = namaBulan(sekarang);
  const bulanLalu = namaBulan(sekarang, -1);
  const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    day: "numeric",
  }).format(sekarang);

  return [
    {
      kunci: "bulan-ini",
      label: `${bulanIni} berjalan`,
      rentang: `1 – ${tanggalHariIni} ${bulanIni} ${new Date(sekarang).getFullYear()}`,
      kotor: 24_800_000,
      biaya: 1_240_000,
      bersih: 23_560_000,
      bandingan: `naik 18% dari ${bulanLalu}`,
      transaksi: transaksiTerbaru,
      sumber: [
        { label: "Motor", nilai: 15_800_000 },
        { label: "Mobil", nilai: 7_400_000 },
        { label: "Tambahan", nilai: 1_600_000 },
      ],
    },
    {
      kunci: "bulan-lalu",
      label: `${bulanLalu} penuh`,
      rentang: `${bulanLalu} ${new Date(sekarang).getFullYear()}`,
      kotor: 21_000_000,
      biaya: 1_050_000,
      bersih: 19_950_000,
      bandingan: "naik 9% dari bulan sebelumnya",
      transaksi: [
        {
          id: "tr-11",
          judul: "Pencairan ke rekening",
          meta: `${tanggalSingkat(pukulWita(sekarang, -24, 10))} 10.00 · BCA ···4471`,
          nilai: 8_400_000,
          arah: "keluar",
        },
        {
          id: "tr-12",
          judul: "DP masuk · Yamaha NMAX 155",
          meta: `${tanggalSingkat(pukulWita(sekarang, -26, 15, 40))} 15.40 · Tom Becker · BCA VA`,
          nilai: 99_000,
          arah: "masuk",
        },
        {
          id: "tr-13",
          judul: "Denda keterlambatan · Honda Beat 2022",
          meta: `${tanggalSingkat(pukulWita(sekarang, -28, 11))} 11.00 · Gede Surya`,
          nilai: 60_000,
          arah: "masuk",
        },
      ],
      sumber: [
        { label: "Motor", nilai: 13_400_000 },
        { label: "Mobil", nilai: 6_200_000 },
        { label: "Tambahan", nilai: 1_400_000 },
      ],
    },
    {
      kunci: "90-hari",
      label: "90 hari terakhir",
      rentang: `90 hari sampai ${tanggalSingkat(sekarang)}`,
      kotor: 62_400_000,
      biaya: 3_120_000,
      bersih: 59_280_000,
      bandingan: "rata-rata Rp 20,8jt per bulan",
      transaksi: transaksiTerbaru,
      sumber: [
        { label: "Motor", nilai: 39_500_000 },
        { label: "Mobil", nilai: 18_700_000 },
        { label: "Tambahan", nilai: 4_200_000 },
      ],
    },
  ];
}

// Catatan serah terima yang sudah tercatat, dikunci ke id pesanan. Jadwalnya
// sendiri tidak disimpan di sini: layar Serah terima menurunkannya dari
// pesanan berjalan, jadi pesanan yang baru diterima langsung muncul.
export async function ambilCatatanSerah(): Promise<Record<string, CatatanSerah>> {
  return {
    "RA-284102-antar": {
      sisi: ["depan", "belakang", "kiri", "kanan"].map((label) => ({
        label,
        foto: `/serah-terima/scoopy-${label}.webp`,
      })),
      kondisi: [
        { label: "Odometer", nilai: "18.204 km" },
        { label: "Bensin", nilai: "Setengah" },
        { label: "Helm", nilai: "2 · jas hujan 1" },
        { label: "Goresan tercatat", nilai: "Spakbor kanan" },
      ],
    },
    "RA-284077-ambil": {
      sisi: ["depan", "belakang", "kiri", "kanan"].map((label) => ({ label, foto: null })),
      kondisi: [
        { label: "Odometer", nilai: "24.910 km" },
        { label: "Bensin", nilai: "Seperempat" },
        { label: "Helm", nilai: "2 · jas hujan 1" },
        { label: "Goresan tercatat", nilai: "Tidak ada" },
      ],
    },
  };
}

export async function ambilPendapatan(): Promise<Periode[]> {
  const sekarang = await waktuServer();
  return semuaPeriode(sekarang);
}

// Delapan ulasan terbaru. Ringkasan di kolom kanan tetap memakai angka
// sepanjang 12 bulan (142 ulasan) seperti spec, sedangkan chip filter
// menghitung yang benar-benar tampil, supaya mengklik chip tidak membuka
// daftar yang isinya jauh lebih sedikit dari angkanya.
function semuaUlasan(sekarang: number): Ulasan[] {
  return [
    {
      id: "ul-01",
      nama: "Sarah M.",
      unit: "Yamaha NMAX 155",
      skor: 5,
      tanggal: pukulWita(sekarang, -1, 18),
      isi: "Unit bersih, diantar tepat jam 9. Foto serah terima bikin tenang, jadi tidak ada debat waktu kembalikan.",
    },
    {
      id: "ul-02",
      nama: "Kevin T.",
      unit: "Honda PCX 160",
      skor: 4,
      tanggal: pukulWita(sekarang, -3, 11),
      isi: "Motor oke, tapi jas hujan cuma satu padahal disewa berdua.",
      balasan:
        "Maaf ya Kevin, jas hujan kedua sudah kami tambahkan di semua unit sejak minggu ini.",
    },
    {
      id: "ul-03",
      nama: "Putu A.",
      unit: "Honda Beat 2022",
      skor: 5,
      tanggal: pukulWita(sekarang, -4, 9),
      isi: "Harga jelas di depan, tidak ada biaya tambahan waktu ambil unit.",
    },
    {
      id: "ul-04",
      nama: "Michael L.",
      unit: "Toyota Avanza 2021",
      skor: 3.5,
      tanggal: pukulWita(sekarang, -6, 16),
      isi: "Mobil sesuai foto, cuma telat 30 menit waktu antar karena macet.",
    },
    {
      id: "ul-05",
      nama: "Rina W.",
      unit: "Honda Scoopy 2023",
      skor: 5,
      tanggal: pukulWita(sekarang, -8, 13),
      isi: "Scoopy-nya masih baru dan bensin penuh waktu diantar. Prosesnya cepat, tidak perlu chat panjang.",
      balasan: "Terima kasih Rina, senang bisa membantu. Sampai jumpa lagi di Canggu.",
    },
    {
      id: "ul-06",
      nama: "Tom B.",
      unit: "Yamaha NMAX 155",
      skor: 3.5,
      tanggal: pukulWita(sekarang, -11, 10),
      isi: "Pengembalian agak lama karena saya harus menunggu pemilik datang ke titik janjian.",
      balasan:
        "Terima kasih masukannya Tom. Sekarang jadwal ambil kembali kami kunci di aplikasi supaya tidak bentrok.",
    },
    {
      id: "ul-07",
      nama: "Ayu L.",
      unit: "Yamaha Fino 2021",
      skor: 4.5,
      tanggal: pukulWita(sekarang, -14, 15),
      isi: "Fino nyaman buat keliling Canggu, helm bersih dan wangi.",
      balasan: "Makasih Ayu, helm memang kami cuci tiap unit kembali.",
    },
    {
      id: "ul-08",
      nama: "Nicolas M.",
      unit: "Vespa Sprint 2021",
      skor: 5,
      tanggal: pukulWita(sekarang, -18, 12),
      isi: "Vespa terawat, pemiliknya ramah dan balas cepat sebelum saya pesan.",
      balasan: "Terima kasih Nicolas, titip salam buat rombongannya.",
    },
  ];
}

export async function ambilUlasan(): Promise<{
  daftar: Ulasan[];
  ringkasan: RingkasanUlasan;
}> {
  const sekarang = await waktuServer();
  return {
    daftar: semuaUlasan(sekarang),
    ringkasan: {
      rata: 4.9,
      total: 142,
      distribusi: [
        { bintang: 5, jumlah: 124 },
        { bintang: 4, jumlah: 12 },
        { bintang: 3, jumlah: 4 },
        { bintang: 2, jumlah: 1 },
        { bintang: 1, jumlah: 1 },
      ],
    },
  };
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
