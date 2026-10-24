/**
 * Data contoh RentalAja, disalin dari mock frontend supaya saat frontend
 * nanti disambungkan ke API, isi layarnya tetap sama.
 *
 * Sumber:
 *   rentalaja-web/lib/mitra/data.ts  -> mitra Bali Motor Rent, 18 unit,
 *                                       12 pesanan, 8 ulasan
 *   rentalaja-web/lib/mock/search.ts -> 6 unit di hasil pencarian penyewa
 *
 * Jalankan:  npx prisma db seed
 *
 * PERINGATAN: seed MENGOSONGKAN SEMUA TABEL sebelum mengisi. Karena itu ia
 * menolak berjalan kalau DATABASE_URL bukan database lokal.
 *
 * ---------------------------------------------------------------------------
 * Keputusan rekonsiliasi (24 Okt 2026)
 * ---------------------------------------------------------------------------
 * Mock sisi penyewa dan sisi mitra ternyata saling bertentangan. Selama
 * keduanya mock terpisah ini tidak ketahuan; di database satu unit hanya
 * punya satu pemilik dan satu harga.
 *
 * 1. Lima mitra, bukan satu. Mock penyewa menampilkan Honda Beat milik
 *    "Wayan Rental" seharga Rp 55.000, sedangkan mock mitra menampilkan
 *    Honda Beat milik "Bali Motor Rent" seharga Rp 65.000 (begitu juga Vespa,
 *    PCX, Fino). Keduanya dipertahankan sebagai unit berbeda milik mitra
 *    berbeda, jadi angka yang sudah tampil di kedua sisi tidak berubah.
 *
 * 2. Hari dihitung per 24 jam. Mock mitra menghitung inklusif (ambil hari
 *    ke-0 pukul 09.00, kembali hari ke-2 pukul 09.00 = 3 hari), sedangkan
 *    form pencarian penyewa menghitung 2 hari. Constraint database mengikuti
 *    sisi penyewa, karena itu angka yang ditunjukkan dan dibayar pelanggan.
 *    Akibatnya total pesanan di sini sehari lebih murah dari mock mitra.
 *    Contoh: RA-284102 di mock Rp 215.000, di sini Rp 144.200.
 *
 * 3. Biaya layanan penyewa 3% dari harga sewa, rumusnya dari
 *    src/umum/harga.ts, sama dengan yang ditagih API.
 *    Mock pesanan aktif dan panel mitra di frontend masih memakai angka
 *    desain lama (Rp 5.000 flat, total Rp 215.000) sampai Fase 5.
 *
 * 4. Penyewa demo adalah Adi Prasetyo, karena dialah persona penyewa di
 *    frontend (contoh isian form pemesanan) dan pemilik pesanan Scoopy yang
 *    sedang berjalan.
 *
 * Pesanan MENUNGGU dibuat 18 dan 41 menit sebelum seed dijalankan, jadi
 * dalam satu jam keduanya kedaluwarsa. Itu perilaku yang benar, bukan bug:
 * berbeda dari mock frontend yang menghitung ulang waktunya di setiap
 * request. Jalankan seed lagi untuk mendapat pesanan menunggu yang segar.
 */

import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { MetodeBayar, StatusPesanan } from '../src/generated/prisma/enums.js';
import { rincianHarga } from '../src/umum/harga.js';

config({ quiet: true });

const URL_DB = process.env.DATABASE_URL;
const PASSWORD_DEMO = process.env.PASSWORD_DEMO;

if (!URL_DB) throw new Error('DATABASE_URL belum diisi di .env');
if (!PASSWORD_DEMO) throw new Error('PASSWORD_DEMO belum diisi di .env (lihat .env.example)');

const host = new URL(URL_DB).hostname;
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  throw new Error(
    `Seed mengosongkan semua tabel, jadi hanya boleh dijalankan ke database lokal. ` +
      `DATABASE_URL sekarang menunjuk host "${host}".`,
  );
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_DB }) });

// ---------------------------------------------------------------------------
// Waktu. Semua tanggal sewa relatif terhadap "sekarang", dalam WITA.
// ---------------------------------------------------------------------------

const MENIT = 60_000;
const JAM = 60 * MENIT;
const HARI = 24 * JAM;
const OFFSET_WITA = 8 * JAM;
const sekarang = Date.now();

/** Pukul `jam` WITA, `geser` hari dari hari ini. Sama dengan pukulWita() di
 *  rentalaja-web/lib/mitra/waktu.ts. */
function pukulWita(geser: number, jam: number): Date {
  const wita = new Date(sekarang + OFFSET_WITA);
  const tengahMalam =
    Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth(), wita.getUTCDate()) - OFFSET_WITA;
  return new Date(tengahMalam + geser * HARI + jam * JAM);
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** Nama -> telepon, dari mock pesanan. Awalan nomor contoh, bukan nomor asli. */
const PENYEWA: Record<string, string> = {
  'Dewi Anggraini': '+62 812-0000-0101',
  'Michael Lim': '+62 812-0000-0102',
  'Adi Prasetyo': '+62 812-0000-0103',
  'Sarah Miller': '+62 812-0000-0104',
  'Kevin Tan': '+62 812-0000-0105',
  'Putu Andika': '+62 812-0000-0106',
  'Nicolas Meyer': '+62 812-0000-0107',
  'Ayu Lestari': '+62 812-0000-0108',
  'Rina Wijaya': '+62 812-0000-0109',
  'James Carter': '+62 812-0000-0110',
  'Gede Surya': '+62 812-0000-0111',
  'Tom Becker': '+62 812-0000-0112',
};
const PENYEWA_DEMO = 'Adi Prasetyo';

type UnitSeed = {
  slug: string;
  nama: string;
  plat: string;
  foto: string;
  spesifikasi: string;
  hargaPerHari: number;
  tahun: number;
  servisSampai?: Date;
};

const foto = (nama: string) => `/units/${nama}.webp`;
const slugDari = (...bagian: string[]) =>
  bagian
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type BarisUnit = [nama: string, plat: string, berkasFoto: string, spesifikasi: string, harga: number, tahun: number, slugTetap?: string];

/** 18 unit Bali Motor Rent, sama dengan semuaUnit() di data mitra. Dua yang
 *  pertama juga tampil di hasil pencarian penyewa, jadi memakai slug yang
 *  sama dengan frontend; sisanya diberi plat di slug supaya unik. */
const BARIS_BMR: BarisUnit[] = [
  ['Honda Scoopy 2023', 'DK 4821 XY', 'honda-scoopy-2023', 'matic 110cc · 2 helm', 70_000, 2023, 'honda-scoopy-2023'],
  ['Yamaha NMAX 155', 'DK 1902 CD', 'yamaha-nmax-2022', 'matic 155cc · 2 helm', 110_000, 2022, 'yamaha-nmax-2022'],
  ['Honda PCX 160', 'DK 5127 AB', 'honda-pcx-160-2023', 'matic 160cc · 2 helm', 120_000, 2023],
  ['Honda Beat 2022', 'DK 7734 EF', 'honda-beat-2022', 'matic 110cc · 1 helm', 65_000, 2022],
  ['Vespa Sprint 2021', 'DK 2251 MN', 'vespa-sprint-2021', 'matic 150cc · 2 helm', 150_000, 2021],
  ['Yamaha Fino 2021', 'DK 6043 PQ', 'yamaha-fino-2021', 'matic 125cc · 2 helm', 75_000, 2021],
  ['Toyota Avanza 2021', 'DK 8890 GH', 'toyota-avanza-2021', 'MPV 7 kursi · bensin', 285_000, 2021],
  ['Toyota Avanza 2021', 'DK 8912 GH', 'toyota-avanza-2021', 'MPV 7 kursi · bensin', 285_000, 2021],
  ['Honda Scoopy 2023', 'DK 4835 XY', 'honda-scoopy-2023', 'matic 110cc · 2 helm', 70_000, 2023],
  ['Honda Scoopy 2022', 'DK 4102 TR', 'honda-scoopy-2023', 'matic 110cc · 2 helm', 65_000, 2022],
  ['Honda Beat 2022', 'DK 7740 EF', 'honda-beat-2022', 'matic 110cc · 1 helm', 65_000, 2022],
  ['Honda Beat 2021', 'DK 7128 LM', 'honda-beat-2022', 'matic 110cc · 1 helm', 60_000, 2021],
  ['Yamaha NMAX 155', 'DK 1955 CD', 'yamaha-nmax-2022', 'matic 155cc · 2 helm', 110_000, 2022],
  ['Yamaha Fino 2021', 'DK 6077 PQ', 'yamaha-fino-2021', 'matic 125cc · 2 helm', 75_000, 2021],
  ['Vespa Sprint 2021', 'DK 2260 MN', 'vespa-sprint-2021', 'matic 150cc · 2 helm', 150_000, 2021],
  ['Honda PCX 160', 'DK 5130 AB', 'honda-pcx-160-2023', 'matic 160cc · 2 helm', 120_000, 2023],
  ['Honda Vario 160', 'DK 3390 GH', 'honda-vario-160-2022', 'matic 160cc · 2 helm', 95_000, 2022],
  ['Honda Vario 160', 'DK 3312 JK', 'honda-vario-160-2022', 'matic 160cc · 2 helm', 95_000, 2022],
];

const UNIT_BMR: UnitSeed[] = BARIS_BMR.map(
  ([nama, plat, berkasFoto, spesifikasi, hargaPerHari, tahun, slugTetap]) => ({
    nama,
    plat,
    foto: foto(berkasFoto),
    spesifikasi,
    hargaPerHari,
    tahun,
    slug: slugTetap ?? slugDari(nama, plat),
  }),
);
// Unit terakhir sedang servis, sama dengan u-18 di mock mitra.
UNIT_BMR[17].servisSampai = pukulWita(2, 17);

/** Empat penyedia lain dari hasil pencarian penyewa, dengan harga mereka. */
const MITRA_LAIN: { nama: string; pemilik: string; area: string; unit: UnitSeed }[] = [
  {
    nama: 'Wayan Rental', pemilik: 'Wayan Sudarsa', area: 'Kerobokan',
    unit: { slug: 'honda-beat-2022', nama: 'Honda Beat 2022', plat: 'DK 1181 WR', foto: foto('honda-beat-2022'), spesifikasi: 'matic 110cc · 2 helm', hargaPerHari: 55_000, tahun: 2022 },
  },
  {
    nama: 'Retro Ride Bali', pemilik: 'Komang Artha', area: 'Seminyak',
    unit: { slug: 'vespa-sprint-2021', nama: 'Vespa Sprint 2021', plat: 'DK 2207 RR', foto: foto('vespa-sprint-2021'), spesifikasi: 'matic 150cc · 2 helm', hargaPerHari: 145_000, tahun: 2021 },
  },
  {
    nama: 'Dewa Motor', pemilik: 'Dewa Putra', area: 'Canggu',
    unit: { slug: 'honda-pcx-160-2023', nama: 'Honda PCX 160 2023', plat: 'DK 5160 DM', foto: foto('honda-pcx-160-2023'), spesifikasi: 'matic 160cc · 2 helm', hargaPerHari: 120_000, tahun: 2023 },
  },
  {
    nama: 'Pererenan Rent', pemilik: 'Nyoman Sari', area: 'Pererenan',
    unit: { slug: 'yamaha-fino-2021', nama: 'Yamaha Fino 2021', plat: 'DK 6125 PR', foto: foto('yamaha-fino-2021'), spesifikasi: 'matic 125cc · 2 helm', hargaPerHari: 60_000, tahun: 2021 },
  },
];

type PesananSeed = {
  kode: string;
  plat: string;
  penyewa: string;
  mulai: Date;
  selesai: Date;
  status: StatusPesanan;
  titik: string;
  dibuatPada?: Date;
};

const KANTOR = 'Kantor rental';

/** 12 pesanan dari semuaPesanan() di mock mitra. */
const PESANAN: PesananSeed[] = [
  { kode: 'RA-284207', plat: 'DK 3390 GH', penyewa: 'Dewi Anggraini', mulai: pukulWita(0, 13), selesai: pukulWita(2, 13), status: 'MENUNGGU', titik: 'Villa Canggu, Jl. Pantai Batu Bolong', dibuatPada: new Date(sekarang - 18 * MENIT) },
  { kode: 'RA-284211', plat: 'DK 8912 GH', penyewa: 'Michael Lim', mulai: pukulWita(2, 9), selesai: pukulWita(5, 9), status: 'MENUNGGU', titik: KANTOR, dibuatPada: new Date(sekarang - 41 * MENIT) },
  { kode: 'RA-284102', plat: 'DK 4821 XY', penyewa: 'Adi Prasetyo', mulai: pukulWita(0, 9), selesai: pukulWita(2, 9), status: 'BERJALAN', titik: 'Villa Canggu, Jl. Pantai Batu Bolong' },
  { kode: 'RA-284077', plat: 'DK 1902 CD', penyewa: 'Sarah Miller', mulai: pukulWita(-2, 17), selesai: pukulWita(0, 17), status: 'BERJALAN', titik: 'Villa Berawa' },
  { kode: 'RA-283998', plat: 'DK 5127 AB', penyewa: 'Kevin Tan', mulai: pukulWita(-4, 9), selesai: pukulWita(-1, 9), status: 'BERJALAN', titik: KANTOR },
  { kode: 'RA-284150', plat: 'DK 7734 EF', penyewa: 'Putu Andika', mulai: pukulWita(-1, 8), selesai: pukulWita(3, 8), status: 'BERJALAN', titik: 'Villa Tiying Tutul' },
  { kode: 'RA-284166', plat: 'DK 2251 MN', penyewa: 'Nicolas Meyer', mulai: pukulWita(0, 10), selesai: pukulWita(4, 10), status: 'BERJALAN', titik: 'Hotel Pererenan' },
  { kode: 'RA-284181', plat: 'DK 6043 PQ', penyewa: 'Ayu Lestari', mulai: pukulWita(-1, 11), selesai: pukulWita(1, 11), status: 'BERJALAN', titik: KANTOR },
  { kode: 'RA-283812', plat: 'DK 4821 XY', penyewa: 'Rina Wijaya', mulai: pukulWita(-9, 9), selesai: pukulWita(-6, 9), status: 'SELESAI', titik: KANTOR },
  { kode: 'RA-283744', plat: 'DK 8912 GH', penyewa: 'James Carter', mulai: pukulWita(-12, 8), selesai: pukulWita(-8, 8), status: 'SELESAI', titik: KANTOR },
  { kode: 'RA-283905', plat: 'DK 7734 EF', penyewa: 'Gede Surya', mulai: pukulWita(-7, 10), selesai: pukulWita(-5, 10), status: 'SELESAI', titik: KANTOR },
  { kode: 'RA-283860', plat: 'DK 1902 CD', penyewa: 'Tom Becker', mulai: pukulWita(-3, 9), selesai: pukulWita(-1, 9), status: 'DIBATALKAN', titik: KANTOR },
];

type UlasanSeed = {
  penyewa: string;
  plat: string;
  /** Sewa yang diulas, [hari mulai, hari kembali]. Setiap ulasan wajib
   *  terkait satu pesanan SELESAI. */
  sewa: [number, number];
  skor: string;
  tanggal: Date;
  isi: string;
  balasan?: string;
};

/** 8 ulasan dari mock mitra. Tanggal ulasan sama dengan mock. Sewa yang
 *  diulas dipilih supaya selesai sebelum tanggal ulasan dan tidak bertumpuk
 *  dengan pesanan lain di unit yang sama. */
const ULASAN: UlasanSeed[] = [
  { penyewa: 'Sarah Miller', plat: 'DK 1902 CD', sewa: [-6, -3], skor: '5', tanggal: pukulWita(-1, 18),
    isi: 'Unit bersih, diantar tepat jam 9. Foto serah terima bikin tenang, jadi tidak ada debat waktu kembalikan.' },
  { penyewa: 'Kevin Tan', plat: 'DK 5127 AB', sewa: [-8, -5], skor: '4', tanggal: pukulWita(-3, 11),
    isi: 'Motor oke, tapi jas hujan cuma satu padahal disewa berdua.' },
  { penyewa: 'Putu Andika', plat: 'DK 7734 EF', sewa: [-11, -9], skor: '5', tanggal: pukulWita(-4, 9),
    isi: 'Harga jelas di depan, tidak ada biaya tambahan waktu ambil unit.' },
  { penyewa: 'Michael Lim', plat: 'DK 8912 GH', sewa: [-16, -13], skor: '3.5', tanggal: pukulWita(-6, 16),
    isi: 'Mobil sesuai foto, cuma telat 30 menit waktu antar karena macet.' },
  { penyewa: 'Rina Wijaya', plat: 'DK 4821 XY', sewa: [-13, -10], skor: '5', tanggal: pukulWita(-8, 13),
    isi: 'Scoopy-nya masih baru dan bensin penuh waktu diantar. Prosesnya cepat, tidak perlu chat panjang.',
    balasan: 'Terima kasih Rina, senang bisa membantu. Sampai jumpa lagi di Canggu.' },
  { penyewa: 'Tom Becker', plat: 'DK 1902 CD', sewa: [-14, -12], skor: '3.5', tanggal: pukulWita(-11, 10),
    isi: 'Pengembalian agak lama karena saya harus menunggu pemilik datang ke titik janjian.' },
  { penyewa: 'Ayu Lestari', plat: 'DK 6043 PQ', sewa: [-17, -15], skor: '4.5', tanggal: pukulWita(-14, 15),
    isi: 'Fino nyaman buat keliling Canggu, helm bersih dan wangi.',
    balasan: 'Makasih Ayu, helm memang kami cuci tiap unit kembali.' },
  { penyewa: 'Nicolas Meyer', plat: 'DK 2251 MN', sewa: [-21, -19], skor: '5', tanggal: pukulWita(-18, 12),
    isi: 'Vespa terawat, pemiliknya ramah dan balas cepat sebelum saya pesan.',
    balasan: 'Terima kasih Nicolas, titip salam buat rombongannya.' },
];

// ---------------------------------------------------------------------------
// Penulisan
// ---------------------------------------------------------------------------

const METODE: MetodeBayar[] = ['BCA_VA', 'QRIS', 'EWALLET'];
/** Domain .test dicadangkan RFC 2606: alamat ini tidak bisa menerima surel. */
const emailDari = (nama: string) => `${slugDari(nama).replace(/-/g, '.')}@contoh.rentalaja.test`;

/** Hash dari nilai acak: akun bisa memiliki data, tapi tidak bisa dipakai login. */
const hashTakTerpakai = () => bcrypt.hash(randomBytes(24).toString('hex'), 10);

async function main() {
  const hashDemo = await bcrypt.hash(PASSWORD_DEMO!, 10);

  await db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `TRUNCATE pengguna, mitra, unit, blokir_unit, pesanan, pembayaran,
                  dokumen_penyewa, serah_terima, foto_serah, klaim_kerusakan, ulasan
         RESTART IDENTITY CASCADE`,
      );

      // Penyewa
      const idPenyewa = new Map<string, string>();
      for (const [nama, telepon] of Object.entries(PENYEWA)) {
        const demo = nama === PENYEWA_DEMO;
        const p = await tx.pengguna.create({
          data: {
            nama,
            telepon,
            peran: 'PENYEWA',
            email: demo ? 'penyewa.demo@rentalaja.test' : emailDari(nama),
            kataSandiHash: demo ? hashDemo : await hashTakTerpakai(),
          },
        });
        idPenyewa.set(nama, p.id);
      }

      // Mitra demo: Bali Motor Rent
      const pakWayan = await tx.pengguna.create({
        data: {
          nama: 'Pak Wayan', telepon: '+62 812-0000-0001', peran: 'MITRA',
          email: 'mitra.demo@rentalaja.test', kataSandiHash: hashDemo,
        },
      });
      const bmr = await tx.mitra.create({
        data: { pemilikId: pakWayan.id, nama: 'Bali Motor Rent', area: 'Canggu, Badung' },
      });

      const idUnit = new Map<string, string>();
      const buatUnit = async (mitraId: string, area: string, u: UnitSeed) => {
        const mobil = u.spesifikasi.startsWith('MPV');
        const cc = u.spesifikasi.match(/(\d+)cc/)?.[1];
        const hasil = await tx.unit.create({
          data: {
            mitraId, area,
            slug: u.slug, nama: u.nama, plat: u.plat, foto: u.foto,
            spesifikasi: u.spesifikasi, hargaPerHari: u.hargaPerHari, tahun: u.tahun,
            kategori: mobil ? 'MOBIL' : 'MOTOR',
            jenis: mobil ? 'MPV 7 kursi' : `Skutik ${cc}cc`,
          },
        });
        idUnit.set(u.plat, hasil.id);
        return hasil;
      };

      // Slug BMR yang bentrok dengan unit mitra lain diberi plat. Unit mitra
      // lain yang memakai slug pendek, karena merekalah yang tampil di
      // pencarian penyewa dengan slug itu.
      const slugMitraLain = new Set(MITRA_LAIN.map((m) => m.unit.slug));
      for (const u of UNIT_BMR) {
        if (slugMitraLain.has(u.slug)) u.slug = slugDari(u.nama, u.plat);
        const unit = await buatUnit(bmr.id, 'Canggu', u);
        if (u.servisSampai) {
          await tx.blokirUnit.create({
            data: {
              unitId: unit.id, jenis: 'SERVIS', mulai: pukulWita(0, 0),
              selesai: u.servisSampai, catatan: 'Servis berkala',
            },
          });
        }
      }

      // Empat mitra lain
      for (const m of MITRA_LAIN) {
        const pemilik = await tx.pengguna.create({
          data: {
            nama: m.pemilik, telepon: '+62 812-0000-0000', peran: 'MITRA',
            email: emailDari(m.pemilik), kataSandiHash: await hashTakTerpakai(),
          },
        });
        const mitra = await tx.mitra.create({
          data: { pemilikId: pemilik.id, nama: m.nama, area: m.area },
        });
        await buatUnit(mitra.id, m.area, m.unit);
      }

      // Pesanan. Harga selalu dihitung dari unit, tidak disalin dari mock.
      const hargaUnit = new Map(
        [...UNIT_BMR, ...MITRA_LAIN.map((m) => m.unit)].map((u) => [u.plat, u.hargaPerHari]),
      );
      let urut = 0;
      const buatPesanan = async (p: PesananSeed) => {
        const hargaPerHari = hargaUnit.get(p.plat)!;
        const jumlahHari = Math.ceil((p.selesai.getTime() - p.mulai.getTime()) / HARI);
        const { subtotal, biayaLayanan, total } = rincianHarga(hargaPerHari, jumlahHari);
        // Pesanan yang sudah berjalan atau lewat dipesan sehari sebelum mulai.
        const dibuatPada = p.dibuatPada ?? new Date(p.mulai.getTime() - HARI);
        const dibalas = new Date(dibuatPada.getTime() + 20 * MENIT);

        const pesanan = await tx.pesanan.create({
          data: {
            kode: p.kode,
            unitId: idUnit.get(p.plat)!,
            penyewaId: idPenyewa.get(p.penyewa)!,
            mulai: p.mulai,
            selesai: p.selesai,
            status: p.status,
            hargaPerHari, jumlahHari, subtotal,
            biayaLayanan, total,
            titik: p.titik,
            diantar: p.titik !== KANTOR,
            dibuatPada,
            diterimaPada: p.status === 'BERJALAN' || p.status === 'SELESAI' ? dibalas : null,
            kembaliPada: p.status === 'SELESAI' ? p.selesai : null,
            alasanBatal: p.status === 'DIBATALKAN' ? 'DIBATALKAN_PENYEWA' : null,
            dibatalkanPada:
              p.status === 'DIBATALKAN' ? new Date(dibuatPada.getTime() + 2 * JAM) : null,
          },
        });
        // Bayar penuh saat memesan, termasuk yang kemudian batal: dananya
        // dikembalikan, dan status dana itu diturunkan, tidak disimpan.
        await tx.pembayaran.create({
          data: {
            pesananId: pesanan.id,
            jumlah: total,
            metode: METODE[urut++ % METODE.length],
            dibayarPada: dibuatPada,
          },
        });
        return pesanan;
      };

      for (const p of PESANAN) await buatPesanan(p);

      // Ulasan, masing-masing dengan pesanan SELESAI miliknya sendiri.
      let nomorUlasan = 283501;
      for (const u of ULASAN) {
        const pesanan = await buatPesanan({
          kode: `RA-${nomorUlasan++}`,
          plat: u.plat,
          penyewa: u.penyewa,
          status: 'SELESAI',
          titik: KANTOR,
          mulai: pukulWita(u.sewa[0], 9),
          selesai: pukulWita(u.sewa[1], 9),
        });
        await tx.ulasan.create({
          data: {
            pesananId: pesanan.id,
            unitId: pesanan.unitId,
            penyewaId: pesanan.penyewaId,
            skor: u.skor,
            isi: u.isi,
            dibuatPada: u.tanggal,
            balasan: u.balasan ?? null,
            dibalasPada: u.balasan ? new Date(u.tanggal.getTime() + 3 * JAM) : null,
          },
        });
      }
    },
    { timeout: 60_000 },
  );

  const [pengguna, mitra, unit, pesanan, ulasan, blokir] = await Promise.all([
    db.pengguna.count(),
    db.mitra.count(),
    db.unit.count(),
    db.pesanan.count(),
    db.ulasan.count(),
    db.blokirUnit.count(),
  ]);
  console.log(
    `Seed selesai: ${pengguna} pengguna, ${mitra} mitra, ${unit} unit, ` +
      `${pesanan} pesanan, ${ulasan} ulasan, ${blokir} blokir.`,
  );
  console.log('Akun demo: mitra.demo@rentalaja.test dan penyewa.demo@rentalaja.test');
  console.log('Kata sandi keduanya: nilai PASSWORD_DEMO di .env');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
