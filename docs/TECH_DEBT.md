# Technical Debt — RentalAja

Dicatat per commit `357e194` (13 Sep 2026). Cakupan: sisi penyewa, Layar 1–5.
Sisi penyedia (Layar 6–11) belum dibangun, jadi tidak masuk daftar ini.

Urutan di bawah = urutan yang disarankan untuk dikerjakan.

---

## 1. Tidak ada state pemesanan yang mengalir antar layar

**Prioritas: tinggi.** Ini akar dari sebagian besar ketidakcocokan angka di demo,
dan makin kentara sejak alurnya mulus (klik → modal QR → 3 detik → pesanan aktif).

Setiap layar membaca mock data-nya sendiri, jadi pilihan pengguna di satu layar
tidak pernah sampai ke layar berikutnya.

| Gejala | Di mana | Yang terjadi sekarang |
|---|---|---|
| Rentang tanggal hilang | Layar 2 → 3 | Pilih chip "20–27 Sep" di `/cari`, klik kartu → detail tetap bilang "Kosong 12–14 Sep · 3 hari". Kartu menghitung 8 hari, detail menghitung 3. |
| Unit hilang | Layar 3 → 4 | Klik "Pesan unit ini" dari NMAX → `/pemesanan` tetap menampilkan Honda Scoopy. |
| Angka panel tidak ikut isian | Layar 4 | Isi tanggal apa pun, panel kanan tetap Rp 210.000 / DP Rp 68.000. |
| Pesanan aktif palsu | Layar 5 | Apa pun yang diisi, `/pesanan` selalu Scoopy, 12–14 Sep, `#RA-284193`. |
| Query diabaikan | Layar 1 → 2 | Search card mengirim `mulai` dan `durasi`, tapi `/cari` hanya memakai `jenis` dan `area`; chip tanggal tetap tiga preset desain. |
| Tab Mobil | Layar 1 → 2 | Memilih "Mobil" hanya mengubah label pill; hasil pencarian tetap 6 motor. |

**Arah perbaikan:** satu sumber kebenaran untuk pesanan (`unitId`, `mulai`,
`selesai`, `jam`, `titikAntar`, `metodeBayar`). Untuk prototype paling murah lewat
URL search params — tahan refresh dan bisa dibagikan. Alternatif: context + `sessionStorage`.
Harga lalu **dihitung**, bukan dibaca dari mock: `hargaPerHari × hari`, DP = 30% + biaya layanan.

Catatan: tombol "Simulasikan Langsung" sengaja memakai tanggal 12–14 Sep supaya
cocok dengan Layar 5. Itu tambalan, bukan perbaikan — hapus tambalannya begitu
state mengalir.

---

## 2. Konflik spec desain vs WCAG — butuh keputusan desain

**Prioritas: tinggi, tapi bukan keputusan developer.** Nilai-nilai ini diterapkan
persis seperti spec (aturan 1 handoff: "ikuti design token persis"). Memperbaikinya
berarti menyimpang dari spec.

| Elemen | Nilai spec | Rasio | Syarat WCAG 2.2 |
|---|---|---|---|
| Border input search card | `#E5E7EB` di atas putih | 1,24:1 | 3:1 (1.4.11 Non-text Contrast) |
| Focus ring | `rgba(15,107,79,.28)` di atas putih | 1,54:1 | 3:1 |
| Label placeholder foto | `#9CA3AF` di atas `#EDF1EF` | 2,23:1 | 4,5:1 (1.4.3 Contrast) |
| Tab Motor / Mobil | `py-8` → tinggi ~35px | — | 44px — **syarat spec itu sendiri** |

Yang terakhir spec bertabrakan dengan dirinya sendiri: bagian Accessibility README
menuntut target sentuh 44px, section 3 menetapkan padding yang menghasilkan ~35px.

Kandidat pengganti yang sudah dicek: `#6B7280` (token `muted`, 4,83:1 terhadap putih)
untuk border input dan label placeholder; opacity focus ring dinaikkan ke ~.6 atau
ditambah `outline: 2px solid`.

---

## 3. Desain tipe yang lolos compiler tapi berbahaya

Build dan `tsc` bersih. Masalahnya tipe yang "berbohong" — aman hanya karena setiap
pemanggil saat ini kebetulan melakukan pengecekan manual.

- **`durasiHari: number` bisa berisi `NaN`** — `components/SearchCard.tsx`.
  `Number.parseInt("", 10)` saat field dikosongkan menghasilkan `NaN`, yang tetap
  bertipe `number`. Tiga tempat harus `Number.isFinite()` manual. Ganti jadi input
  string + `parseDurasi(): number | null`.
- **Kunci `Errors` tidak diturunkan dari `SearchForm`** — hapus field `durasiHari`,
  kode validasinya tetap compile. Turunkan dengan `keyof Pick<SearchForm, ...>`.
- **`area: string` membuang union `as const`** — `form.area = "Jakarta"` lolos
  type-check dan masuk URL. Pakai `(typeof areaAntarOptions)[number]` + type guard.
- **`rating: string` berisi `"4,9"`** — `lib/mock/units.ts`, `search.ts`.
  `Number("4,9")` = `NaN`, jadi filter "rating ≥ 4,5" nanti diam-diam membuang unit
  terbaik. Simpan sebagai `number`, format saat render.
- **`parseIso` tidak menolak tanggal mustahil** — `parseIso("2026-02-30")` jadi
  2 Maret, bukan `null`. Aman selama sumbernya `<input type="date">`; berbahaya kalau
  dipakai ulang untuk input manual atau API. Tambah cek round-trip.

---

## 4. Celah tooling

- **Tidak ada ESLint.** Proyek di-scaffold dengan `--no-eslint`. Tidak ada
  `eslint-plugin-react-hooks` (dependency array) maupun `eslint-plugin-jsx-a11y`.
  Menambahkannya butuh persetujuan (aturan 9 handoff: tanpa dependency baru).
- **Opsi `tsconfig` ketat yang mati:** `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`.
- **Nol test.** Kandidat pertama yang paling berharga: `tanggalKembali`,
  `urutkanHasil`, `hitungErrors`, dan kalkulasi harga — semuanya fungsi murni.
- **`graphify-out/` sudah basi.** Graf dibangun sebelum Layar 3, 4 (versi form),
  dan 5. Jalankan `/graphify --update` sebelum dipakai untuk bertanya soal codebase.

---

## 5. Pintasan prototype yang harus ditinjau sebelum dipublikasikan

Wajar untuk prototype, tapi jangan sampai ikut ke versi yang dipamerkan sebagai
"produk jadi".

**Harus dihapus atau diberi label jelas:**
- Tombol **"Simulasikan Langsung"** di `/pemesanan` (sudah ada keterangan "bukan
  bagian dari produk").
- **Modal "Simulasi MidTrans"** dan QR-nya — tidak ada pembayaran yang diproses.

**Tombol tanpa perilaku:**
- `/pesanan`: Hubungi penyedia, Lihat titik pengembalian, Perpanjang sewa,
  Ajukan reschedule, Laporkan masalah unit.
- Landing: "Lihat simulasi", "Jadi penyedia" (CTA), "Masuk", "Daftar".
- Footer: seluruh 9 tautan masih `href="#"`.
- `/cari`: filter Harga, Jenis motor, Antar jemput hanya tampilan.
- Detail unit: "Ganti tanggal" cuma kembali ke `/cari`.

**Data yang seharusnya tidak di-hardcode:**
- Metrik hero (340 / 4,8 / Rp 55rb) — README eksplisit: "jangan hardcode permanen".
- **Jawaban FAQ masih draft** bertanda `TODO(copy)` di `lib/mock/faq.ts`. README:
  "jawaban belum ditulis — minta copy ke pemilik produk".
- Label "Diverifikasi dari kalender penyedia, 2 menit lalu" di detail unit.

**Arsitektur:**
- `/unit/[slug]` memanggil endpoint miliknya sendiri lewat HTTP (`/api/units/:slug`).
  Satu hop ekstra di server — sengaja, supaya endpoint benar-benar terpakai. Saat
  backend sungguhan ada, ganti base URL; kalau tetap di Next, ambil data langsung
  di server component.
- Unggah dokumen hanya membaca **nama** file di memori; tidak ada yang diunggah.
- `/pesanan` tidak bisa dicapai dari navbar — navbar dikunci spec ke empat item.
  Satu-satunya jalan masuk: submit di `/pemesanan`.
- Format tanggal di form pemesanan mengikuti browser (`datetime-local`), bukan
  format desain "Sab, 12 Sep 2026 · 09.00".

---

## 6. Inkonsistensi di file desain itu sendiri

Dipertahankan apa adanya sesuai aturan copy verbatim. Perlu dikonfirmasi ke
pemilik desain.

- **Harga Scoopy berbeda:** Rp 75.000 di kartu "Unit populer" landing,
  Rp 70.000 di hasil pencarian, detail, dan pemesanan.
- **Helper text search card off-by-one:** desain menulis durasi "3 hari" tapi
  tanggal kembali "14 Sep" dari 12 Sep (= +2). Sudah diperbaiki dengan menghitung live.
- **Tanggal default search card sudah lewat:** "12 Sep 2026", padahal spec melarang
  tanggal lampau. Sudah diganti hari ini.
- **Scope drift:** design brief mengunci **9 layar** ("jangan tambah tanpa diminta"),
  handoff README dan PROMPT.md menyebut **11**.
- **Layar 11 tidak punya referensi visual:** hanya 10 penanda `dv-olabel` di
  `.dc.html`, tapi PROMPT.md tetap meminta Layar 11 diimplementasikan.

---

## 7. Penyimpangan sadar dari spec (bukan utang)

Dicatat di sini karena akan muncul sebagai "temuan" kalau audit konformitas
dijalankan ulang. Semuanya diminta atau disengaja.

| Perubahan | Spec | Sekarang | Alasan |
|---|---|---|---|
| Media kartu unit | tinggi 120px / 104px | `aspect-[16/9]` | Foto sumber 16:9; tinggi tetap memotongnya jadi ~3:1 |
| Container | padding 28px | 1200px / 24px | Instruksi produksi di README bagian Root |
| Tanggal default search | "12 Sep 2026" | hari ini | Spec melarang tanggal lampau |
| Blok penyedia | paling bawah detail | di atas, setelah spesifikasi | Penyewa asing di kota itu bertanya "siapa" lebih dulu |
| Tidak termasuk & deposit | paragraf | poin-poin | Permintaan |
| Baris spesifikasi detail | 13px | 15px | Permintaan |
| Meta penyedia | 11,5px | 13px | Permintaan |
| Isi paket & teks prosa | 12,5px | 14px | Permintaan |
| Strip kalender | 9,5 / 14 / 8,5px | 11 / 16 / 10,5px | 8,5px terlalu kecil untuk informasi inti produk |
| Kartu form pemesanan | putih | `#F9FAFB` → `#F4F8F5` saat lengkap | Pembeda untuk buta warna, dipasangkan dengan badge ✓ dan label teks |
| Stepper & timeline | warna saja | warna + ✓ + teks | Status harus terbaca dalam grayscale |
