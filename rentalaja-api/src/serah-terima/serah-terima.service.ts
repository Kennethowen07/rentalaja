import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import type { JenisSerah, SisiFoto } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PenggunaToken } from '../auth/penjaga.js';
import { pesananBerkode } from '../pesanan/akses-pesanan.js';
import {
  dendaBerjalan,
  hariTelat,
  infoKembaliAwal,
  kembaliAwalDisepakati,
  sebelumJatuhTempo,
  statusDana,
  statusTurunan,
  waktuPelepasan,
} from '../umum/status-pesanan.js';
import { awalHariWita, HARI } from '../umum/waktu-wita.js';
import type { CatatSerahTerimaDto } from './dto/catat-serah-terima.dto.js';
import type { TabSerah } from './dto/filter-serah-terima.dto.js';
import type { JenisSerahTampil } from './dto/param-serah-terima.dto.js';

/** Empat sisi wajib, urutannya sama dengan frontend. */
const SISI: { kunci: 'depan' | 'belakang' | 'kiri' | 'kanan'; enum: SisiFoto }[] = [
  { kunci: 'depan', enum: 'DEPAN' },
  { kunci: 'belakang', enum: 'BELAKANG' },
  { kunci: 'kiri', enum: 'KIRI' },
  { kunci: 'kanan', enum: 'KANAN' },
];

const KE_ENUM: Record<JenisSerahTampil, JenisSerah> = { antar: 'ANTAR', ambil: 'AMBIL' };
const DARI_ENUM: Record<JenisSerah, JenisSerahTampil> = { ANTAR: 'antar', AMBIL: 'ambil' };

/** Status satu jadwal, sama dengan StatusSerah di rentalaja-web/lib/mitra/tipe.ts. */
type StatusSerah = 'jadwal' | 'menunggu-foto' | 'selesai';
const STATUS_TAB: Record<TabSerah, StatusSerah> = {
  'hari-ini': 'jadwal',
  'menunggu-foto': 'menunggu-foto',
  selesai: 'selesai',
};

/** Riwayat tab "selesai" dibatasi supaya respons tidak tumbuh tanpa batas. */
const BATAS_RIWAYAT = 50;

const ISI_PESANAN = {
  unit: { select: { nama: true, plat: true, foto: true } },
  penyewa: { select: { nama: true, telepon: true } },
  serahTerima: { include: { foto: true } },
  klaim: true,
} satisfies Prisma.PesananInclude;

type PesananSerah = Prisma.PesananGetPayload<{ include: typeof ISI_PESANAN }>;
type CatatanDb = PesananSerah['serahTerima'][number];
type Kondisi = { label: string; nilai: string };

/** Kolom kondisi bertipe Json. Isinya selalu ditulis service ini, tapi tetap
 *  dibaca hati-hati supaya baris rusak tidak membuat seluruh layar gagal. */
function bacaKondisi(nilai: Prisma.JsonValue): Kondisi[] {
  if (!Array.isArray(nilai)) return [];
  return nilai.flatMap((k) =>
    k && typeof k === 'object' && !Array.isArray(k) && typeof k.label === 'string' && typeof k.nilai === 'string'
      ? [{ label: k.label, nilai: k.nilai }]
      : [],
  );
}

/** Lengkap = empat sisi sudah difoto DAN kondisi sudah dicatat. */
function lengkap(c: CatatanDb | undefined): boolean {
  return !!c && c.foto.length === SISI.length && bacaKondisi(c.kondisi).length > 0;
}

/** Aturannya sama dengan statusDari() di SerahTerimaPanel.tsx. */
function statusCatatan(c: CatatanDb | undefined): StatusSerah {
  if (!c) return 'jadwal';
  const fotoLengkap = c.foto.length === SISI.length;
  const adaKondisi = bacaKondisi(c.kondisi).length > 0;
  if (fotoLengkap && adaKondisi) return 'selesai';
  if (fotoLengkap || adaKondisi) return 'menunggu-foto';
  return 'jadwal';
}

/** true kalau kiriman ini tidak mengubah apa pun pada catatan yang ada.
 *  Dipakai supaya kiriman ulang (mis. retry setelah koneksi putus) atas
 *  catatan yang sudah lengkap dijawab 200, bukan 409: PUT tetap idempoten. */
function tidakMengubah(
  lama: CatatanDb,
  dto: CatatSerahTerimaDto,
  foto: { sisi: SisiFoto; url: string }[],
  klaimLama: { nominal: number; keterangan: string } | null,
): boolean {
  if (dto.kondisi) {
    const baru = dto.kondisi.map((k) => ({ label: k.label, nilai: k.nilai }));
    if (JSON.stringify(baru) !== JSON.stringify(bacaKondisi(lama.kondisi))) return false;
  }
  if (dto.catatan !== undefined && (dto.catatan || null) !== lama.catatan) return false;
  if (foto.some((f) => lama.foto.find((x) => x.sisi === f.sisi)?.url !== f.url)) return false;
  if (
    dto.klaim &&
    (!klaimLama || klaimLama.nominal !== dto.klaim.nominal || klaimLama.keterangan !== dto.klaim.keterangan)
  ) {
    return false;
  }
  return true;
}

/**
 * Denda keterlambatan, DICATAT SAJA (keputusan pemilik proyek). Rumusnya
 * satu-satunya ada di src/umum/status-pesanan.ts (hariTelat, dendaBerjalan),
 * dipakai juga oleh pesanan dan panel mitra; di sini hanya dibentuk untuk
 * baris jadwal. Null kalau tidak telat.
 */
function dendaTelat(p: PesananSerah, sekarang: number): { hariTelat: number; nominal: number } | null {
  const hari = hariTelat(p, sekarang);
  return hari > 0 ? { hariTelat: hari, nominal: dendaBerjalan(p, sekarang) } : null;
}

@Injectable()
export class SerahTerimaService {
  constructor(private readonly prisma: PrismaService) {}

  /** id mitra milik pengguna yang login. 403 kalau akunnya belum punya usaha
   *  rental, sama dengan MitraService.milik(). */
  private async idMitra(penggunaId: string): Promise<string> {
    const m = await this.prisma.mitra.findUnique({ where: { pemilikId: penggunaId }, select: { id: true } });
    if (!m) throw new ForbiddenException('Akun ini belum terdaftar sebagai mitra.');
    return m.id;
  }

  /**
   * Jadwal serah terima. Jadwalnya TIDAK disimpan: diturunkan dari pesanan
   * berjalan, sama dengan jadwalDariPesanan() di SerahTerimaPanel.tsx. Yang
   * disimpan hanya catatannya (kondisi, foto, klaim).
   *
   *   antar  pesanan berjalan yang mulai hari ini (WITA), atau yang mulai lebih
   *          awal tapi catatan antarnya belum lengkap, supaya tugas yang
   *          tertinggal tidak hilang dari layar
   *   ambil  pesanan berjalan yang jatuh tempo hari ini atau sudah lewat dan
   *          belum kembali, atau yang catatan ambilnya sudah mulai diisi
   *          (unit dikembalikan lebih awal)
   *
   * Tab "selesai" adalah riwayat: semua catatan lengkap terbaru, termasuk milik
   * pesanan yang sudah SELESAI dan karenanya tidak lagi punya jadwal.
   */
  async daftar(penggunaId: string, tab: TabSerah = 'hari-ini') {
    const mitraId = await this.idMitra(penggunaId);
    const sekarang = Date.now();
    const hariIni = awalHariWita(sekarang);

    const berjalan = await this.prisma.pesanan.findMany({
      where: { unit: { mitraId }, status: 'BERJALAN', mulai: { lt: new Date(hariIni + HARI) } },
      include: ISI_PESANAN,
    });

    const jadwal = berjalan.flatMap((p) => {
      const baris: ReturnType<SerahTerimaService['bentukBaris']>[] = [];
      const antar = p.serahTerima.find((c) => c.jenis === 'ANTAR');
      const ambil = p.serahTerima.find((c) => c.jenis === 'AMBIL');
      if (awalHariWita(p.mulai.getTime()) === hariIni || !lengkap(antar)) {
        baris.push(this.bentukBaris(p, 'ANTAR', sekarang));
      }
      // Kembali lebih awal yang sudah disepakati kedua pihak langsung
      // muncul sebagai jadwal ambil, tanpa menunggu hari jatuh tempo.
      if (awalHariWita(p.selesai.getTime()) <= hariIni || ambil || kembaliAwalDisepakati(p)) {
        baris.push(this.bentukBaris(p, 'AMBIL', sekarang));
      }
      return baris;
    });

    const jumlah = {
      'hari-ini': jadwal.filter((b) => b.status === 'jadwal').length,
      'menunggu-foto': jadwal.filter((b) => b.status === 'menunggu-foto').length,
    };

    let daftar: ReturnType<SerahTerimaService['bentukBaris']>[];
    if (tab === 'selesai') {
      daftar = await this.riwayat(mitraId, sekarang);
    } else {
      daftar = jadwal
        .filter((b) => b.status === STATUS_TAB[tab])
        .sort((a, b) => a.waktu.getTime() - b.waktu.getTime());
    }

    return { sekarang: new Date(sekarang), tab, jumlah, daftar };
  }

  /** Catatan lengkap terbaru, paling baru di atas. Kelengkapan foto dan
   *  kondisi (Json) tidak bisa disaring di SQL dengan rapi, jadi diambil
   *  berlebih lalu disaring di sini. */
  private async riwayat(mitraId: string, sekarang: number) {
    const catatan = await this.prisma.serahTerima.findMany({
      where: { pesanan: { unit: { mitraId } } },
      include: { foto: { select: { id: true } } },
      orderBy: { dicatatPada: 'desc' },
      take: BATAS_RIWAYAT * 3,
    });
    const terpilih = catatan
      .filter((c) => c.foto.length === SISI.length && bacaKondisi(c.kondisi).length > 0)
      .slice(0, BATAS_RIWAYAT);
    if (terpilih.length === 0) return [];

    const pesanan = await this.prisma.pesanan.findMany({
      where: { id: { in: [...new Set(terpilih.map((c) => c.pesananId))] } },
      include: ISI_PESANAN,
    });
    const perId = new Map(pesanan.map((p) => [p.id, p]));
    return terpilih.map((c) => this.bentukBaris(perId.get(c.pesananId)!, c.jenis, sekarang));
  }

  /**
   * Catat kondisi, foto, catatan, dan (khusus ambil) klaim kerusakan.
   *
   * Aturan yang dijaga di sini:
   * - Hanya pesanan BERJALAN milik mitra ini (yang lain 404 / 409), dan
   *   baru mulai hari sewanya (WITA); sebelum itu 409.
   * - Ambil hanya boleh setelah catatan antar LENGKAP. Catatan antar adalah
   *   pembanding kondisi saat unit kembali; tanpa itu klaim tidak punya bukti.
   * - Catatan yang sudah lengkap dikunci: foto dan kondisi adalah bukti yang
   *   disaksikan penyewa saat serah terima, jadi tidak bisa diubah sesudahnya.
   *   Kiriman ulang yang identik tetap dijawab 200 (idempoten).
   * - Saat catatan ambil menjadi lengkap, pesanan jadi SELESAI dan kembaliPada
   *   = sekarang. Itu dasar hitungan pelepasan dana 1x24 jam.
   *
   * Semua dalam satu transaksi dengan baris pesanan dikunci (FOR UPDATE),
   * jadi dua permintaan bersamaan untuk pesanan yang sama antre satu per satu
   * dan pesanan tidak bisa diselesaikan dua kali.
   */
  async catat(penggunaId: string, kode: string, jenisTampil: JenisSerahTampil, dto: CatatSerahTerimaDto) {
    const mitraId = await this.idMitra(penggunaId);
    const jenis = KE_ENUM[jenisTampil];
    const foto = SISI.flatMap((s) => {
      const url = dto.foto?.[s.kunci];
      return url ? [{ sisi: s.enum, url }] : [];
    });

    if (!dto.kondisi && foto.length === 0 && dto.catatan === undefined && !dto.klaim) {
      throw new BadRequestException('Tidak ada yang dicatat. Kirim kondisi, foto, catatan, atau klaim.');
    }
    if (dto.klaim && jenis !== 'AMBIL') {
      throw new BadRequestException('Klaim kerusakan hanya bisa diajukan saat unit diambil kembali.');
    }

    const awal = await this.prisma.pesanan.findFirst({ where: { kode, unit: { mitraId } }, select: { id: true } });
    if (!awal) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "pesanan" WHERE "id" = ${awal.id} FOR UPDATE`;
      const p = await tx.pesanan.findUniqueOrThrow({
        where: { id: awal.id },
        include: { serahTerima: { include: { foto: true } }, klaim: true },
      });
      const lama = p.serahTerima.find((c) => c.jenis === jenis);

      // Kiriman ulang yang identik atas catatan lengkap: tidak ada yang
      // ditulis, jawabannya keadaan sekarang. Termasuk ambil yang sudah
      // membuat pesanan SELESAI.
      if (lama && lengkap(lama) && tidakMengubah(lama, dto, foto, p.klaim)) return;

      if (p.status !== 'BERJALAN') {
        throw new ConflictException(
          p.status === 'SELESAI'
            ? 'Pesanan sudah selesai. Catatan serah terimanya tidak bisa diubah lagi.'
            : 'Serah terima hanya untuk pesanan yang sedang berjalan.',
        );
      }
      // Sama dengan jadwal: pesanan baru punya serah terima mulai hari
      // sewanya (WITA). Tanpa ini antar dan ambil bisa dicatat sebelum sewa
      // dimulai, pesanan jadi SELESAI dan hitungan pelepasan dana berjalan.
      if (awalHariWita(p.mulai.getTime()) > awalHariWita(Date.now())) {
        throw new ConflictException('Serah terima baru bisa dicatat mulai hari sewa.');
      }
      const antar = p.serahTerima.find((c) => c.jenis === 'ANTAR');
      if (jenis === 'AMBIL' && !lengkap(antar)) {
        throw new ConflictException(
          'Lengkapi catatan antar (empat foto dan kondisi) sebelum mencatat unit kembali.',
        );
      }
      // Kembali sebelum hari jatuh tempo hanya kalau penyewa dan mitra sudah
      // sama-sama setuju (POST /pesanan/:kode/kembali-awal). Trigger
      // pesanan_kembali_awal menjaga hal yang sama di database.
      if (jenis === 'AMBIL' && sebelumJatuhTempo(p, Date.now()) && !kembaliAwalDisepakati(p)) {
        throw new ConflictException(
          'Unit belum jatuh tempo. Pengembalian lebih awal butuh persetujuan penyewa dan mitra dulu.',
        );
      }
      if (lengkap(lama)) {
        throw new ConflictException('Catatan serah terima ini sudah lengkap dan tidak bisa diubah lagi.');
      }

      const isi = {
        ...(dto.kondisi ? { kondisi: dto.kondisi.map((k) => ({ label: k.label, nilai: k.nilai })) } : {}),
        ...(dto.catatan !== undefined ? { catatan: dto.catatan || null } : {}),
        dicatatPada: new Date(),
      };
      const catatan = await tx.serahTerima.upsert({
        where: { pesananId_jenis: { pesananId: p.id, jenis } },
        create: { pesananId: p.id, jenis, ...isi },
        update: isi,
      });
      for (const f of foto) {
        await tx.fotoSerah.upsert({
          where: { serahTerimaId_sisi: { serahTerimaId: catatan.id, sisi: f.sisi } },
          create: { serahTerimaId: catatan.id, sisi: f.sisi, url: f.url },
          update: { url: f.url },
        });
      }
      if (dto.klaim) {
        // Selama pesanan berjalan klaimnya belum mungkin diselesaikan, jadi
        // klaim yang diajukan ulang sebelum catatan lengkap cukup ditimpa.
        const klaim = { nominal: dto.klaim.nominal, keterangan: dto.klaim.keterangan };
        await tx.klaimKerusakan.upsert({
          where: { pesananId: p.id },
          create: { pesananId: p.id, ...klaim },
          update: { ...klaim, diajukanPada: new Date() },
        });
      }

      if (jenis === 'AMBIL') {
        const segar = await tx.serahTerima.findUniqueOrThrow({
          where: { id: catatan.id },
          include: { foto: true },
        });
        if (lengkap(segar)) {
          await tx.pesanan.update({
            where: { id: p.id },
            data: { status: 'SELESAI', kembaliPada: new Date() },
          });
        }
      }
    });

    const p = await this.prisma.pesanan.findUniqueOrThrow({ where: { id: awal.id }, include: ISI_PESANAN });
    return this.bentukBaris(p, jenis, Date.now());
  }

  /**
   * Mitra pemilik unit menandai klaim kerusakan selesai. Sesudahnya dana
   * dilepas menurut waktuPelepasan(): paling cepat 1x24 jam setelah unit
   * kembali. Penyewa belum bisa membantah (keputusan pemilik proyek), dan
   * nominal klaim tidak memindahkan dana ke mana pun; yang berubah hanya
   * dana tidak lagi ditahan karena klaim.
   */
  async selesaikanKlaim(penggunaId: string, kode: string) {
    const mitraId = await this.idMitra(penggunaId);
    const p = await this.prisma.pesanan.findFirst({
      where: { kode, unit: { mitraId } },
      select: { id: true, status: true, klaim: true },
    });
    if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
    if (!p.klaim) throw new NotFoundException(`Pesanan ${kode} tidak punya klaim kerusakan.`);
    if (p.status !== 'SELESAI') {
      throw new ConflictException('Catat pengembalian unit sampai lengkap sebelum menyelesaikan klaim.');
    }

    // Syarat "belum selesai" ada di WHERE, jadi dua permintaan bersamaan
    // tidak bisa sama-sama menulis waktu selesai.
    const hasil = await this.prisma.klaimKerusakan.updateMany({
      where: { pesananId: p.id, diselesaikanPada: null },
      data: { diselesaikanPada: new Date() },
    });
    if (hasil.count === 0) throw new ConflictException('Klaim ini sudah ditandai selesai.');

    const segar = await this.prisma.pesanan.findUniqueOrThrow({ where: { id: p.id }, include: { klaim: true } });
    const sekarang = Date.now();
    const lepas = waktuPelepasan(segar, segar.klaim);
    return {
      kode: segar.kode,
      klaim: segar.klaim && {
        nominal: segar.klaim.nominal,
        keterangan: segar.klaim.keterangan,
        diajukanPada: segar.klaim.diajukanPada,
        diselesaikanPada: segar.klaim.diselesaikanPada,
      },
      statusDana: statusDana(segar, segar.klaim, sekarang),
      danaDilepasPada: lepas === null ? null : new Date(lepas),
    };
  }

  /** Satu baris jadwal, bentuknya mengikuti JadwalSerah di frontend. Waktu
   *  dikirim sebagai ISO string seperti endpoint lain, bukan epoch ms. */
  private bentukBaris(p: PesananSerah, jenis: JenisSerah, sekarang: number) {
    const c = p.serahTerima.find((x) => x.jenis === jenis);
    const tampil = DARI_ENUM[jenis];
    const status = statusTurunan(p, sekarang);
    const denda = jenis === 'AMBIL' ? dendaTelat(p, sekarang) : null;
    return {
      id: `${p.kode}-${tampil}`,
      pesananId: p.kode,
      jenis: tampil,
      status: statusCatatan(c),
      unit: p.unit.nama,
      plat: p.unit.plat,
      foto: p.unit.foto,
      penyewa: p.penyewa.nama,
      telepon: p.penyewa.telepon,
      waktu: jenis === 'ANTAR' ? p.mulai : p.selesai,
      mulai: p.mulai,
      selesai: p.selesai,
      titik: p.titik,
      diantar: p.diantar,
      /** Ambil yang lewat jadwal kembali dan unitnya belum tercatat kembali. */
      telat: jenis === 'AMBIL' && status === 'telat',
      statusPesanan: status,
      statusDana: statusDana(p, p.klaim, sekarang),
      // CatatanSerah.sisi di frontend berbentuk { label, foto }. `sisi` adalah
      // kunci tetap; `label` sama dengan teks Indonesia di SerahTerimaPanel.
      sisi: SISI.map((s) => ({
        sisi: s.kunci,
        label: s.kunci,
        foto: c?.foto.find((f) => f.sisi === s.enum)?.url ?? null,
      })),
      kondisi: c ? bacaKondisi(c.kondisi) : [],
      catatan: c?.catatan ?? null,
      dicatatPada: c?.dicatatPada ?? null,
      // Klaim hanya ada di baris ambil, karena hanya diajukan saat unit kembali.
      klaim:
        jenis === 'AMBIL' && p.klaim
          ? {
              nominal: p.klaim.nominal,
              keterangan: p.klaim.keterangan,
              diajukanPada: p.klaim.diajukanPada,
              diselesaikanPada: p.klaim.diselesaikanPada,
            }
          : null,
      /** Denda telat yang dicatat, tidak ditagih. Null kalau tidak telat. */
      denda,
      kembaliPada: p.kembaliPada,
      /** Persetujuan kembali lebih awal, hanya di baris ambil. */
      kembaliAwal: jenis === 'AMBIL' ? infoKembaliAwal(p) : null,
    };
  }

  /**
   * Penyewa atau mitra menyatakan setuju unit dikembalikan sebelum hari jatuh
   * tempo. Masing-masing pihak mengisi kolomnya sendiri; begitu keduanya
   * terisi, mitra boleh mencatat ambil. Kirim ulang tidak mengubah waktu
   * persetujuan pertama (idempoten).
   *
   * Syarat: pesanan berjalan, unit sudah tercatat diserahkan (antar lengkap),
   * dan belum hari jatuh tempo. Di hari jatuh tempo unit langsung bisa
   * dicatat kembali tanpa persetujuan.
   */
  async setujuKembaliAwal(pengguna: PenggunaToken, kode: string) {
    const kolom = pengguna.peran === 'MITRA' ? 'kembaliAwalMitraPada' : 'kembaliAwalPenyewaPada';
    const id = await this.idPesanan(pengguna, kode);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "pesanan" WHERE "id" = ${id} FOR UPDATE`;
      const p = await tx.pesanan.findUniqueOrThrow({
        where: { id },
        include: { serahTerima: { include: { foto: true } } },
      });
      if (p.status !== 'BERJALAN') {
        throw new ConflictException('Pengembalian lebih awal hanya untuk pesanan yang sedang berjalan.');
      }
      if (!sebelumJatuhTempo(p, Date.now())) {
        throw new ConflictException('Hari ini sudah hari jatuh tempo. Unit bisa langsung dicatat kembali.');
      }
      if (!lengkap(p.serahTerima.find((c) => c.jenis === 'ANTAR'))) {
        throw new ConflictException('Unit belum tercatat diserahkan ke penyewa.');
      }
      if (p[kolom] === null) await tx.pesanan.update({ where: { id }, data: { [kolom]: new Date() } });
    });
    return this.keadaanKembaliAwal(id);
  }

  /**
   * Tarik persetujuan. Hanya selama mitra belum mulai mencatat ambil: setelah
   * itu kondisi dan foto pengembalian sudah disaksikan kedua pihak.
   */
  async batalKembaliAwal(pengguna: PenggunaToken, kode: string) {
    const kolom = pengguna.peran === 'MITRA' ? 'kembaliAwalMitraPada' : 'kembaliAwalPenyewaPada';
    const id = await this.idPesanan(pengguna, kode);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "pesanan" WHERE "id" = ${id} FOR UPDATE`;
      const p = await tx.pesanan.findUniqueOrThrow({ where: { id }, include: { serahTerima: true } });
      if (p.status !== 'BERJALAN') {
        throw new ConflictException('Pesanan sudah tidak berjalan; persetujuan tidak bisa ditarik.');
      }
      if (p.serahTerima.some((c) => c.jenis === 'AMBIL')) {
        throw new ConflictException('Pencatatan unit kembali sudah dimulai; persetujuan tidak bisa ditarik.');
      }
      if (p[kolom] !== null) await tx.pesanan.update({ where: { id }, data: { [kolom]: null } });
    });
    return this.keadaanKembaliAwal(id);
  }

  /** id pesanan berkode `kode` yang boleh disentuh pengguna ini, atau 404. */
  private async idPesanan(pengguna: PenggunaToken, kode: string): Promise<string> {
    const p = await this.prisma.pesanan.findFirst({ where: pesananBerkode(pengguna, kode), select: { id: true } });
    if (!p) throw new NotFoundException(`Pesanan ${kode} tidak ditemukan.`);
    return p.id;
  }

  private async keadaanKembaliAwal(id: string) {
    const p = await this.prisma.pesanan.findUniqueOrThrow({ where: { id } });
    return { kode: p.kode, selesai: p.selesai, kembaliAwal: infoKembaliAwal(p) };
  }
}
