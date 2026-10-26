// Satu-satunya pintu data panel mitra. Semua fungsi async walau isinya mock,
// supaya nanti cukup isi fungsinya yang diganti fetch ke API tanpa menyentuh
// komponen (project-brief, bagian "Status dan tech stack").
//
// Daftar pesanan adalah sumber tunggal: Beranda menurunkan "unit yang lagi
// keluar" dari pesanan berstatus active, jadi kedua layar tidak bisa lagi
// menampilkan angka yang berbeda.
//
// Setiap fungsi menerima `bahasa` (bawaan "id"); teks bebas di mock (status
// dana, alasan batal, transaksi, ulasan, ...) punya padanan Inggris di sini.

import { cache } from "react";
import { connection } from "next/server";
import type { Bahasa } from "@/lib/i18n";
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
import { rupiahSingkat } from "./format";
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

/** Pemilih teks: t(bahasa)("Indonesia", "English"). */
const t = (bahasa: Bahasa) => (id: string, en: string) => (bahasa === "en" ? en : id);

export async function ambilMitra(): Promise<Mitra> {
  return {
    nama: "Bali Motor Rent",
    pemilik: "Pak Wayan",
    jumlahUnit: 18,
    area: "Canggu, Badung",
  };
}

// Nomor telepon memakai awalan contoh, bukan nomor asli siapa pun.
function semuaPesanan(sekarang: number, bahasa: Bahasa): Pesanan[] {
  const p = t(bahasa);
  const kantor = p("Kantor rental", "Rental office");

  return [
    {
      id: "RA-284207",
      unit: "Honda Vario 160",
      plat: "DK 3390 GH",
      foto: "/units/honda-vario-160-2022.webp",
      penyewa: "Dewi Anggraini",
      telepon: "+62 812-0000-0101",
      mulai: pukulWita(sekarang, 0, 13),
      selesai: pukulWita(sekarang, 2, 13),
      total: "Rp 285.000",
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
      status: "pending",
      masukPada: sekarang - 41 * MENIT,
      titik: kantor,
      diantar: false,
    },

    {
      id: "RA-284102",
      unit: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      foto: "/units/honda-scoopy-2023.webp",
      penyewa: "Adi Prasetyo",
      telepon: "+62 812-0000-0103",
      mulai: pukulWita(sekarang, 0, 9),
      selesai: pukulWita(sekarang, 2, 9),
      kembaliPada: pukulWita(sekarang, 2, 9),
      total: "Rp 215.000",
      status: "active",
      titik: "Villa Canggu, Jl. Pantai Batu Bolong",
      diantar: true,
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
      status: "active",
      titik: "Villa Berawa",
      diantar: true,
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
      status: "active",
      denda: p("denda berjalan Rp 120.000", "late fee so far Rp 120.000"),
      titik: kantor,
      diantar: false,
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
      status: "active",
      titik: "Villa Tiying Tutul",
      diantar: true,
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
      status: "active",
      titik: "Hotel Pererenan",
      diantar: true,
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
      status: "active",
      titik: kantor,
      diantar: false,
    },

    {
      id: "RA-283812",
      unit: "Honda Scoopy 2023",
      plat: "DK 4821 XY",
      foto: "/units/honda-scoopy-2023.webp",
      penyewa: "Rina Wijaya",
      telepon: "+62 812-0000-0109",
      mulai: pukulWita(sekarang, -9, 9),
      selesai: pukulWita(sekarang, -6, 9),
      selesaiPada: pukulWita(sekarang, -6, 9),
      total: "Rp 215.000",
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
      status: "cancelled",
      alasan: p("Dibatalkan penyewa", "Cancelled by the renter"),
    },
  ];
}

// 18 unit, sesuai kicker "18 unit terdaftar" di spec. Mock desain hanya
// menggambar 6 baris padahal chipnya menghitung 18; kalau itu ditiru mentah,
// chip "Kosong · 11" akan membuka daftar kosong. Plat unit yang sedang
// disewa sengaja sama dengan plat di daftar pesanan, karena status "sedang
// keluar" diturunkan dari pesanan berjalan, bukan disimpan dua kali.
function semuaUnit(sekarang: number, bahasa: Bahasa): Unit[] {
  const motor = (
    id: string,
    nama: string,
    plat: string,
    foto: string | null,
    hargaPerHari: number,
    status: Unit["status"] = "available",
    servisSampai?: number,
  ): Unit => ({ id, nama, plat, foto, hargaPerHari, status, servisSampai });

  return [
    // Enam unit di bawah platnya cocok dengan pesanan berstatus active.
    motor("u-01", "Honda Scoopy 2023", "DK 4821 XY", "/units/honda-scoopy-2023.webp", 70_000),
    motor("u-02", "Yamaha NMAX 155", "DK 1902 CD", "/units/yamaha-nmax-2022.webp", 110_000),
    motor("u-03", "Honda PCX 160", "DK 5127 AB", "/units/honda-pcx-160-2023.webp", 120_000),
    motor("u-04", "Honda Beat 2022", "DK 7734 EF", "/units/honda-beat-2022.webp", 65_000),
    motor("u-05", "Vespa Sprint 2021", "DK 2251 MN", "/units/vespa-sprint-2021.webp", 150_000),
    motor("u-06", "Yamaha Fino 2021", "DK 6043 PQ", "/units/yamaha-fino-2021.webp", 75_000),

    motor("u-07", "Toyota Avanza 2021", "DK 8890 GH", "/units/toyota-avanza-2021.webp", 285_000),
    motor("u-08", "Toyota Avanza 2021", "DK 8912 GH", "/units/toyota-avanza-2021.webp", 285_000),
    motor("u-09", "Honda Scoopy 2023", "DK 4835 XY", "/units/honda-scoopy-2023.webp", 70_000),
    motor("u-10", "Honda Scoopy 2022", "DK 4102 TR", "/units/honda-scoopy-2023.webp", 65_000),
    motor("u-11", "Honda Beat 2022", "DK 7740 EF", "/units/honda-beat-2022.webp", 65_000),
    motor("u-12", "Honda Beat 2021", "DK 7128 LM", "/units/honda-beat-2022.webp", 60_000),
    motor("u-13", "Yamaha NMAX 155", "DK 1955 CD", "/units/yamaha-nmax-2022.webp", 110_000),
    motor("u-14", "Yamaha Fino 2021", "DK 6077 PQ", "/units/yamaha-fino-2021.webp", 75_000),
    motor("u-15", "Vespa Sprint 2021", "DK 2260 MN", "/units/vespa-sprint-2021.webp", 150_000),
    motor("u-16", "Honda PCX 160", "DK 5130 AB", "/units/honda-pcx-160-2023.webp", 120_000),
    // Plat ini dipakai pesanan yang masih menunggu konfirmasi.
    motor("u-17", "Honda Vario 160", "DK 3390 GH", "/units/honda-vario-160-2022.webp", 95_000),

    motor("u-18", "Honda Vario 160", "DK 3312 JK", "/units/honda-vario-160-2022.webp", 95_000, "service", pukulWita(sekarang, 2, 17)),
  ];
}

export async function ambilUnit(bahasa: Bahasa = "id"): Promise<Unit[]> {
  const sekarang = await waktuServer();
  return semuaUnit(sekarang, bahasa);
}

export async function ambilPesanan(bahasa: Bahasa = "id"): Promise<{
  sekarangServer: number;
  pesanan: Pesanan[];
}> {
  const sekarang = await waktuServer();
  // Mock: dua pesanan menunggu dihitung ulang tiap request (masuk 18 dan 41
  // menit lalu), jadi demo tidak pernah kehabisan pesanan menunggu. API
  // sungguhan mengembalikan createdAt tetap, dan pembatalan otomatis setelah
  // 1 jam harus terjadi di server, bukan hanya disembunyikan di client.
  return { sekarangServer: sekarang, pesanan: semuaPesanan(sekarang, bahasa) };
}

// Pendapatan sengaja tidak diturunkan dari daftar pesanan: daftar itu hanya
// contoh belasan pesanan, sementara angka di layar ini mewakili seluruh bulan
// dari 18 unit. Menurunkannya akan membuat angka bulanan terlihat jauh lebih
// kecil daripada di Beranda.
function semuaPeriode(sekarang: number, bahasa: Bahasa): Periode[] {
  const p = t(bahasa);
  // Hanya dana yang sudah benar-benar diterima penyedia. Dana yang masih
  // ditahan escrow belum dihitung sampai unitnya kembali.
  const tanggal = (geserHari: number) => tanggalSingkat(pukulWita(sekarang, geserHari, 12), bahasa);
  const danaMasuk = p("Dana masuk", "Funds received");
  const biayaLayanan = p("Biaya layanan", "Service fee");
  const pencairan = p("Pencairan ke rekening", "Payout to bank account");

  const transaksiTerbaru: Transaksi[] = [
    { id: "tr-01", judul: `${danaMasuk} · Honda Scoopy 2023`, meta: tanggal(0), nilai: 147_000, arah: "masuk" },
    { id: "tr-02", judul: biayaLayanan, meta: tanggal(0), nilai: 10_750, arah: "keluar" },
    { id: "tr-03", judul: `${danaMasuk} · Yamaha Fino 2021`, meta: tanggal(-1), nilai: 171_000, arah: "masuk" },
    { id: "tr-04", judul: biayaLayanan, meta: tanggal(-1), nilai: 9_000, arah: "keluar" },
    { id: "tr-05", judul: pencairan, meta: tanggal(-3), nilai: 6_200_000, arah: "keluar" },
  ];

  const bulanIni = namaBulan(sekarang, 0, bahasa);
  const bulanLalu = namaBulan(sekarang, -1, bahasa);
  const tahun = new Date(sekarang).getFullYear();
  const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    day: "numeric",
  }).format(sekarang);
  const sumber = (motor: number, mobil: number, tambahan: number) => [
    { label: p("Motor", "Scooters"), nilai: motor },
    { label: p("Mobil", "Cars"), nilai: mobil },
    { label: p("Tambahan", "Extras"), nilai: tambahan },
  ];

  return [
    {
      kunci: "bulan-ini",
      label: p(`${bulanIni} berjalan`, `${bulanIni} to date`),
      rentang: `1 – ${tanggalHariIni} ${bulanIni} ${tahun}`,
      kotor: 24_800_000,
      biaya: 1_240_000,
      bersih: 23_560_000,
      // Enam sewa yang sedang berjalan, setelah dipotong biaya layanan 5%.
      ditahan: 1_933_250,
      transaksi: transaksiTerbaru,
      sumber: sumber(15_800_000, 7_400_000, 1_600_000),
    },
    {
      kunci: "bulan-lalu",
      label: p(`${bulanLalu} penuh`, `All of ${bulanLalu}`),
      rentang: `${bulanLalu} ${tahun}`,
      kotor: 21_000_000,
      biaya: 1_050_000,
      bersih: 19_950_000,
      ditahan: 0,
      transaksi: [
        { id: "tr-11", judul: pencairan, meta: tanggal(-24), nilai: 8_400_000, arah: "keluar" },
        { id: "tr-12", judul: `${danaMasuk} · Yamaha NMAX 155`, meta: tanggal(-26), nilai: 99_000, arah: "masuk" },
        {
          id: "tr-13",
          judul: `${p("Denda keterlambatan", "Late fee")} · Honda Beat 2022`,
          meta: tanggal(-28),
          nilai: 60_000,
          arah: "masuk",
        },
      ],
      sumber: sumber(13_400_000, 6_200_000, 1_400_000),
    },
    {
      kunci: "90-hari",
      label: p("90 hari terakhir", "Last 90 days"),
      rentang: p(`90 hari sampai ${tanggalSingkat(sekarang)}`, `90 days to ${tanggalSingkat(sekarang, bahasa)}`),
      kotor: 62_400_000,
      biaya: 3_120_000,
      bersih: 59_280_000,
      ditahan: 0,
      transaksi: transaksiTerbaru,
      sumber: sumber(39_500_000, 18_700_000, 4_200_000),
    },
  ];
}

// Catatan serah terima yang sudah tercatat, dikunci ke id pesanan. Jadwalnya
// sendiri tidak disimpan di sini: layar Serah terima menurunkannya dari
// pesanan berjalan, jadi pesanan yang baru diterima langsung muncul.
export async function ambilCatatanSerah(bahasa: Bahasa = "id"): Promise<Record<string, CatatanSerah>> {
  const p = t(bahasa);
  // Nama berkas foto memakai label Indonesia; yang tampil ikut bahasa.
  const sisi = ["depan", "belakang", "kiri", "kanan"] as const;
  const labelSisi: Record<(typeof sisi)[number], string> = {
    depan: p("depan", "front"),
    belakang: p("belakang", "rear"),
    kiri: p("kiri", "left"),
    kanan: p("kanan", "right"),
  };
  const helm = p("2 · jas hujan 1", "2 · 1 raincoat");

  return {
    "RA-284102-antar": {
      sisi: sisi.map((s) => ({ label: labelSisi[s], foto: `/serah-terima/scoopy-${s}.webp` })),
      kondisi: [
        { label: "Odometer", nilai: p("18.204 km", "18,204 km") },
        { label: p("Bensin", "Fuel"), nilai: p("Setengah", "Half") },
        { label: p("Helm", "Helmets"), nilai: helm },
        { label: p("Goresan tercatat", "Recorded scratches"), nilai: p("Spakbor kanan", "Right fender") },
      ],
    },
    "RA-284077-ambil": {
      sisi: sisi.map((s) => ({ label: labelSisi[s], foto: null })),
      kondisi: [
        { label: "Odometer", nilai: p("24.910 km", "24,910 km") },
        { label: p("Bensin", "Fuel"), nilai: p("Seperempat", "Quarter") },
        { label: p("Helm", "Helmets"), nilai: helm },
        { label: p("Goresan tercatat", "Recorded scratches"), nilai: p("Tidak ada", "None") },
      ],
    },
  };
}

export async function ambilPendapatan(bahasa: Bahasa = "id"): Promise<Periode[]> {
  const sekarang = await waktuServer();
  return semuaPeriode(sekarang, bahasa);
}

// Delapan ulasan terbaru. Ringkasan di kolom kanan tetap memakai angka
// sepanjang 12 bulan (142 ulasan) seperti spec, sedangkan chip filter
// menghitung yang benar-benar tampil, supaya mengklik chip tidak membuka
// daftar yang isinya jauh lebih sedikit dari angkanya.
function semuaUlasan(sekarang: number, bahasa: Bahasa): Ulasan[] {
  const p = t(bahasa);
  return [
    {
      id: "ul-01",
      nama: "Sarah M.",
      unit: "Yamaha NMAX 155",
      skor: 5,
      tanggal: pukulWita(sekarang, -1, 18),
      isi: p(
        "Unit bersih, diantar tepat jam 9. Foto serah terima bikin tenang, jadi tidak ada debat waktu kembalikan.",
        "Clean scooter, delivered right at 9. The handover photos put my mind at ease, so there was no argument at return.",
      ),
    },
    {
      id: "ul-02",
      nama: "Kevin T.",
      unit: "Honda PCX 160",
      skor: 4,
      tanggal: pukulWita(sekarang, -3, 11),
      isi: p(
        "Motor oke, tapi jas hujan cuma satu padahal disewa berdua.",
        "The scooter was fine, but there was only one raincoat even though two of us were riding.",
      ),
      balasan: p(
        "Maaf ya Kevin, jas hujan kedua sudah kami tambahkan di semua unit sejak minggu ini.",
        "Sorry about that, Kevin. We've added a second raincoat to every vehicle as of this week.",
      ),
    },
    {
      id: "ul-03",
      nama: "Putu A.",
      unit: "Honda Beat 2022",
      skor: 5,
      tanggal: pukulWita(sekarang, -4, 9),
      isi: p(
        "Harga jelas di depan, tidak ada biaya tambahan waktu ambil unit.",
        "Clear price up front, no extra charges when I picked up the scooter.",
      ),
    },
    {
      id: "ul-04",
      nama: "Michael L.",
      unit: "Toyota Avanza 2021",
      skor: 3.5,
      tanggal: pukulWita(sekarang, -6, 16),
      isi: p(
        "Mobil sesuai foto, cuma telat 30 menit waktu antar karena macet.",
        "The car matched the photos, it was just 30 minutes late on delivery because of traffic.",
      ),
    },
    {
      id: "ul-05",
      nama: "Rina W.",
      unit: "Honda Scoopy 2023",
      skor: 5,
      tanggal: pukulWita(sekarang, -8, 13),
      isi: p(
        "Scoopy-nya masih baru dan bensin penuh waktu diantar. Prosesnya cepat, tidak perlu chat panjang.",
        "The Scoopy was nearly new and had a full tank on delivery. Quick process, no long chats needed.",
      ),
      balasan: p(
        "Terima kasih Rina, senang bisa membantu. Sampai jumpa lagi di Canggu.",
        "Thank you Rina, happy to help. See you again in Canggu.",
      ),
    },
    {
      id: "ul-06",
      nama: "Tom B.",
      unit: "Yamaha NMAX 155",
      skor: 3.5,
      tanggal: pukulWita(sekarang, -11, 10),
      isi: p(
        "Pengembalian agak lama karena saya harus menunggu pemilik datang ke titik janjian.",
        "The return took a while because I had to wait for the owner to arrive at the meeting point.",
      ),
      balasan: p(
        "Terima kasih masukannya Tom. Sekarang jadwal ambil kembali kami kunci di aplikasi supaya tidak bentrok.",
        "Thanks for the feedback, Tom. We now lock return pick-up times in the app so they don't clash.",
      ),
    },
    {
      id: "ul-07",
      nama: "Ayu L.",
      unit: "Yamaha Fino 2021",
      skor: 4.5,
      tanggal: pukulWita(sekarang, -14, 15),
      isi: p(
        "Fino nyaman buat keliling Canggu, helm bersih dan wangi.",
        "The Fino was comfortable for getting around Canggu, and the helmets were clean and fresh.",
      ),
      balasan: p(
        "Makasih Ayu, helm memang kami cuci tiap unit kembali.",
        "Thanks Ayu, we wash the helmets every time a vehicle comes back.",
      ),
    },
    {
      id: "ul-08",
      nama: "Nicolas M.",
      unit: "Vespa Sprint 2021",
      skor: 5,
      tanggal: pukulWita(sekarang, -18, 12),
      isi: p(
        "Vespa terawat, pemiliknya ramah dan balas cepat sebelum saya pesan.",
        "Well-kept Vespa, and the owner was friendly and replied quickly before I booked.",
      ),
      balasan: p(
        "Terima kasih Nicolas, titip salam buat rombongannya.",
        "Thank you Nicolas, say hi to the rest of your group.",
      ),
    },
  ];
}

export async function ambilUlasan(bahasa: Bahasa = "id"): Promise<{
  daftar: Ulasan[];
  ringkasan: RingkasanUlasan;
}> {
  const sekarang = await waktuServer();
  return {
    daftar: semuaUlasan(sekarang, bahasa),
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

export async function ambilBeranda(bahasa: Bahasa = "id"): Promise<DataBeranda> {
  const sekarang = await waktuServer();
  const berjalan = semuaPesanan(sekarang, bahasa).filter((x) => x.status === "active");

  const daftar: UnitKeluar[] = berjalan.slice(0, 4).map((x) => ({
    id: x.id,
    nama: x.unit,
    plat: x.plat,
    penyewa: x.penyewa,
    foto: x.foto,
    kembaliPada: x.kembaliPada ?? x.selesai,
  }));

  const unitKeluarPerHari = [6, 8, 3, 2, 4, 4, 7];

  return {
    sekarang,
    pesananHariIni: { masuk: 7 },
    unitKeluar: { jumlah: berjalan.length, totalUnit: 18, daftar },
    pendapatan: {
      bulan: namaBulan(sekarang, 0, bahasa),
      nilai: rupiahSingkat(semuaPeriode(sekarang, bahasa)[0].bersih, bahasa),
    },
    mingguIni: unitKeluarPerHari.map((jumlah, i) => ({
      tanggal: pukulWita(sekarang, i, 12),
      jumlah,
    })),
  };
}
