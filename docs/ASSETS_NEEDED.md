# Aset yang Dibutuhkan — RentalAja

Diinventarisasi langsung dari kode per commit `357e194`: setiap `ImagePlaceholder`,
unit dengan `foto: null`, dan lingkaran avatar kosong.

**Total: 33 aset** — 17 prioritas utama, 16 pelengkap.

README handoff hanya menyebut 8 foto. Sisanya muncul dari Layar 2–5 yang dibangun
setelahnya, jadi daftar ini jauh lebih panjang dari yang tertulis di README.

---

## Cara pakai

Taruh file di path yang tertulis, dengan **nama persis sama**. Setelah itu kabari —
wiring-nya cuma mengganti `foto: null` atau `ImagePlaceholder` jadi `<Image>`.

- **Format:** WebP atau JPEG untuk foto. Hindari PNG — ukurannya jauh lebih besar.
  `next/image` tetap mengoptimasi, tapi file sumber yang kecil tetap lebih cepat.
- **Resolusi:** yang tertulis adalah **minimum**. Foto ditampilkan dengan
  `object-cover`, jadi tepinya akan terpotong — jaga objek utama di tengah.
- **Avatar:** persegi 1:1. Ditampilkan 28–44px, disiapkan 2–3× untuk layar retina.

---

## P0 — Terlihat di setiap demo

Semua ini muncul di alur utama: landing → cari → detail Scoopy → pemesanan → pesanan aktif.

### Landing page `/`

| # | Aset | Path | Ukuran minimum | Catatan |
|---|---|---|---|---|
| 1 | Foto serah terima | `public/landing/serah-terima.webp` | 800 × 450 (16:9) | Dua orang + unit motor saat penyerahan kunci/unit |
| 2 | Foto unit di parkiran | `public/landing/unit-parkiran.webp` | 800 × 450 (16:9) | Beberapa motor berjejer rapi |
| 3 | Avatar testimoni — Dimas | `public/avatars/testimoni-dimas.webp` | 128 × 128 (1:1) | |
| 4 | Avatar testimoni — Sarah | `public/avatars/testimoni-sarah.webp` | 128 × 128 (1:1) | |
| 5 | Avatar testimoni — Yoga | `public/avatars/testimoni-yoga.webp` | 128 × 128 (1:1) | |

### Hasil pencarian `/cari`

Keenam kartu tampil sekaligus. Scoopy dan NMAX sudah punya foto.

| # | Aset | Path | Ukuran minimum | Catatan |
|---|---|---|---|---|
| 6 | Honda Beat 2022 | `public/units/honda-beat-2022.webp` | 1200 × 675 (16:9) | |
| 7 | Vespa Sprint 2021 | `public/units/vespa-sprint-2021.webp` | 1200 × 675 (16:9) | |
| 8 | Honda PCX 160 2023 | `public/units/honda-pcx-160-2023.webp` | 1200 × 675 (16:9) | |
| 9 | Yamaha Fino 2021 | `public/units/yamaha-fino-2021.webp` | 1200 × 675 (16:9) | |

Foto #6–9 juga otomatis dipakai sebagai foto utama di halaman detail masing-masing.

### Detail unit `/unit/honda-scoopy-2023`

| # | Aset | Path | Ukuran minimum | Catatan |
|---|---|---|---|---|
| 10 | Scoopy — sudut kedua | `public/units/honda-scoopy-2023-2.webp` | 800 × 600 | Galeri kanan atas. Sudut berbeda dari foto utama |
| 11 | Scoopy — sudut ketiga | `public/units/honda-scoopy-2023-3.webp` | 800 × 600 | Galeri kanan bawah. Mis. detail jok/dasbor |
| 12 | Avatar penyedia — Bali Motor Rent | `public/avatars/penyedia-bali-motor-rent.webp` | 128 × 128 (1:1) | Logo usaha atau foto pemilik. Dipakai juga di `/pesanan` |

### Pesanan aktif `/pesanan`

Empat foto serah terima. **Harus Honda Scoopy putih yang sama** dengan foto utama,
karena layar ini mengklaim foto diambil dari unit yang sedang disewa.

| # | Aset | Path | Ukuran minimum |
|---|---|---|---|
| 13 | Serah terima — depan | `public/serah-terima/scoopy-depan.webp` | 600 × 450 |
| 14 | Serah terima — belakang | `public/serah-terima/scoopy-belakang.webp` | 600 × 450 |
| 15 | Serah terima — kiri | `public/serah-terima/scoopy-kiri.webp` | 600 × 450 |
| 16 | Serah terima — kanan | `public/serah-terima/scoopy-kanan.webp` | 600 × 450 |

### Identitas situs

| # | Aset | Path | Ukuran | Catatan |
|---|---|---|---|---|
| 17 | Favicon | `app/icon.png` | 512 × 512 | Masih logo default Next.js. Next 16 otomatis memakai `app/icon.png` |

---

## P1 — Terlihat kalau pengguna membuka unit lain

### Galeri detail untuk 5 unit lainnya

Tiap unit butuh 2 foto sudut tambahan. Tanpa ini, galeri kanan tetap placeholder.

| # | Path |
|---|---|
| 18–19 | `public/units/honda-beat-2022-2.webp`, `-3.webp` |
| 20–21 | `public/units/yamaha-nmax-2022-2.webp`, `-3.webp` |
| 22–23 | `public/units/vespa-sprint-2021-2.webp`, `-3.webp` |
| 24–25 | `public/units/honda-pcx-160-2023-2.webp`, `-3.webp` |
| 26–27 | `public/units/yamaha-fino-2021-2.webp`, `-3.webp` |

Semuanya minimum 800 × 600.

### Avatar penyedia lainnya

| # | Penyedia | Path |
|---|---|---|
| 28 | Wayan Rental | `public/avatars/penyedia-wayan-rental.webp` |
| 29 | Retro Ride Bali | `public/avatars/penyedia-retro-ride-bali.webp` |
| 30 | Dewa Motor | `public/avatars/penyedia-dewa-motor.webp` |
| 31 | Pererenan Rent | `public/avatars/penyedia-pererenan-rent.webp` |

Semuanya 128 × 128 (1:1).

---

## P2 — Pemoles

| # | Aset | Path | Ukuran | Catatan |
|---|---|---|---|---|
| 32 | Potongan peta titik antar | `public/peta-canggu.webp` | 1600 × 180 | Sangat lebar (~9:1). Screenshot peta Jl. Pantai Batu Bolong, Canggu. Nanti idealnya diganti peta interaktif sungguhan |
| 33 | Gambar pratinjau tautan (Open Graph) | `app/opengraph-image.png` | 1200 × 630 | Muncul saat tautan portofolio dibagikan di WhatsApp/LinkedIn. Next 16 otomatis memakainya |

---

## Bukan aset gambar, tapi perlu keputusan: ikon

README meminta ikon: **check, plus/minus, chevron, star, pin lokasi, kalender, jam.**

Saat ini semuanya diganti karakter teks (`✓` `★` `+` `−` `›` `→` `←`). Berfungsi,
tapi ketebalan dan posisinya bergantung font. Dua pilihan:

1. **Lucide** (`lucide-react`) — seperti saran README. Butuh persetujuan karena
   aturan 9 handoff melarang dependency baru tanpa izin.
2. **7 file SVG manual** di `components/icons/` — tanpa dependency, tapi harus
   dibuat atau diambil satu per satu.

---

## Satu hal soal hak cipta

Tiga foto unit yang sudah terpasang (Scoopy, NMAX, Avanza) dari nama filenya
tampaknya diambil dari situs review/dealer — misalnya
`1639025819_review-toyota-all-new-avanza-2021-mpv-murah-bertaburkan-banyak-fitur.webp`.

Untuk prototype pribadi tidak masalah. Tapi kalau portofolio ini akan dipublikasikan,
sebaiknya ganti dengan foto milik sendiri, foto berlisensi bebas (Unsplash, Pexels),
atau foto resmi yang memang boleh dipakai ulang. Hal yang sama berlaku untuk
33 aset di atas — terutama avatar, yang sebaiknya **bukan wajah orang sungguhan**
tanpa izin, karena testimoninya fiktif.
