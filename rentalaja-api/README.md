# rentalaja-api

Backend RentalAja: NestJS 12, Prisma 7, PostgreSQL 18. Spesifikasinya ada di
`backend.md` di root repo.

## Menjalankan pertama kali

Butuh Node 22 atau lebih baru dan Docker Desktop yang sedang menyala.

```bash
cd rentalaja-api
cp .env.example .env      # lalu isi DB_PASSWORD, DATABASE_URL, JWT_SECRET, PASSWORD_DEMO
npx npm@11 install        # npm 10.9 crash di peer dependency NestJS 12
npm run db:up             # Postgres di container, port 5433
npm run db:migrate        # buat tabel, constraint, dan trigger
npm run db:seed           # isi data contoh (MENGOSONGKAN semua tabel dulu)
npm run start:dev         # http://localhost:4000/kesehatan
```

`DB_PASSWORD` dan kata sandi di dalam `DATABASE_URL` harus sama.

## Akun demo

Dibuat oleh `npm run db:seed`, kata sandinya nilai `PASSWORD_DEMO` di `.env`:

| Email | Peran |
|---|---|
| `mitra.demo@rentalaja.test` | Mitra, pemilik Bali Motor Rent (18 unit) |
| `penyewa.demo@rentalaja.test` | Penyewa, Adi Prasetyo |

Data contoh juga berisi rekening dan satu pencairan lama untuk Bali Motor
Rent, chat untuk tiga pesanan, catatan serah terima, satu klaim kerusakan
terbuka (RA-283905), ulasan dengan dan tanpa balasan, serta dokumen penyewa
(Sarah Miller satu-satunya WNA, Australia).

Pesanan menunggu di data contoh kedaluwarsa satu jam setelah seed. Jalankan
`npm run db:seed` lagi untuk mendapat yang baru.

## Test

```bash
npm test             # unit test, tanpa database
npm run test:e2e     # pakai database sungguhan: rentalaja_test, dibuat otomatis
```

Test e2e tidak pernah menyentuh database pengembangan. Nama database test bisa
diganti lewat env `NAMA_DB_TEST` (mis. `NAMA_DB_TEST=rentalaja_test_a npm run test:e2e`)
supaya beberapa proses test bisa berjalan bersamaan tanpa saling mengosongkan.
Setiap file e2e mengosongkan tabel di awal, jadi dua proses test yang memakai
database yang sama akan saling merusak; di dalam satu proses, file dijalankan
berurutan (`fileParallelism: false`). Database test tambahan tidak dihapus
otomatis: `docker exec rentalaja-db psql -U rentalaja -d postgres -c 'DROP DATABASE rentalaja_test_a'`.

## Di mana aturan bisnisnya

Aturan di `backend.md` bagian 4 dijaga **database**, bukan hanya kode, jadi
service yang lupa memeriksa atau dua request yang datang bersamaan tetap
tidak bisa merusak data. Letaknya di
`prisma/migrations/20261024105825_awal/migration.sql`, bagian "TAMBAHAN MANUAL":

- tidak ada double booking (`EXCLUDE USING gist`)
- pesanan tidak bisa menimpa blokir, dan sebaliknya (trigger + kunci baris unit)
- pesanan menunggu kedaluwarsa setelah 1 jam, tanpa cron
- harga dihitung, dan dibekukan setelah dipesan (CHECK + trigger)
- jumlah bayar harus sama dengan total

Migrasi `20261112104507_fitur_lanjutan` menambah CHECK untuk fitur lanjutan:
pencairan selalu positif, isi chat 1 sampai 2000 karakter (tanpa spasi
saja), dan kewarganegaraan wajib ada untuk WNA dan hanya untuk WNA.

Buktinya `test/aturan-database.e2e-spec.ts`. `src/prisma/kesalahan-db.ts`
membaca kode SQLSTATE dari error yang dibungkus Prisma.

## Endpoint

Semua endpoint di bawah `/mitra` hanya untuk peran MITRA dan hanya melihat
data usaha rental miliknya sendiri: milik mitra lain dijawab 404, penyewa
dijawab 403, tanpa token 401.

| Endpoint | Siapa | Isi |
|---|---|---|
| `GET /kesehatan` | publik | cek server hidup |
| `POST /auth/masuk`, `GET /auth/saya` | semua | login, profil |
| `GET /pencarian?mulai=&durasi=` | publik | semua unit + kosong/terisi + harga final |
| `GET /unit/:slug?mulai=&durasi=` | publik | detail unit + kalender 7 hari |
| `POST /pesanan` | penyewa | pesan + bayar penuh dalam satu langkah; wajib `dokumen`, `verifikasiWajah: true`, dan `kewarganegaraan` kalau `asal: "WNA"` |
| `GET /pesanan`, `GET /pesanan/:kode` | penyewa / mitra pemilik | daftar dan detail, termasuk `denda` berjalan |
| `POST /pesanan/:kode/batal` | penyewa | hanya selama masih menunggu |
| `POST /pesanan/:kode/ulasan` | penyewa | `{skor, isi}`, satu kali per pesanan SELESAI (409 kalau belum selesai atau sudah diulas) |
| `GET /chat` | penyewa / mitra | daftar percakapan (satu per pesanan) + jumlah belum dibaca |
| `GET /chat/:kode`, `POST /chat/:kode` | penyewa pemesan / mitra pemilik | buka (menandai dibaca) dan kirim `{isi}`; 409 kalau pesanan ditolak, batal, atau kedaluwarsa |
| `POST /mitra/pesanan/:kode/terima`, `/tolak` | mitra pemilik unit | dalam 1 jam |
| `GET /mitra/saya`, `/beranda`, `/unit`, `/pesanan`, `/kalender` | mitra | panel mitra; sel kalender membawa `blokirId` untuk blokir manual/servis |
| `PATCH /mitra/unit/:id` | mitra | `{hargaPerHari?, servis?, sampai?}`; 409 kalau servis bentrok pesanan atau unit sedang disewa |
| `POST /mitra/kalender/blokir`, `DELETE /mitra/kalender/blokir/:id` | mitra | blokir manual `{unitId, mulai, selesai, catatan?}`; 409 kalau menimpa pesanan |
| `GET /mitra/serah-terima?tab=hari-ini\|menunggu-foto\|selesai` | mitra | jadwal antar/ambil (diturunkan dari pesanan) + catatannya |
| `PUT /mitra/serah-terima/:kode/antar\|ambil` | mitra | `{kondisi?, foto?, catatan?, klaim?}`, idempoten; 409 sebelum hari sewa, sebelum antar lengkap (untuk ambil), atau setelah catatan lengkap |
| `POST /mitra/klaim/:kode/selesai` | mitra | tandai klaim kerusakan selesai; dana lalu dilepas sesuai jadwalnya |
| `GET /mitra/ulasan`, `POST /mitra/ulasan/:id/balas` | mitra | ulasan unit sendiri + rata-rata; balasan `{balasan}` boleh ditimpa |
| `GET /mitra/pendapatan?periode=bulan-ini\|bulan-lalu\|tiga-bulan` | mitra | dana dilepas, komisi, transaksi per periode |
| `GET /mitra/saldo`, `POST /mitra/saldo/tarik` | mitra | saldo turunan + label rekening + `bisaTarikPada`; tarik `{jumlah?}` (kosong = seluruh saldo); 400 kalau saldo kurang atau rekening belum diisi, 409 dalam 24 jam setelah rekening diubah |
| `GET /mitra/rekening`, `PUT /mitra/rekening` | mitra | rekening tersamar; isi/ganti `{bank, nomor, namaPemilik, kataSandi}`; 403 kata sandi salah, 400 nama tidak sama dengan nama akun |
| `POST /pesanan/:kode/kembali-awal`, `DELETE ...` | penyewa atau mitra | setuju (atau tarik persetujuan) unit kembali sebelum jatuh tempo; ambil lebih awal baru bisa kalau dua-duanya setuju |

Kode atau id di URL yang berisi karakter NUL (`%00`) dijawab 400 oleh filter
global `src/prisma/filter-kesalahan-db.ts`, bukan 500.

**Harga.** Biaya layanan penyewa 3% dari harga sewa, dibulatkan ke rupiah
terdekat (`src/umum/harga.ts`, satu-satunya rumus). `POST /pesanan` wajib
mengirim `totalDisetujui`, yaitu total yang dilihat penyewa. Server tetap
menghitung sendiri dan menjawab 409 beserta harga baru kalau angkanya beda.
Komisi platform 5% dipotong saat dana dilepas ke penyedia.

**Pembayaran masih simulasi.** Belum ada payment gateway: baris pembayaran
dicatat langsung saat pesan. Yang dijaga sungguhan hanya jumlahnya (trigger
`pembayaran_sesuai_total`). Status dana (ditahan, dilepas, dikembalikan)
diturunkan dari status pesanan, tidak disimpan.

## Keputusan pemilik proyek (12 Nov 2026)

- **Denda keterlambatan dicatat saja.** Server menghitung denda berjalan =
  `hargaPerHari` beku x jumlah hari telat (dibulatkan ke atas, dari jadwal
  selesai sampai sekarang atau `kembaliPada`). Angkanya ditampilkan di
  pesanan, panel unit, beranda, dan serah terima, tetapi TIDAK ditagih ke
  siapa pun dan tidak mengubah dana. Rumusnya satu, di
  `src/umum/status-pesanan.ts` (`hariTelat`, `dendaBerjalan`). Tepat di jam
  jadwal selesai pesanan sudah "telat" dan dendanya sudah satu hari.
- **Klaim kerusakan ditandai selesai oleh mitra.** Klaim diajukan saat
  mencatat unit kembali (`PUT .../ambil` dengan `klaim`). Selama
  `diselesaikanPada` kosong, dana ditahan. Mitra pemilik unit menandainya
  selesai lewat `POST /mitra/klaim/:kode/selesai`, lalu aturan pelepasan
  dana 1x24 jam berlaku. Nominal klaim tidak memindahkan dana. Penyewa belum
  bisa melihat atau membantah klaim.
- **KYC masih simulasi.** `POST /pesanan` mewajibkan dokumen (WNI: KTP +
  SIM; WNA: paspor + IDP + SIM negara asal, plus `kewarganegaraan`) dan
  `verifikasiWajah: true`. Yang disimpan hanya alamat berkas dan waktu
  verifikasi (`wajahTerverifikasiPada`). Belum ada upload maupun penyedia KYC
  sungguhan, dan mitra hanya melihat jenis dokumennya.
- **Saldo tidak disimpan.** Saldo = dana bersih yang sudah dilepas dikurangi
  semua pencairan. Tarik saldo mengunci baris mitra (`FOR UPDATE`) supaya
  dua tarikan bersamaan tidak bisa melebihi saldo.
- **Rekening ala aplikasi saham dan kripto.** Bank dipilih dari daftar
  (`src/umum/rekening.ts`), panjang nomor dicek untuk BCA, BNI, BRI, dan
  Mandiri. Rekening harus atas nama pemilik akun (huruf besar, tanda baca,
  dan sapaan seperti "Pak" diabaikan). Mengisi atau mengganti rekening wajib
  kata sandi, dan tarik saldo dikunci 24 jam setelahnya. Nomor lengkap hanya
  ada di database; API mengirim `BCA ···4471`. **Masih simulasi:** aplikasi
  sungguhan mengambil nama pemilik dari bank (inquiry rekening lewat
  penyedia pembayaran); di sini nama yang diketik dicocokkan dengan nama
  akun. Belum ada notifikasi email saat rekening diubah dan belum ada batas
  percobaan kata sandi.
- **Pengembalian lebih awal boleh kalau dua pihak setuju.** Sebelum hari
  jatuh tempo (WITA), mitra baru bisa mencatat ambil setelah penyewa dan
  mitra sama-sama memanggil `POST /pesanan/:kode/kembali-awal`. Persetujuan
  bisa ditarik selama ambil belum mulai dicatat. Database menjaga aturan
  yang sama (trigger `pesanan_kembali_awal`). Begitu pesanan SELESAI,
  sisa harinya otomatis kosong lagi di kalender dan pencarian. Sisa hari
  sewa **tidak** dikembalikan ke penyewa.

## Hal yang perlu diketahui

- **Prisma dikunci di 7.10.1.** Tag `latest` di npm menunjuk release
  candidate 8.0. Jangan `npm install prisma@latest`.
- **Jangan jalankan `prisma init`.** Versi ini membuat `prisma7.config.ts` dan
  folder `.agents/` yang tidak dipakai proyek ini.
- **Kolom `rentang` adalah kolom generated.** Prisma membacanya sebagai default,
  jadi `@default(dbgenerated(...))` di schema harus sama persis dengan hasil
  `npx prisma db pull`. Kalau tidak, setiap `migrate dev` mencoba membuangnya.
