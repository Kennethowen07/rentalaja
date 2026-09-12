# Handoff: RentalAja — Landing Page (v2) + Wireframe Flow Lengkap

## Overview
RentalAja adalah platform sewa motor dan mobil di Bali. Nilai jualnya: ketersediaan unit
yang jujur (kalender real-time), harga tetap, DP 30%, dan serah terima berfoto dua arah.

Paket ini berisi:
1. **Landing page baru (v2)** — halaman utama penuh yang bisa di-scroll, 12 section.
2. **Flow wireframe lengkap** — 11 layar: sisi penyewa (layar 1-5) dan sisi penyedia/admin (layar 6-11).

Fokus implementasi pertama: **landing page v2**.

## About the Design Files
File di bundle ini adalah **design reference yang dibuat dalam HTML** — prototipe yang
menunjukkan tampilan dan perilaku yang diinginkan, **bukan production code untuk di-copy
langsung**. Tugasnya adalah **membuat ulang desain ini di dalam environment codebase tujuan**
(React/Next.js, Vue, Astro, dsb.) memakai pattern, styling system, dan library yang sudah ada
di sana. Kalau belum ada codebase, pilih framework yang paling sesuai (rekomendasi:
Next.js + Tailwind CSS) dan implementasikan desainnya di situ.

Catatan teknis: file `.dc.html` memakai runtime kustom (`<x-dc>`, `<sc-for>`, `{{ }}`).
Jangan mencoba memakai runtime itu. Baca file sebagai referensi markup + style saja;
bagian interaktif (filter tanggal, toggle unit) dijelaskan dalam dokumen ini.

## Fidelity
**Medium-to-high fidelity.** Warna, tipografi, spacing, radius, dan copy sudah final dan
harus diikuti persis (nilai lengkap di bagian Design Tokens). Yang masih placeholder:
semua foto (kotak abu-abu berlabel "foto unit", "foto serah terima") dan ikon — diganti
dengan aset asli / icon set codebase. Layout grid dan hierarki tipografi harus dipertahankan.
Lebar canvas desain = 1060px (viewport desktop); breakpoint tablet/mobile belum digambar,
aturannya ada di bagian Responsive.

---

## SCREEN UTAMA — Landing Page v2

Root: lebar penuh, konten dibatasi container dengan padding horizontal 28px (skala desain
1060px; di produksi pakai `max-width: 1200px; margin-inline: auto; padding-inline: 24px`).
Background dasar `#FFFFFF`. Font: **Plus Jakarta Sans** (400/500/600/700/800), Google Fonts.

Urutan section dari atas ke bawah:

### 1. Navbar (sticky)
- `position: sticky; top: 0; z-index: 5`, tinggi **60px**, background `rgba(255,255,255,.94)`
  (tambahkan `backdrop-filter: blur(8px)` di produksi), border-bottom `1px solid #E1E9E4`.
- Kiri: wordmark teks `rentalaja` — 800, 19px, `#0F6B4F`, letter-spacing `-.02em`.
- Kanan (flex, gap 26px, align center): "Sewa" (600, 13px, `#1A1A1A`, **aktif** → padding
  vertikal 20px + `border-bottom: 2px solid #0F6B4F`), "Cara kerja", "Jadi penyedia",
  "Bantuan" (500, 13px, `#1A1A1A`).
- Paling kanan (gap 10px, margin-left 10px): "Masuk" (600, 13px, `#1A1A1A`) dan tombol
  **Daftar** — background `#0F6B4F`, teks putih 600/13px, padding `9px 16px`, radius 8px.
- Hover: link → `#0F6B4F`; tombol Daftar → `#0B5540`.

### 2. Hero
- Background: `linear-gradient(90deg, rgba(6,42,31,.94) 0%, rgba(9,54,40,.78) 52%, rgba(9,54,40,.42) 100%)`
  di atas foto `hero-parkir.png`, `center 38% / cover no-repeat`.
- Padding `58px 28px 86px`. Blok teks `max-width: 580px`.
- Eyebrow pill: inline-flex, gap 7px, background `rgba(207,230,220,.16)`,
  border `1px solid rgba(207,230,220,.38)`, radius 999px, padding `6px 13px`,
  teks 600/11.5px `#CFE6DC` → "Kalender real-time · 62 rental di Bali".
- H1 (margin-top 16px): 800, **38px**, line-height 1.13, letter-spacing `-.025em`, putih →
  "Lihat unit yang benar-benar kosong di tanggalmu."
- Subline (margin-top 13px): 500, 15px, line-height 1.55, `#CFE6DC` →
  "Harga tetap, tanpa chat dulu. Pilih tanggal, bayar DP 30%, unit diantar ke titik yang kamu tentukan."
- Trust row (margin-top 22px, flex gap 22px, dipisah divider 1px `rgba(255,255,255,.22)`):
  3 metrik — angka 800/20px putih, label 500/11px `#9FC4B4`:
  "340 / unit terdaftar", "4,8 / rating penyedia", "Rp 55rb / motor termurah / hari".

### 3. Search card (mengambang, overlap hero)
- `margin: -46px 28px 0; position: relative; z-index: 1`, background putih,
  border `1px solid #E1E9E4`, radius **14px**, padding 16px,
  shadow `0 10px 30px rgba(9,54,40,.13)`.
- Tab jenis (flex gap 8px, margin-bottom 14px): **Motor** aktif → 700/13px `#0F6B4F`,
  background `#E8F3EE`, radius 999px, padding `8px 16px`; **Mobil** nonaktif →
  600/13px `#6B7280`, border `1px solid #E5E7EB`, radius 999px, padding sama.
- Grid field: `grid-template-columns: 1.3fr 1fr 1fr .8fr auto; gap: 12px; align-items: end`.
  Setiap field = label (600/11px `#6B7280`, margin-bottom 6px) + input box
  (border `1px solid #E5E7EB`, radius 8px, padding `11px 12px`, teks 600/13px `#1A1A1A`).
  Field: **Area antar** ("Canggu, Badung"), **Tanggal ambil** ("12 Sep 2026"),
  **Jam ambil** ("09.00"), **Durasi** ("3 hari").
- Tombol **Cari unit**: `#0F6B4F`, putih 700/14px, padding `13px 30px`, radius 8px.
- Helper text (margin-top 11px, 500/12px `#6B7280`): "Kembali **Senin, 14 Sep 2026 pukul 09.00**.
  Hasil pencarian hanya menampilkan unit yang kosong di rentang itu." (bagian tanggal 700 `#1A1A1A`).
- Produksi: Area antar = combobox, Tanggal = date range picker, Jam = time select,
  Durasi = number stepper. Submit → `/cari?area=&mulai=&jam=&durasi=`.

### 4. "Tiga langkah, tanpa chat"
- Padding `36px 28px 34px`, background putih.
- Heading 700/18px `#1A1A1A` letter-spacing `-.01em`; subheading 500/13px `#6B7280` margin-top 5px →
  "Semua konfirmasi terjadi di dalam aplikasi, bukan di WhatsApp."
- Grid 3 kolom, gap 16px, margin-top 18px. Kartu: background `#FBFDFB`,
  border `1px solid #E1E9E4`, radius 12px, padding 18px.
  - Badge nomor: 28x28px, radius 8px, background `#E8F3EE`, teks 800/12px `#0F6B4F` ("01/02/03"), centered.
  - Judul (margin-top 11px): 700/14.5px `#1A1A1A`. Body (margin-top 5px): 500/12px/1.55 `#6B7280`.
  - Isi: **Isi tanggal** — "Daftar unit langsung menyaring diri sendiri sesuai rentang sewamu." /
    **Bayar DP 30%** — "Sisanya dibayar saat unit diantar. Nota digital langsung terbit." /
    **Unit diantar** — "Serah terima berfoto di titik yang kamu pilih, dua arah."

### 5. "Unit populer minggu ini" (band hijau muda)
- Background `#F4F8F5`, border-top & border-bottom `1px solid #E1E9E4`, padding `34px 28px`.
- Header row: judul 700/18px `#1A1A1A` + sub 500/13px `#6B7280` ("Canggu, Seminyak, Ubud");
  kanan link 600/12.5px `#0F6B4F` → "Lihat semua unit →".
- Grid 3 kolom, gap 16px, margin-top 18px. Kartu: putih, border `1px solid #E1E9E4`,
  radius 12px, overflow hidden.
  - Media: tinggi **120px**, background `#EDF1EF` (placeholder foto unit).
  - Body padding 14px: nama 700/14.5px `#1A1A1A`; meta 500/11.5px `#6B7280` margin-top 3px;
    harga row margin-top 11px → angka 800/16px **`#0F6B4F`** + "/hari" 500/11px `#6B7280`.
  - Data: "Honda Scoopy 2023 · ★ 4,9 · Canggu · skutik 110cc · Rp 75.000",
    "Yamaha NMAX 2022 · ★ 4,8 · Seminyak · skutik 155cc · Rp 110.000",
    "Toyota Avanza 2021 · ★ 4,7 · Ubud · MPV 7 kursi · Rp 320.000".
- Hover kartu: `translateY(-2px)` + shadow `0 8px 20px rgba(9,54,40,.10)`, transition 160ms ease.

### 6. "Kenapa rentalaja" (split 2 kolom)
- Padding `38px 28px`, grid `1fr 1fr`, gap 34px, align center.
- Kolom kiri: eyebrow 600/11px `#0F6B4F` uppercase letter-spacing `.1em` → "Kenapa rentalaja";
  H2 (margin-top 10px) 800/26px/1.22 `#1A1A1A` letter-spacing `-.02em` →
  "Ketersediaan yang jujur, harga yang tidak berubah di tengah jalan."
- Checklist (margin-top 18px, flex column gap 13px). Tiap item: bullet 20x20px radius 999px
  background `#0F6B4F` berisi ✓ putih 700/11px; judul 700/13.5px `#1A1A1A`;
  body 500/12px/1.5 `#6B7280`:
  1. **Kalender terhubung ke unit asli** — "Unit yang sudah dipesan hilang dari hasil pencarian secara otomatis."
  2. **Serah terima berfoto dua arah** — "Kondisi unit tercatat saat diantar dan saat dikembalikan."
  3. **Deposit dan denda tertulis sejak awal** — "Semua biaya muncul di rincian sebelum kamu bayar DP."
- Kolom kanan: grid 2x2, gap 10px, tiap sel tinggi **148px** radius 12px:
  - (1) placeholder foto `#EDF1EF` "foto serah terima"
  - (2) background `#093628`, padding 16px, konten di bawah: "98%" 800/24px putih +
    "pesanan dikonfirmasi di bawah 10 menit" 500/11.5px/1.45 `#9FC4B4`
  - (3) background `#E8F3EE`, "0" 800/24px `#0F6B4F` +
    "biaya tersembunyi saat pengambilan unit" 500/11.5px/1.45 `#3F6B5B`
  - (4) placeholder foto `#EDF1EF` "foto unit di parkiran"

### 7. Testimoni (band hijau tua)
- Background `#093628`, padding `38px 28px`.
- Eyebrow 600/11px `#9FC4B4` uppercase letter-spacing `.1em` → "Kata penyewa".
- Grid 3 kolom gap 16px margin-top 16px. Kartu: background `rgba(255,255,255,.07)`,
  border `1px solid rgba(255,255,255,.14)`, radius 12px, padding 18px.
  - Kutipan 500/13px/1.6 `#EAF3EF` (pakai tanda kutip lengkung “ ”).
  - Footer (margin-top 14px, flex gap 9px): avatar 28x28px radius 999px
    `rgba(255,255,255,.18)`; nama 700/12px putih; meta 500/10.5px `#9FC4B4`.
  - Isi: Dimas / Canggu, 3 hari — "Tanggal yang muncul memang kosong. Tidak ada lagi drama
    unit sudah keburu dipakai orang." · Sarah / Seminyak, 5 hari — "DP 30% bikin tenang.
    Sisanya bayar saat motor sampai di penginapan." · Yoga / Ubud, 2 hari — "Foto serah
    terima menyelamatkan saya waktu ada lecet yang sudah ada sejak awal."

### 8. "Area yang dilayani"
- Padding `34px 28px`, judul 700/18px `#1A1A1A`.
- Chip row (margin-top 14px, flex wrap gap 8px): 7 chip aktif — 600/12.5px `#0F6B4F`,
  background `#E8F3EE`, radius 999px, padding `8px 14px`: Canggu, Seminyak, Kuta, Ubud,
  Sanur, Denpasar, Uluwatu. Chip terakhir netral: 600/12.5px `#6B7280`,
  border `1px solid #E5E7EB` → "+ 12 area lain".

### 9. CTA penyedia
- `margin: 0 28px 34px`, background `linear-gradient(105deg, #0F6B4F 0%, #093628 100%)`,
  radius **16px**, padding 30px, flex row space-between align center gap 24px.
- Kiri (max-width 520px): H2 800/23px/1.25 putih letter-spacing `-.02em` →
  "Punya unit yang sering menganggur?"; body (margin-top 9px) 500/13px/1.55 `#CFE6DC` →
  "Daftarkan rental kamu, kelola kalender dan pesanan dari satu dashboard. Tanpa biaya pendaftaran."
- Kanan (flex gap 10px): **Jadi penyedia** — background putih, teks `#0F6B4F` 700/13.5px,
  padding `13px 22px`, radius 9px. **Lihat simulasi** — border `1px solid rgba(255,255,255,.45)`,
  teks putih 700/13.5px, padding & radius sama.

### 10. FAQ
- Background `#F4F8F5`, border-top `1px solid #E1E9E4`, padding `32px 28px`.
- Judul 700/18px `#1A1A1A`. List (margin-top 16px, flex column gap 9px).
- Item = accordion tertutup: putih, border `1px solid #E1E9E4`, radius 10px,
  padding `14px 16px`, flex space-between; pertanyaan 600/13px `#1A1A1A`;
  ikon "+" 600/13px `#0F6B4F` (jadi "−" saat terbuka).
- Pertanyaan: "Apakah harga bisa berubah setelah saya bayar DP?" · "Bagaimana kalau saya
  ingin membatalkan pesanan?" · "Dokumen apa yang perlu saya siapkan saat unit diantar?" ·
  "Apakah deposit dikembalikan penuh?" (jawaban belum ditulis — minta copy ke pemilik produk).

### 11. Footer
- Background `#062A1F`, padding `34px 28px 26px`.
- Grid `1.4fr 1fr 1fr 1fr`, gap 24px.
  - Kolom brand: wordmark 800/19px putih; deskripsi 500/12px/1.6 `#9FC4B4` margin-top 9px →
    "Sewa motor dan mobil di Bali dengan ketersediaan yang bisa dipercaya."
  - 3 kolom link: judul 700/12px putih; item 500/12px, line-height 2, `#9FC4B4`.
    **Penyewa**: Cari unit, Cara kerja, Bantuan. **Penyedia**: Daftarkan rental, Dashboard,
    Biaya layanan. **Perusahaan**: Tentang, Kebijakan privasi, Syarat dan ketentuan.
- Bottom bar: border-top `1px solid rgba(255,255,255,.14)`, margin-top 22px, padding-top 14px,
  teks 500/11px `#6E8F82` → "© 2026 rentalaja".

---

## Layar lain dalam flow (wireframe, lofi-medium)
Semua ada di `RentalAja Wireframes.dc.html` (turn 1). Gunakan design token yang sama.

**Sisi penyewa**
1. **Beranda** — versi ringkas landing page (digantikan oleh landing v2 di atas).
2. **Hasil pencarian** — filter bar sticky (jenis+area, chip tanggal, harga, jenis motor,
   antar jemput) + grid kartu 3 kolom. Interaktif: klik chip tanggal → jumlah unit, label
   tanggal, durasi, harga total, badge, dan CTA tiap kartu berubah (unit yang tidak tersedia
   jadi disabled).
3. **Detail unit** — galeri (2fr/1fr), judul + meta, strip ketersediaan 7 hari (kotak per
   hari: hijau = kosong, abu = terisi), spesifikasi, aturan, panel harga sticky 320px
   dengan rincian DP 30%.
4. **Pemesanan** — form data penyewa, titik antar, unggah KTP/SIM, ringkasan biaya, bayar DP.
5. **Pesanan aktif** — status timeline, detail unit, kontak penyedia, tombol perpanjang.

**Sisi penyedia**
6. **Dashboard penyedia** — kartu metrik (pendapatan, unit tersewa, pesanan baru, rating),
   daftar pesanan hari ini, grafik okupansi.
7. **Unit dan kalender** — tabel unit x kalender, sel per hari menunjukkan status.
8. **Pesanan masuk dan konfirmasi** — antrean pesanan, aksi terima/tolak, catatan.
9. **Serah terima dan pengembalian** — checklist berfoto dua arah, catatan kerusakan, deposit.
10. **Unit kendaraan** — daftar unit dengan **toggle available/unavailable** (interaktif).
11. **Form tambah/edit unit** — unggah foto + thumbnail preview, deskripsi, harga per
    hari/minggu/bulan, deposit, paket (asuransi, driver, GPS), toggle ketersediaan,
    aksi Simpan / Batal.

---

## Interactions & Behavior
- **Navbar**: sticky sejak scroll 0. Link aktif ditandai underline 2px `#0F6B4F`.
- **Search card**: validasi — area, tanggal, dan durasi wajib. Tanggal tidak boleh di masa lalu.
  Helper text menghitung tanggal kembali dari tanggal ambil + durasi (live update).
- **Kartu unit**: seluruh kartu clickable → halaman detail unit. Hover lift 2px + shadow.
- **FAQ**: accordion, satu item terbuka sekaligus (atau multi — bebas), ikon + / −,
  animasi height 180ms ease.
- **Filter tanggal (layar 2)**: state `selectedDate`; mengubah daftar unit, hitungan unit,
  durasi, harga total, badge ketersediaan, dan status CTA.
- **Toggle unit (layar 10 & 11)**: state `available` per unit; mengubah warna toggle dan
  label status di bawahnya.
- **Transisi umum**: 160-200ms `ease`. Hindari animasi masuk yang berlebihan.
- **Loading**: skeleton abu `#EDF1EF` dengan radius sama seperti kartu.
- **Error**: teks 500/12px `#B42318` di bawah field, border field `#B42318`.

## State Management
Landing page pada dasarnya statis. State yang dibutuhkan:
- `searchForm: { jenis: 'motor'|'mobil', area, tanggalAmbil, jamAmbil, durasiHari }`
- `faqOpen: string | null`
- Data section "Unit populer" idealnya di-fetch (`GET /api/units/popular?limit=3`),
  boleh hardcode dulu memakai copy di atas.
- Metrik hero (340 / 4,8 / Rp 55rb) — dari endpoint statistik atau CMS, jangan hardcode
  permanen.

## Design Tokens
**Warna**
| Token | Hex | Pemakaian |
|---|---|---|
| green-700 (primary) | `#0F6B4F` | tombol utama, wordmark, aksen harga, link |
| green-800 (hover) | `#0B5540` | hover tombol utama |
| green-900 | `#093628` | band testimoni, kartu statistik gelap, ujung gradient |
| green-950 | `#062A1F` | footer, ujung gelap gradient hero |
| green-100 | `#E8F3EE` | chip/pill aktif, badge nomor, kartu statistik terang |
| green-50 | `#F4F8F5` | background section (unit populer, FAQ) |
| green-25 | `#FBFDFB` | background kartu "tiga langkah" |
| green-200 (border) | `#E1E9E4` | border kartu & pemisah section |
| green-300 (text on dark) | `#CFE6DC` | body text di atas hijau tua |
| green-400 (muted on dark) | `#9FC4B4` | label/meta di atas hijau tua |
| green-600 (text on tint) | `#3F6B5B` | body di atas `#E8F3EE` |
| ink | `#1A1A1A` | judul dan teks utama |
| muted | `#6B7280` | teks sekunder |
| placeholder text | `#9CA3AF` | label placeholder foto |
| border netral | `#E5E7EB` | border input & chip netral |
| surface placeholder | `#EDF1EF` | kotak foto placeholder |
| footer bottom text | `#6E8F82` | copyright |
| error | `#B42318` | pesan validasi |

**Tipografi** — Plus Jakarta Sans
| Peran | Ukuran / weight / line-height / tracking |
|---|---|
| H1 hero | 38px / 800 / 1.13 / -.025em |
| H2 section | 26px / 800 / 1.22 / -.02em |
| H2 CTA | 23px / 800 / 1.25 / -.02em |
| Judul section | 18px / 700 / normal / -.01em |
| Judul kartu | 14.5px / 700 |
| Harga | 16px / 800 |
| Metrik besar | 24px / 800 (hero 20px) |
| Body | 13px / 500 / 1.55 |
| Body kecil | 12px / 500 / 1.55 |
| Meta | 11.5px / 500 |
| Label field | 11px / 600 |
| Eyebrow | 11px / 600 / uppercase / .1em |
| Nav link | 13px / 500-600 |
| Tombol | 13.5-14px / 700 |

**Spacing** — kelipatan yang dipakai: 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 18, 22, 24, 26,
28, 30, 34, 36, 38, 46, 58, 86. Padding section standar: `34-38px` vertikal, `28px` horizontal.
Gap grid kartu: `16px`.

**Radius**: 6px (browser bar), 8px (input, tombol), 9px (tombol CTA di gradient),
10px (kartu FAQ), 12px (kartu), 14px (search card), 16px (blok CTA), 999px (pill/chip/avatar).

**Shadow**: search card `0 10px 30px rgba(9,54,40,.13)`;
hover kartu `0 8px 20px rgba(9,54,40,.10)`.

**Gradient**: hero overlay `linear-gradient(90deg, rgba(6,42,31,.94) 0%, rgba(9,54,40,.78) 52%, rgba(9,54,40,.42) 100%)`;
CTA `linear-gradient(105deg, #0F6B4F 0%, #093628 100%)`.

## Responsive
Desain digambar di 1060px. Aturan yang diminta:
- **≥1024px**: seperti desain.
- **640-1023px**: grid 3 kolom → 2 kolom; split "Kenapa rentalaja" → 1 kolom (teks dulu);
  grid field search → 2 kolom, tombol "Cari unit" full width di baris terakhir;
  footer → 2 kolom; H1 turun ke 30px.
- **<640px**: semua grid → 1 kolom; nav jadi hamburger + drawer; hero padding
  `40px 20px 64px`, H1 26px; search card `margin: -32px 20px 0`; trust row jadi wrap;
  CTA penyedia jadi kolom (tombol full width); padding horizontal section 20px.
- Semua tinggi kartu/gambar fixed (120px, 148px) boleh jadi aspect-ratio di layar kecil.

## Accessibility
- Kontras: teks putih di atas `#0F6B4F`/`#093628` aman. Jangan pakai `#9FC4B4` untuk
  teks body kecil di atas `#062A1F` di ukuran <11px — naikkan ke `#CFE6DC` bila perlu.
- Semua placeholder foto perlu `alt` deskriptif saat diganti aset asli.
- FAQ accordion: `<button aria-expanded>` + region ber-`id`.
- Target sentuh mobile minimal 44px.
- Focus ring: `0 0 0 3px rgba(15,107,79,.28)`.

## Assets
- `assets/hero-parkir.png` — foto background hero (satu-satunya aset gambar nyata dalam bundle).
- Semua gambar lain adalah **placeholder** (kotak `#EDF1EF` berlabel teks). Perlu foto asli:
  3 foto unit (Scoopy, NMAX, Avanza), 1 foto serah terima, 1 foto unit di parkiran,
  3 avatar testimoni.
- Ikon: belum ada icon set; pakai icon library codebase (mis. Lucide). Yang dibutuhkan:
  check, plus/minus, chevron, star, pin lokasi, kalender, jam.
- Font: Plus Jakarta Sans — `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap`

## Files
- `RentalAja Wireframes.dc.html` — sumber desain. Turn 2 (`id="2a"`) = **landing page v2**
  (referensi utama). Turn 1 (`id="1a"`) = 11 layar flow.
- `RentalAja Wireframes (CHECKPOINT 2).dc.html` — snapshot versi yang disetujui (identik).
- `assets/hero-parkir.png`
- `PROMPT.md` — prompt siap-tempel untuk Claude Code.
