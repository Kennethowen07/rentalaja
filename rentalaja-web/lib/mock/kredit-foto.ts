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

export type KreditFoto = {
  /** Nama berkas di public/units/ */
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
];
