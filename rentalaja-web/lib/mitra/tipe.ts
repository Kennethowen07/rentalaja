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

/** Pesanan berstatus pending. `masukPada` = createdAt dari server (epoch ms). */
export type PesananMenunggu = {
  id: string;
  masukPada: number;
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
