// Bentuk data panel mitra, mengikuti bagian "State Management" di
// design_handoff_rentalaja_mitra/README.md. File ini tanpa import server,
// jadi aman dipakai komponen client.

export type StatusPesanan = "pending" | "active" | "completed" | "cancelled";
export type StatusUnit = "out" | "available" | "blocked" | "service";

/** Batas penyedia membalas pesanan. Lewat ini pesanan batal otomatis. */
export const BATAS_BALAS_MS = 60 * 60_000;

export type Mitra = {
  nama: string;
  pemilik: string;
  jumlahUnit: number;
  area: string;
};

export type Pesanan = {
  id: string;
  unit: string;
  plat: string;
  foto: string | null;
  penyewa: string;
  /** Nomor contoh untuk prototype, bukan nomor asli siapa pun. */
  telepon: string;
  mulai: number;
  selesai: number;
  total: string;
  /** Perjalanan dana di escrow: "Dibayar penuh · di escrow", "Ditahan
   *  escrow", "Dana dilepas", "Dana dikembalikan". */
  statusBayar: string;
  status: StatusPesanan;
  /** pending: createdAt dari server, dasar hitungan batas 1 jam. */
  masukPada?: number;
  /** Titik temu, tempatnya saja: "Villa Canggu, Jl. Pantai Batu Bolong". */
  titik?: string;
  /** true = unit diantar ke penyewa, false = penyewa ambil sendiri. */
  diantar?: boolean;
  /** active: jadwal kembali. */
  kembaliPada?: number;
  /** active yang lewat jadwal. */
  denda?: string;
  /** completed */
  selesaiPada?: number;
  /** cancelled */
  alasan?: string;
};

export type Unit = {
  id: string;
  nama: string;
  plat: string;
  foto: string | null;
  /** "matic 110cc · 2 helm" */
  spesifikasi: string;
  hargaPerHari: number;
  /** Status dasar. "out" tidak disimpan di sini: unit dianggap keluar kalau
   *  platnya cocok dengan pesanan berjalan, jadi sumbernya tetap satu. */
  status: Extract<StatusUnit, "available" | "service">;
  /** Hanya untuk status service. */
  servisSampai?: number;
};

export type UnitKeluar = {
  id: string;
  nama: string;
  plat: string;
  penyewa: string;
  foto: string | null;
  /** Jadwal kembali (epoch ms). Status tepat waktu / telat dihitung darinya. */
  kembaliPada: number;
};

export type JenisSerah = "antar" | "ambil";
export type StatusSerah = "jadwal" | "menunggu-foto" | "selesai";

/** Foto dan kondisi yang sudah tercatat untuk satu jadwal serah terima. */
export type CatatanSerah = {
  /** Empat sisi wajib: depan, belakang, kiri, kanan. null = belum difoto. */
  sisi: { label: string; foto: string | null }[];
  /** Kosong selama kondisi belum dicatat. */
  kondisi: { label: string; nilai: string }[];
  /** Klaim kerusakan saat unit kembali. Sejak deposit tunai dihapus, inilah
   *  satu-satunya jalan penyedia menagih kerusakan, dan dana penyewa ditahan
   *  rentalaja sampai klaimnya selesai. */
  klaim?: { nominal: number; keterangan: string };
};

/** Satu baris jadwal, diturunkan dari pesanan berjalan. */
export type JadwalSerah = CatatanSerah & {
  id: string;
  pesananId: string;
  jenis: JenisSerah;
  unit: string;
  plat: string;
  foto: string | null;
  penyewa: string;
  telepon: string;
  waktu: number;
  titik: string;
  catatan?: string;
  telat: boolean;
  status: StatusSerah;
};

export type Transaksi = {
  id: string;
  judul: string;
  /** "12 Sep 09.24 · Dewi Anggraini · BCA VA" */
  meta: string;
  nilai: number;
  /** keluar = biaya layanan dan pencairan, ditulis dengan tanda minus. */
  arah: "masuk" | "keluar";
};

export type Periode = {
  kunci: string;
  label: string;
  /** Kicker halaman, mis. "1 - 19 September 2026". */
  rentang: string;
  kotor: number;
  biaya: number;
  bersih: number;
  bandingan: string;
  transaksi: Transaksi[];
  sumber: { label: string; nilai: number }[];
};

export type Ulasan = {
  id: string;
  nama: string;
  unit: string;
  skor: number;
  tanggal: number;
  isi: string;
  /** Balasan penyedia. Kosong berarti belum dibalas. */
  balasan?: string;
};

export type RingkasanUlasan = {
  rata: number;
  total: number;
  /** 5 sampai 1 bintang. */
  distribusi: { bintang: number; jumlah: number }[];
};

export type DataBeranda = {
  sekarang: number;
  pesananHariIni: { masuk: number; dikonfirmasi: number };
  unitKeluar: { jumlah: number; totalUnit: number; daftar: UnitKeluar[] };
  pendapatan: { nilai: string; keterangan: string; bulan: string };
  mingguIni: { tanggal: number; jumlah: number }[];
};
