// Kredit foto unit.
//
// Semua foto kendaraan di prototype ini berlisensi bebas dari Wikimedia
// Commons. Yang berlisensi CC BY-SA WAJIB menyebut nama pembuat, tautan
// lisensi, dan bahwa fotonya diubah. Itu sebabnya daftar ini tampil sebagai
// halaman /kredit, bukan sekadar catatan di repo: kewajibannya berlaku pada
// media tempat fotonya dipakai.
//
// CC0 tidak mewajibkan apa pun, tapi tetap dicantumkan karena menyebut sumber
// itu hal yang pantas dan memudahkan penelusuran kalau fotonya mau diganti.
//
// Foto lama (Scoopy, NMAX, Avanza, dan lainnya) berasal dari situs review atau
// dealer dan sudah diganti — lihat docs/ASSETS_NEEDED.md.

import type { Bahasa } from "@/lib/i18n";

export type KreditFoto = {
  /** Nama berkas di public/units/, atau path relatif dari public/ kalau
   *  memuat "/" (mis. "serah-terima/..."). */
  berkas: string;
  /** Unit yang memakainya, untuk orang yang mencocokkan foto dengan daftar */
  unit: string;
  judul: string;
  halaman: string;
  lisensi: string;
  lisensiUrl: string;
  pembuat: string;
  /** Wajib disebut untuk CC BY-SA: apa saja yang diubah dari aslinya. */
  perubahan: string;
};

const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";

const POTONG = "Dipotong ke rasio 3:2 dan dikecilkan ke 900×600.";

/** Nama unit dan keterangan perubahan ditulis dalam bahasa Indonesia dari
 *  beberapa pola tetap; versi Inggrisnya diturunkan dari pola yang sama. */
export function terjemahKredit(teks: string, bahasa: Bahasa): string {
  if (bahasa === "id") return teks;
  return teks
    .replace(" (foto lain)", " (extra photo)")
    .replace("Serah terima, speedometer dan bensin", "Handover, speedometer and fuel gauge")
    .replace(/Dipotong ke rasio 3:2 dan dikecilkan ke (\S+)\./, "Cropped to a 3:2 ratio and resized to $1.")
    .replace("Plat nomor aslinya dikaburkan.", "The original number plate is blurred.");
}

export const kreditFoto: KreditFoto[] = [
  {
    berkas: "honda-scoopy-2023.webp",
    unit: "Honda Scoopy 2023",
    judul: "2023 Honda Scoopy Club 12.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2023_Honda_Scoopy_Club_12.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "Chanokchon",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-nmax-2022.webp",
    unit: "Yamaha NMAX 155",
    judul: "2020 Yamaha NMAX 155 ABS (20200810) 01.jpg",
    halaman:
      "https://commons.wikimedia.org/wiki/File:2020_Yamaha_NMAX_155_ABS_(20200810)_01.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  {
    berkas: "honda-beat-2022.webp",
    unit: "Honda Beat 2022",
    judul:
      "Potret Motor Beat di Tengah Pemandangan Sawah dan Gunung di Tanjungkerta, Sumedang, Jawa Barat (5).jpg",
    halaman:
      "https://commons.wikimedia.org/wiki/File:Potret_Motor_Beat_di_Tengah_Pemandangan_Sawah_dan_Gunung_di_Tanjungkerta,_Sumedang,_Jawa_Barat_(5).jpg",
    lisensi: "CC0",
    lisensiUrl: CC0,
    pembuat: "Pak Andri Irawan",
    perubahan: `${POTONG} Plat nomor aslinya dikaburkan.`,
  },
  {
    berkas: "honda-pcx-160-2023.webp",
    unit: "Honda PCX 160",
    judul: "2021 Honda PCX 160 Standard.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2021_Honda_PCX_160_Standard.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "Chanokchon",
    perubahan: POTONG,
  },
  {
    berkas: "honda-vario-160-2022.webp",
    unit: "Honda Vario 160",
    judul: "2022 Honda Vario 160 ABS (20221229).jpg",
    halaman:
      "https://commons.wikimedia.org/wiki/File:2022_Honda_Vario_160_ABS_(20221229).jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  {
    berkas: "vespa-sprint-2021.webp",
    unit: "Vespa Sprint 2021",
    judul: "Piaggio Vespa Sprint.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Piaggio_Vespa_Sprint.jpg",
    lisensi: "CC0",
    lisensiUrl: CC0,
    pembuat: "redfox (pixnio)",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-fino-2021.webp",
    unit: "Yamaha Fino 2021",
    judul: "Fino Yamaha 125.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Fino_Yamaha_125.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "Fadlullah Baso",
    perubahan: POTONG,
  },
  {
    berkas: "toyota-avanza-2021.webp",
    unit: "Toyota Avanza 2021",
    judul: "2021 Toyota Avanza 1.3 E F653RM (20211006).jpg",
    halaman:
      "https://commons.wikimedia.org/wiki/File:2021_Toyota_Avanza_1.3_E_F653RM_(20211006).jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: BY_SA_4,
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  // Foto tambahan untuk galeri detail unit (25 Okt 2026).
  {
    berkas: "honda-beat-2022-2.webp",
    unit: "Honda Beat 2022 (foto lain)",
    judul: "Potret Motor Beat di Tengah Pemandangan Sawah dan Gunung di Tanjungkerta, Sumedang, Jawa Barat (3).jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Potret_Motor_Beat_di_Tengah_Pemandangan_Sawah_dan_Gunung_di_Tanjungkerta,_Sumedang,_Jawa_Barat_(3).jpg",
    lisensi: "CC0",
    lisensiUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    pembuat: "Pak Andri Irawan",
    perubahan: `${POTONG} Plat nomor aslinya dikaburkan.`,
  },
  {
    berkas: "honda-beat-2022-3.webp",
    unit: "Honda Beat 2022 (foto lain)",
    judul: "Potret Motor Beat di Tengah Pemandangan Sawah dan Gunung di Tanjungkerta, Sumedang, Jawa Barat (6).jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Potret_Motor_Beat_di_Tengah_Pemandangan_Sawah_dan_Gunung_di_Tanjungkerta,_Sumedang,_Jawa_Barat_(6).jpg",
    lisensi: "CC0",
    lisensiUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    pembuat: "Pak Andri Irawan",
    perubahan: `${POTONG} Plat nomor aslinya dikaburkan.`,
  },
  {
    berkas: "toyota-avanza-2021-2.webp",
    unit: "Toyota Avanza 2021 (foto lain)",
    judul: "2021 Toyota Avanza 1.3 E F653RM (20210927) 01.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2021_Toyota_Avanza_1.3_E_F653RM_(20210927)_01.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  {
    berkas: "toyota-avanza-2021-3.webp",
    unit: "Toyota Avanza 2021 (foto lain)",
    judul: "2021 Toyota Avanza 1.3 E F653RM (20210927) 02.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2021_Toyota_Avanza_1.3_E_F653RM_(20210927)_02.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-nmax-2022-2.webp",
    unit: "Yamaha NMAX 155 (foto lain)",
    judul: "2020 Yamaha NMAX 155 ABS (20200810) 02.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2020_Yamaha_NMAX_155_ABS_(20200810)_02.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "オーバードライブ83",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-nmax-2022-3.webp",
    unit: "Yamaha NMAX 155 (foto lain)",
    judul: "Yamaha Nmax 155 front.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Yamaha_Nmax_155_front.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Corvettec6r",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-fino-2021-2.webp",
    unit: "Yamaha Fino 2021 (foto lain)",
    judul: "Fino Yamaha 125 ultrawide.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Fino_Yamaha_125_ultrawide.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Fadlullah Baso",
    perubahan: POTONG,
  },
  {
    berkas: "yamaha-fino-2021-3.webp",
    unit: "Yamaha Fino 2021 (foto lain)",
    judul: "Yamaha Fino.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Yamaha_Fino.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Addvisor",
    perubahan: POTONG,
  },
  {
    berkas: "honda-pcx-160-2023-2.webp",
    unit: "Honda PCX 160 (foto lain)",
    judul: "2021 Honda PCX 160 e-HEV ABS.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2021_Honda_PCX_160_e-HEV_ABS.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Chanokchon",
    perubahan: POTONG,
  },
  {
    berkas: "honda-pcx-160-2023-3.webp",
    unit: "Honda PCX 160 (foto lain)",
    judul: "2021 Honda PCX 160 ABS (New Color).jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2021_Honda_PCX_160_ABS_(New_Color).jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Chanokchon",
    perubahan: POTONG,
  },
  {
    berkas: "honda-scoopy-2023-2.webp",
    unit: "Honda Scoopy 2023 (foto lain)",
    judul: "2022 Honda Scoopy 110.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2022_Honda_Scoopy_110.jpg",
    lisensi: "CC0",
    lisensiUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    pembuat: "MoCars",
    perubahan: POTONG,
  },
  {
    berkas: "honda-scoopy-2023-3.webp",
    unit: "Honda Scoopy 2023 (foto lain)",
    judul: "2022 Honda Scoopy (4th model) in Mihi Mihi, La Belle salon - Jambi City, JA 01.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:2022_Honda_Scoopy_(4th_model)_in_Mihi_Mihi,_La_Belle_salon_-_Jambi_City,_JA_01.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Firzafp",
    perubahan: `${POTONG} Plat nomor aslinya dikaburkan.`,
  },
  {
    berkas: "vespa-sprint-2021-2.webp",
    unit: "Vespa Sprint 2021 (foto lain)",
    judul: "Vespa Sprint S 125 i-get 2026.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Vespa_Sprint_S_125_i-get_2026.jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "MotorideSA",
    perubahan: POTONG,
  },
  {
    berkas: "vespa-sprint-2021-3.webp",
    unit: "Vespa Sprint 2021 (foto lain)",
    judul: "Piaggio Vespa Sprint 125.jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Piaggio_Vespa_Sprint_125.jpg",
    lisensi: "CC BY-SA 2.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    pembuat: "宇弘 曾",
    perubahan: POTONG,
  },
  // Foto serah terima kelima di /pesanan (25 Okt 2026).
  {
    berkas: "serah-terima/scoopy-speedometer.webp",
    unit: "Serah terima, speedometer dan bensin",
    judul: "Fuel gauge and speedometer of a Rex RS 500 scooter with 50 ccm (cropped).jpg",
    halaman: "https://commons.wikimedia.org/wiki/File:Fuel_gauge_and_speedometer_of_a_Rex_RS_500_scooter_with_50_ccm_(cropped).jpg",
    lisensi: "CC BY-SA 4.0",
    lisensiUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    pembuat: "Pittigrilli",
    perubahan: "Dipotong ke rasio 3:2 dan dikecilkan ke 1200×800.",
  },
];
