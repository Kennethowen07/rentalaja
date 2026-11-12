import type { PenggunaToken } from '../auth/penjaga.js';
import type { Prisma } from '../generated/prisma/client.js';

/**
 * Pesanan yang boleh dilihat dan diubah pengguna ini: penyewa hanya
 * pesanannya sendiri, mitra hanya pesanan untuk unit miliknya. Dipakai
 * module pesanan dan chat, supaya aturan "siapa boleh menyentuh pesanan
 * mana" hanya ditulis sekali.
 */
export function milikPengguna(p: PenggunaToken): Prisma.PesananWhereInput {
  return p.peran === 'MITRA' ? { unit: { mitra: { pemilikId: p.id } } } : { penyewaId: p.id };
}

/**
 * Satu pesanan berkode `kode` milik pengguna ini (kode datang dari URL).
 * Kode berisi karakter NUL tidak mungkin ada, dan PostgreSQL menolak NUL di
 * parameter teks (query-nya error, jawabannya 500). Jadi kode seperti itu
 * diperlakukan sama dengan kode yang tidak ada: WHERE yang tidak cocok
 * dengan baris mana pun, lalu pemanggil menjawab 404 seperti biasa.
 */
export function pesananBerkode(p: PenggunaToken, kode: string): Prisma.PesananWhereInput {
  return kode.includes('\0') ? { id: { in: [] } } : { kode, ...milikPengguna(p) };
}
