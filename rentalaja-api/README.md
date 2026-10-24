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

Pesanan menunggu di data contoh kedaluwarsa satu jam setelah seed. Jalankan
`npm run db:seed` lagi untuk mendapat yang baru.

## Test

```bash
npm test             # unit test, tanpa database
npm run test:e2e     # pakai database sungguhan: rentalaja_test, dibuat otomatis
```

Test e2e tidak pernah menyentuh database pengembangan.

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

Buktinya `test/aturan-database.e2e-spec.ts`. `src/prisma/kesalahan-db.ts`
membaca kode SQLSTATE dari error yang dibungkus Prisma.

## Endpoint

| Endpoint | Siapa | Isi |
|---|---|---|
| `POST /auth/masuk`, `GET /auth/saya` | semua | login, profil |
| `GET /pencarian?mulai=&durasi=` | publik | semua unit + kosong/terisi + harga final |
| `GET /unit/:slug?mulai=&durasi=` | publik | detail unit + kalender 7 hari |
| `POST /pesanan` | penyewa | pesan + bayar penuh dalam satu langkah |
| `GET /pesanan`, `GET /pesanan/:kode` | penyewa / mitra pemilik | daftar dan detail |
| `POST /pesanan/:kode/batal` | penyewa | hanya selama masih menunggu |
| `POST /mitra/pesanan/:kode/terima`, `/tolak` | mitra pemilik unit | dalam 1 jam |
| `GET /mitra/saya`, `/beranda`, `/unit`, `/pesanan`, `/kalender` | mitra | panel mitra |

**Harga.** Biaya layanan penyewa 3% dari harga sewa, dibulatkan ke rupiah
terdekat (`src/umum/harga.ts`, satu-satunya rumus). `POST /pesanan` wajib
mengirim `totalDisetujui`, yaitu total yang dilihat penyewa. Server tetap
menghitung sendiri dan menjawab 409 beserta harga baru kalau angkanya beda.

**Pembayaran masih simulasi.** Belum ada payment gateway: baris pembayaran
dicatat langsung saat pesan. Yang dijaga sungguhan hanya jumlahnya (trigger
`pembayaran_sesuai_total`). Status dana (ditahan, dilepas, dikembalikan)
diturunkan dari status pesanan, tidak disimpan.

## Hal yang perlu diketahui

- **Prisma dikunci di 7.10.1.** Tag `latest` di npm menunjuk release
  candidate 8.0. Jangan `npm install prisma@latest`.
- **Jangan jalankan `prisma init`.** Versi ini membuat `prisma7.config.ts` dan
  folder `.agents/` yang tidak dipakai proyek ini.
- **Kolom `rentang` adalah kolom generated.** Prisma membacanya sebagai default,
  jadi `@default(dbgenerated(...))` di schema harus sama persis dengan hasil
  `npx prisma db pull`. Kalau tidak, setiap `migrate dev` mencoba membuangnya.
