/**
 * Status yang DITURUNKAN saat data dibaca, tidak disimpan (backend.md
 * bagian 4). Database hanya menyimpan status hasil aksi (MENUNGGU,
 * BERJALAN, SELESAI, DITOLAK, DIBATALKAN); "kedaluwarsa", "telat", dan
 * perjalanan dana dihitung di sini dari waktu.
 */

import { HARI, MENIT } from './waktu-wita.js';

/** Batas penyedia membalas. Di database nilainya fungsi batas_balas();
 *  keduanya harus selalu sama. */
export const BATAS_BALAS_MS = 60 * MENIT;

/** Dana dilepas ke penyedia 1x24 jam setelah unit tercatat kembali. */
export const JEDA_PELEPASAN_MS = HARI;

/** Potongan platform dari nilai sewa saat dana dilepas ke penyedia. */
export const KOMISI_PLATFORM = 0.05;

export type StatusTampil =
  | 'menunggu'
  | 'kedaluwarsa'
  | 'berjalan'
  | 'telat'
  | 'selesai'
  | 'ditolak'
  | 'dibatalkan';

export type StatusDana = 'ditahan' | 'ditahan_klaim' | 'dilepas' | 'dikembalikan';

type DataPesanan = {
  status: 'MENUNGGU' | 'BERJALAN' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN';
  dibuatPada: Date;
  selesai: Date;
  kembaliPada: Date | null;
};

type DataKlaim = { diselesaikanPada: Date | null } | null | undefined;

export function sudahKedaluwarsa(dibuatPada: Date, sekarang: number): boolean {
  return dibuatPada.getTime() + BATAS_BALAS_MS <= sekarang;
}

export function statusTurunan(p: DataPesanan, sekarang: number): StatusTampil {
  switch (p.status) {
    case 'MENUNGGU':
      return sudahKedaluwarsa(p.dibuatPada, sekarang) ? 'kedaluwarsa' : 'menunggu';
    case 'BERJALAN':
      // Lewat jadwal kembali dan belum tercatat kembali.
      return p.kembaliPada === null && p.selesai.getTime() <= sekarang ? 'telat' : 'berjalan';
    case 'SELESAI':
      return 'selesai';
    case 'DITOLAK':
      return 'ditolak';
    case 'DIBATALKAN':
      return 'dibatalkan';
  }
}

/** Kapan dana boleh dilepas ke penyedia, atau null kalau belum bisa
 *  ditentukan (unit belum kembali, atau klaim belum selesai). */
export function waktuPelepasan(p: DataPesanan, klaim: DataKlaim): number | null {
  if (p.status !== 'SELESAI' || p.kembaliPada === null) return null;
  const setelahKembali = p.kembaliPada.getTime() + JEDA_PELEPASAN_MS;
  if (!klaim) return setelahKembali;
  if (klaim.diselesaikanPada === null) return null;
  return Math.max(setelahKembali, klaim.diselesaikanPada.getTime());
}

export function statusDana(p: DataPesanan, klaim: DataKlaim, sekarang: number): StatusDana {
  const tampil = statusTurunan(p, sekarang);
  if (tampil === 'ditolak' || tampil === 'dibatalkan' || tampil === 'kedaluwarsa') {
    return 'dikembalikan';
  }
  if (p.status === 'SELESAI') {
    if (klaim && klaim.diselesaikanPada === null) return 'ditahan_klaim';
    const lepas = waktuPelepasan(p, klaim);
    if (lepas !== null && lepas <= sekarang) return 'dilepas';
  }
  return 'ditahan';
}

/** Yang diterima penyedia dari satu pesanan: nilai sewa dipotong komisi.
 *  Biaya layanan yang dibayar penyewa milik platform, tidak ikut di sini. */
export function bersihPenyedia(subtotal: number): number {
  return Math.round(subtotal * (1 - KOMISI_PLATFORM));
}
