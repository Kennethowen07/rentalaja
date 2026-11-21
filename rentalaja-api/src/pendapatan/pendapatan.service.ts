import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { MitraService } from '../mitra/mitra.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JEDA_REKENING_MS, labelRekening } from '../umum/rekening.js';
import { bersihPenyedia, statusDana, waktuPelepasan } from '../umum/status-pesanan.js';
import { awalHariWita, dariIsoWita, HARI, keIsoWita } from '../umum/waktu-wita.js';
import { MAKS_PENCAIRAN, type Periode, type TarikSaldoDto } from './dto/pendapatan.dto.js';
import { bentukRekening } from './rekening.service.js';

/** Berapa transaksi terbaru yang dikirim per periode. */
const BATAS_TRANSAKSI = 20;

const LABEL_KATEGORI = { MOTOR: 'Motor', MOBIL: 'Mobil' } as const;

export type Transaksi = {
  id: string;
  judul: string;
  /** Tanggal WITA saja, "2026-11-12". Jamnya sengaja tidak dikirim. */
  tanggal: string;
  nilai: number;
  arah: 'masuk' | 'keluar';
};

/** Tengah malam WITA tanggal 1, `geser` bulan dari bulan yang memuat `t`. */
function awalBulanWita(t: number, geser: number): number {
  const [y, b] = keIsoWita(t).split('-').map(Number);
  const d = new Date(Date.UTC(y, b - 1 + geser, 1));
  return dariIsoWita(d.toISOString().slice(0, 10))!;
}

/** Jendela [dari, akhir) sebuah periode. Periode yang masih berjalan
 *  berakhir sekarang: dana yang baru akan dilepas besok belum dihitung. */
function jendela(periode: Periode, sekarang: number): { dari: number; akhir: number } {
  switch (periode) {
    case 'bulan-ini':
      return { dari: awalBulanWita(sekarang, 0), akhir: sekarang + 1 };
    case 'bulan-lalu':
      return { dari: awalBulanWita(sekarang, -1), akhir: awalBulanWita(sekarang, 0) };
    case 'tiga-bulan':
      // 90 hari kalender WITA, hari ini termasuk.
      return { dari: awalHariWita(sekarang) - 89 * HARI, akhir: sekarang + 1 };
  }
}

/** Potongan platform dari satu pesanan. Dihitung sebagai selisih supaya
 *  kotor - biaya selalu sama persis dengan jumlah bersihPenyedia. */
const komisi = (subtotal: number) => subtotal - bersihPenyedia(subtotal);

/** Kode Prisma untuk transaksi interaktif yang tidak sempat mulai (antre
 *  koneksi lewat maxWait) atau lewat timeout. Transaksinya sudah di-rollback. */
const TRANSAKSI_HABIS_WAKTU = 'P2028';

/** Tarikan bersamaan antre di kunci baris mitra; tiap antrean memegang satu
 *  koneksi. Bawaan Prisma (maxWait 2 dtk, timeout 5 dtk) terlalu ketat untuk
 *  antrean panjang dan membuatnya jadi 500. */
const OPSI_TRANSAKSI_TARIK = { maxWait: 10_000, timeout: 10_000 };

@Injectable()
export class PendapatanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mitra: MitraService,
  ) {}

  /**
   * Pendapatan satu periode, DITURUNKAN dari pesanan, bukan angka tersimpan.
   * Yang dihitung hanya pesanan yang dananya sudah dilepas di dalam periode
   * itu (waktuPelepasan di status-pesanan.ts), jadi pesanan yang selesai
   * kemarin tapi baru dilepas besok masuk periode besok.
   */
  async pendapatan(penggunaId: string, periode: Periode = 'bulan-ini') {
    const mitra = await this.mitra.milik(penggunaId);
    const sekarang = Date.now();
    const { dari, akhir } = jendela(periode, sekarang);

    const [selesai, pencairan, saldo] = await Promise.all([
      this.prisma.pesanan.findMany({
        // Dana tidak pernah dilepas sebelum unit kembali, jadi kembaliPada
        // setelah akhir periode pasti di luar periode.
        where: { unit: { mitraId: mitra.id }, status: 'SELESAI', kembaliPada: { not: null, lt: new Date(akhir) } },
        select: {
          kode: true, status: true, dibuatPada: true, selesai: true, kembaliPada: true, subtotal: true,
          unit: { select: { nama: true, kategori: true } },
          klaim: { select: { diselesaikanPada: true } },
        },
      }),
      this.prisma.pencairan.findMany({
        where: { mitraId: mitra.id, dimintaPada: { gte: new Date(dari), lt: new Date(akhir) } },
        orderBy: { dimintaPada: 'desc' },
      }),
      this.hitungSaldo(this.prisma, mitra.id, sekarang),
    ]);

    const dilepas = selesai
      .map((p) => ({ ...p, lepas: waktuPelepasan(p, p.klaim) }))
      .filter((p): p is typeof p & { lepas: number } =>
        p.lepas !== null && p.lepas >= dari && p.lepas < akhir && p.lepas <= sekarang,
      );

    const kotor = dilepas.reduce((n, p) => n + p.subtotal, 0);
    const biaya = dilepas.reduce((n, p) => n + komisi(p.subtotal), 0);

    // Diurutkan dengan waktu lengkap, baru dipotong jadi tanggal saja.
    const transaksi: (Transaksi & { waktu: number })[] = [
      ...dilepas.flatMap((p) => [
        {
          id: `masuk-${p.kode}`,
          judul: `Dana masuk · ${p.unit.nama}`,
          waktu: p.lepas,
          tanggal: keIsoWita(p.lepas),
          nilai: bersihPenyedia(p.subtotal),
          arah: 'masuk' as const,
        },
        {
          id: `biaya-${p.kode}`,
          judul: 'Biaya layanan',
          waktu: p.lepas,
          tanggal: keIsoWita(p.lepas),
          nilai: komisi(p.subtotal),
          arah: 'keluar' as const,
        },
      ]),
      ...pencairan.map((c) => ({
        id: `cair-${c.id}`,
        judul: 'Pencairan ke rekening',
        waktu: c.dimintaPada.getTime(),
        tanggal: keIsoWita(c.dimintaPada.getTime()),
        nilai: c.jumlah,
        arah: 'keluar' as const,
      })),
    ];
    transaksi.sort((a, b) => b.waktu - a.waktu);

    return {
      periode,
      /** Tanggal WITA pertama dan terakhir yang dihitung, keduanya termasuk. */
      rentang: { dari: keIsoWita(dari), sampai: keIsoWita(Math.min(akhir, sekarang + 1) - 1) },
      kotor,
      biaya,
      bersih: kotor - biaya,
      /** Dana yang masih ditahan escrow SAAT INI, sama dengan GET /mitra/saldo.
       *  Bukan angka periode: dana ditahan tidak punya tanggal lepas. */
      ditahan: saldo.ditahan,
      jumlahPesanan: dilepas.length,
      sumber: (['MOTOR', 'MOBIL'] as const).map((k) => ({
        kategori: k,
        label: LABEL_KATEGORI[k],
        nilai: dilepas.filter((p) => p.unit.kategori === k).reduce((n, p) => n + p.subtotal, 0),
      })),
      transaksi: transaksi
        .slice(0, BATAS_TRANSAKSI)
        .map((t): Transaksi => ({ id: t.id, judul: t.judul, tanggal: t.tanggal, nilai: t.nilai, arah: t.arah })),
    };
  }

  async saldo(penggunaId: string) {
    const mitra = await this.mitra.milik(penggunaId);
    const s = await this.hitungSaldo(this.prisma, mitra.id, Date.now());
    const rekening = bentukRekening(mitra, Date.now());
    return {
      ...s,
      /** Label tersamar, mis. "BCA ···4471". null kalau belum diisi. */
      rekening: rekening?.label ?? null,
      /** Kalau rekening baru diubah: tarik saldo baru bisa setelah waktu ini. */
      bisaTarikPada: rekening?.terkunci ? rekening.bisaTarikPada : null,
    };
  }

  /**
   * Tarik saldo ke Mitra.rekening. Saldo tidak disimpan, jadi "cek saldo lalu
   * insert" rawan dua request bersamaan sama-sama lolos dan menarik dua kali.
   * Karena itu, di dalam satu transaksi, baris mitra dikunci lebih dulu
   * (FOR UPDATE): tarikan kedua menunggu sampai yang pertama commit, lalu
   * menghitung saldo yang sudah termasuk pencairan pertama.
   */
  async tarik(penggunaId: string, dto: TarikSaldoDto) {
    const { id: mitraId } = await this.mitra.milik(penggunaId);

    const hasil = await this.prisma.$transaction(async (tx) => {
      // Rekening dibaca dari baris yang sama dengan yang dikunci: ganti
      // rekening yang masuk bersamaan menunggu tarikan ini selesai, jadi
      // dana tidak bisa lolos ke rekening baru tanpa kena kunci 24 jam.
      const [kunci] = await tx.$queryRaw<
        { bank_rekening: string | null; nomor_rekening: string | null; rekening_diubah_pada: Date | null }[]
      >`
        SELECT bank_rekening, nomor_rekening, rekening_diubah_pada FROM mitra WHERE id = ${mitraId} FOR UPDATE`;
      if (!kunci?.bank_rekening || !kunci.nomor_rekening || !kunci.rekening_diubah_pada) {
        throw new BadRequestException('Rekening pencairan belum diisi. Lengkapi rekening dulu.');
      }
      const bisaTarik = kunci.rekening_diubah_pada.getTime() + JEDA_REKENING_MS;
      if (Date.now() < bisaTarik) {
        throw new ConflictException(
          `Rekening baru diubah. Demi keamanan, tarik saldo baru bisa mulai ${new Date(bisaTarik).toISOString()}.`,
        );
      }
      const rekening = labelRekening(kunci.bank_rekening, kunci.nomor_rekening);

      const { saldo } = await this.hitungSaldo(tx, mitraId, Date.now());
      if (saldo <= 0) throw new BadRequestException('Saldo kosong, belum ada yang bisa ditarik.');
      // Tanpa jumlah: seluruh saldo, tapi satu pencairan paling banyak
      // MAKS_PENCAIRAN (batas kolom INTEGER); sisanya tetap di saldo.
      const jumlah = dto.jumlah ?? Math.min(saldo, MAKS_PENCAIRAN);
      if (jumlah > saldo) {
        throw new BadRequestException(`Jumlah melebihi saldo. Saldo yang bisa ditarik Rp${saldo}.`);
      }

      const c = await tx.pencairan.create({ data: { mitraId, jumlah, rekening } });
      return { pencairan: c, sisa: saldo - jumlah };
    }, OPSI_TRANSAKSI_TARIK).catch((e: unknown) => {
      // Antrean terlalu panjang: tidak ada yang ditulis, aman diulang.
      if ((e as { code?: string } | null)?.code === TRANSAKSI_HABIS_WAKTU) {
        throw new ConflictException('Ada pencairan lain yang sedang diproses. Coba lagi sebentar.');
      }
      throw e;
    });

    return {
      pencairan: {
        id: hasil.pencairan.id,
        jumlah: hasil.pencairan.jumlah,
        rekening: hasil.pencairan.rekening,
        dimintaPada: hasil.pencairan.dimintaPada,
      },
      saldo: hasil.sisa,
    };
  }

  /**
   * saldo   = bersih penyedia dari semua dana yang sudah dilepas - semua pencairan
   * ditahan = bersih penyedia dari pesanan diterima yang dananya belum dilepas
   *           (berjalan, selesai belum lewat 24 jam, atau klaim masih terbuka)
   *
   * Pesanan MENUNGGU tidak dihitung ditahan: penyedia belum menerimanya dan
   * dananya bisa saja kembali ke penyewa.
   *
   * Menerima `tx` supaya bisa dipanggil di dalam transaksi tarik().
   */
  private async hitungSaldo(db: Prisma.TransactionClient, mitraId: string, sekarang: number) {
    // Berurutan, bukan Promise.all: di dalam transaksi keduanya memakai satu
    // koneksi yang sama.
    const pesanan = await db.pesanan.findMany({
      where: { unit: { mitraId }, status: { in: ['BERJALAN', 'SELESAI'] } },
      select: {
        status: true, dibuatPada: true, selesai: true, kembaliPada: true, subtotal: true,
        klaim: { select: { diselesaikanPada: true } },
      },
    });
    const cair = await db.pencairan.aggregate({ where: { mitraId }, _sum: { jumlah: true } });

    let dilepas = 0;
    let ditahan = 0;
    for (const p of pesanan) {
      const dana = statusDana(p, p.klaim, sekarang);
      if (dana === 'dilepas') dilepas += bersihPenyedia(p.subtotal);
      else if (dana === 'ditahan' || dana === 'ditahan_klaim') ditahan += bersihPenyedia(p.subtotal);
    }
    const dicairkan = cair._sum.jumlah ?? 0;
    return { saldo: dilepas - dicairkan, ditahan, totalDilepas: dilepas, totalDicairkan: dicairkan };
  }
}
