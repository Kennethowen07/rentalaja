/**
 * Rekening tarik saldo penyedia, mengikuti kebiasaan aplikasi saham dan
 * kripto di Indonesia (keputusan pemilik proyek 12 Nov 2026):
 *
 * - Bank dipilih dari daftar tetap, bukan teks bebas.
 * - Rekening harus atas nama pemilik akun. Aplikasi sungguhan mengambil nama
 *   ini dari bank (inquiry nama rekening lewat penyedia pembayaran). Itu
 *   belum ada, jadi nama yang diketik penyedia dicocokkan dengan nama
 *   akunnya. Ini SIMULASI: belum ada bukti rekeningnya benar-benar milik dia.
 * - Mengisi atau mengganti rekening wajib memasukkan kata sandi lagi.
 * - Tarik saldo dikunci JEDA_REKENING_MS setelah rekening diubah, supaya
 *   orang yang membajak sesi tidak bisa langsung mengalihkan dana.
 * - Nomor lengkap tidak pernah dikirim balik, hanya 4 digit terakhir.
 */

import { HARI } from './waktu-wita.js';

export const JEDA_REKENING_MS = HARI;

type Bank = { kode: string; nama: string; /** Panjang nomor kalau pasti. */ digit?: number };

export const BANK: readonly Bank[] = [
  { kode: 'BCA', nama: 'BCA', digit: 10 },
  { kode: 'BNI', nama: 'BNI', digit: 10 },
  { kode: 'BRI', nama: 'BRI', digit: 15 },
  { kode: 'MANDIRI', nama: 'Mandiri', digit: 13 },
  { kode: 'BSI', nama: 'BSI' },
  { kode: 'CIMB', nama: 'CIMB Niaga' },
  { kode: 'PERMATA', nama: 'Permata' },
  { kode: 'DANAMON', nama: 'Danamon' },
  { kode: 'BTN', nama: 'BTN' },
  { kode: 'BPD_BALI', nama: 'BPD Bali' },
  { kode: 'JAGO', nama: 'Bank Jago' },
  { kode: 'SEABANK', nama: 'SeaBank' },
];

export const KODE_BANK = BANK.map((b) => b.kode);

export function bankDari(kode: string): Bank | undefined {
  return BANK.find((b) => b.kode === kode);
}

/** Pesan galat kalau nomor tidak cocok dengan bank, atau null kalau sah.
 *  Bentuk dasarnya (8 sampai 18 angka) dijaga DTO dan CHECK database. */
export function salahNomor(kode: string, nomor: string): string | null {
  const bank = bankDari(kode);
  if (!bank) return 'Bank tidak dikenal.';
  if (bank.digit && nomor.length !== bank.digit) {
    return `Nomor rekening ${bank.nama} harus ${bank.digit} digit.`;
  }
  return null;
}

/** Sapaan yang tidak pernah tertulis di nama rekening bank. */
const SAPAAN = new Set(['PAK', 'BAPAK', 'BPK', 'BU', 'IBU', 'MR', 'MRS', 'MS', 'MISS']);

/** Nama untuk dicocokkan: huruf besar, tanpa tanda baca dan sapaan di depan.
 *  "Pak Wayan" dan "WAYAN" dianggap sama, "Wayan S." dan "Wayan" tidak. */
export function normalNama(nama: string): string {
  const kata = nama
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  while (kata.length > 1 && SAPAAN.has(kata[0])) kata.shift();
  return kata.join(' ');
}

export function namaCocok(namaRekening: string, namaAkun: string): boolean {
  const a = normalNama(namaRekening);
  return a.length > 0 && a === normalNama(namaAkun);
}

/** "BCA ···4471". Dipakai di layar saldo dan disalin ke riwayat pencairan. */
export function labelRekening(kode: string, nomor: string): string {
  return `${bankDari(kode)?.nama ?? kode} ···${nomor.slice(-4)}`;
}
