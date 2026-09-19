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
  /** "DP 30% terbayar", "Lunas", "Sisa tunai Rp 231.000". */
  statusBayar: string;
  status: StatusPesanan;
  /** pending: createdAt dari server, dasar hitungan batas 1 jam. */
  masukPada?: number;
  /** pending: "antar ke Villa Canggu" atau "ambil di kantor". */
  titik?: string;
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

export type DataBeranda = {
  sekarang: number;
  pesananHariIni: { masuk: number; dikonfirmasi: number };
  unitKeluar: { jumlah: number; totalUnit: number; daftar: UnitKeluar[] };
  pendapatan: { nilai: string; keterangan: string; bulan: string };
  mingguIni: { tanggal: number; jumlah: number }[];
};
