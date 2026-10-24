/**
 * Siapa yang sedang memakai slot sebuah unit.
 *
 * Aturannya SAMA PERSIS dengan yang dijaga database (migration.sql): slot
 * terisi oleh pesanan BERJALAN, pesanan MENUNGGU yang belum lewat batas
 * balas, dan blokir manual maupun servis. Kalau keduanya berbeda, pencarian
 * bisa bilang "kosong" untuk slot yang akan ditolak saat dipesan. Karena itu
 * batas balasnya dibaca dari fungsi batas_balas() di database, bukan dari
 * konstanta di sini.
 *
 * Batasan yang disadari: pesanan BERJALAN yang lewat jadwal kembali (telat)
 * tidak menghalangi pesanan berikutnya, karena database juga tidak. Unitnya
 * mungkin belum kembali secara fisik. Kalender mitra tetap menandainya
 * "telat" lewat okupansi() di bawah.
 */

import type { PrismaService } from '../prisma/prisma.service.js';

/** Id unit yang TIDAK bisa dipesan di [mulai, selesai). */
export async function unitTerisi(
  prisma: PrismaService,
  mulai: Date,
  selesai: Date,
): Promise<Set<string>> {
  const baris = await prisma.$queryRaw<{ unit_id: string }[]>`
    SELECT unit_id FROM pesanan
     WHERE rentang && tstzrange(${mulai}::timestamptz, ${selesai}::timestamptz, '[)')
       AND (status = 'BERJALAN'
            OR (status = 'MENUNGGU' AND dibuat_pada + batas_balas() > now()))
    UNION
    SELECT unit_id FROM blokir_unit
     WHERE rentang && tstzrange(${mulai}::timestamptz, ${selesai}::timestamptz, '[)')`;
  return new Set(baris.map((b) => b.unit_id));
}

export type JenisOkupansi = 'berjalan' | 'telat' | 'menunggu' | 'manual' | 'servis';

export type Okupansi = {
  unitId: string;
  jenis: JenisOkupansi;
  mulai: number;
  selesai: number;
  kodePesanan?: string;
};

/**
 * Semua yang menempati unit-unit tertentu di jendela [dari, sampai), untuk
 * kalender. Pesanan BERJALAN yang telat menghasilkan dua potong: masa sewa
 * aslinya ("berjalan"), lalu dari jadwal kembali sampai sekarang ("telat").
 */
export async function okupansi(
  prisma: PrismaService,
  unitIds: string[],
  dari: Date,
  sampai: Date,
  sekarang: number,
): Promise<Okupansi[]> {
  if (unitIds.length === 0) return [];
  const batasDibuat = new Date(sekarang - 60 * 60_000);

  const [pesanan, blokir] = await Promise.all([
    prisma.pesanan.findMany({
      where: {
        unitId: { in: unitIds },
        OR: [
          { status: 'BERJALAN', kembaliPada: null, mulai: { lt: sampai } },
          { status: 'MENUNGGU', dibuatPada: { gt: batasDibuat }, mulai: { lt: sampai }, selesai: { gt: dari } },
        ],
      },
      select: { unitId: true, kode: true, status: true, mulai: true, selesai: true },
    }),
    prisma.blokirUnit.findMany({
      where: { unitId: { in: unitIds }, mulai: { lt: sampai }, selesai: { gt: dari } },
      select: { unitId: true, jenis: true, mulai: true, selesai: true },
    }),
  ]);

  const hasil: Okupansi[] = [];
  for (const p of pesanan) {
    const mulai = p.mulai.getTime();
    const selesai = p.selesai.getTime();
    if (p.status === 'MENUNGGU') {
      hasil.push({ unitId: p.unitId, jenis: 'menunggu', mulai, selesai, kodePesanan: p.kode });
      continue;
    }
    hasil.push({ unitId: p.unitId, jenis: 'berjalan', mulai, selesai, kodePesanan: p.kode });
    if (selesai <= sekarang) {
      hasil.push({ unitId: p.unitId, jenis: 'telat', mulai: selesai, selesai: sekarang, kodePesanan: p.kode });
    }
  }
  for (const b of blokir) {
    hasil.push({
      unitId: b.unitId,
      jenis: b.jenis === 'SERVIS' ? 'servis' : 'manual',
      mulai: b.mulai.getTime(),
      selesai: b.selesai.getTime(),
    });
  }
  return hasil;
}

/** Rata-rata skor ulasan per unit. Rating tidak disimpan di unit. */
export async function ratingUnit(
  prisma: PrismaService,
  unitIds: string[],
): Promise<Map<string, { rata: number; jumlah: number }>> {
  const kelompok = await prisma.ulasan.groupBy({
    by: ['unitId'],
    where: { unitId: { in: unitIds } },
    _avg: { skor: true },
    _count: { _all: true },
  });
  return new Map(
    kelompok.map((k) => [
      k.unitId,
      { rata: Math.round(Number(k._avg.skor ?? 0) * 10) / 10, jumlah: k._count._all },
    ]),
  );
}
