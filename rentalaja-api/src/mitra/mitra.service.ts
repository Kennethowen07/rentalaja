import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { okupansi } from '../umum/ketersediaan.js';
import {
  BATAS_BALAS_MS,
  bersihPenyedia,
  statusDana,
  statusTurunan,
  waktuPelepasan,
  type StatusTampil,
} from '../umum/status-pesanan.js';
import { awalHariWita, dariIsoWita, HARI, keIsoWita } from '../umum/waktu-wita.js';
import type { KelompokPesanan } from './dto/filter-pesanan.dto.js';

const KELOMPOK: Record<KelompokPesanan, StatusTampil[]> = {
  menunggu: ['menunggu'],
  berjalan: ['berjalan', 'telat'],
  selesai: ['selesai'],
  batal: ['ditolak', 'dibatalkan', 'kedaluwarsa'],
};

const namaBulan = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Makassar',
});

@Injectable()
export class MitraService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mitra milik pengguna yang login. Semua query di bawah disaring lewat
   *  id ini, jadi mitra A tidak pernah bisa melihat data mitra B. */
  async milik(penggunaId: string) {
    const mitra = await this.prisma.mitra.findUnique({
      where: { pemilikId: penggunaId },
      include: { pemilik: { select: { nama: true } }, _count: { select: { unit: true } } },
    });
    if (!mitra) throw new ForbiddenException('Akun ini belum terdaftar sebagai mitra.');
    return mitra;
  }

  async saya(penggunaId: string) {
    const m = await this.milik(penggunaId);
    return { id: m.id, nama: m.nama, pemilik: m.pemilik.nama, area: m.area, jumlahUnit: m._count.unit };
  }

  async daftarPesanan(penggunaId: string, kelompok?: KelompokPesanan) {
    const mitra = await this.milik(penggunaId);
    const sekarang = Date.now();
    const baris = await this.prisma.pesanan.findMany({
      where: { unit: { mitraId: mitra.id } },
      include: {
        unit: { select: { id: true, nama: true, plat: true, foto: true } },
        penyewa: { select: { nama: true, telepon: true } },
        klaim: { select: { diselesaikanPada: true } },
      },
      orderBy: { dibuatPada: 'desc' },
    });

    const hasil = baris.map((p) => {
      const status = statusTurunan(p, sekarang);
      return {
        id: p.id,
        kode: p.kode,
        unit: p.unit,
        penyewa: p.penyewa,
        mulai: p.mulai,
        selesai: p.selesai,
        jumlahHari: p.jumlahHari,
        subtotal: p.subtotal,
        biayaLayanan: p.biayaLayanan,
        total: p.total,
        status,
        statusDana: statusDana(p, p.klaim, sekarang),
        dibuatPada: p.dibuatPada,
        /** Hanya untuk status menunggu: setelah ini pesanan batal otomatis. */
        batasBalasPada: status === 'menunggu' ? new Date(p.dibuatPada.getTime() + BATAS_BALAS_MS) : null,
        titik: p.titik,
        diantar: p.diantar,
        diterimaPada: p.diterimaPada,
        kembaliPada: p.kembaliPada,
        dibatalkanPada: p.dibatalkanPada,
        alasanBatal: status === 'kedaluwarsa' ? 'KEDALUWARSA' : p.alasanBatal,
      };
    });
    return kelompok ? hasil.filter((p) => KELOMPOK[kelompok].includes(p.status)) : hasil;
  }

  async daftarUnit(penggunaId: string) {
    const mitra = await this.milik(penggunaId);
    const sekarang = Date.now();
    const units = await this.prisma.unit.findMany({
      where: { mitraId: mitra.id },
      orderBy: [{ nama: 'asc' }, { plat: 'asc' }],
    });
    const [keluar, blokir] = await Promise.all([
      this.prisma.pesanan.findMany({
        where: {
          unit: { mitraId: mitra.id },
          status: 'BERJALAN',
          kembaliPada: null,
          mulai: { lte: new Date(sekarang) },
        },
        include: { penyewa: { select: { nama: true } } },
      }),
      this.prisma.blokirUnit.findMany({
        where: {
          unit: { mitraId: mitra.id },
          mulai: { lte: new Date(sekarang) },
          selesai: { gt: new Date(sekarang) },
        },
      }),
    ]);

    return units.map((u) => {
      const sewa = keluar.find((p) => p.unitId === u.id);
      const blok = blokir.find((b) => b.unitId === u.id);
      const dasar = {
        id: u.id,
        slug: u.slug,
        nama: u.nama,
        plat: u.plat,
        foto: u.foto,
        spesifikasi: u.spesifikasi,
        hargaPerHari: u.hargaPerHari,
      };
      if (sewa) {
        const telat = sewa.selesai.getTime() <= sekarang;
        return {
          ...dasar,
          status: telat ? ('telat' as const) : ('keluar' as const),
          keluar: { kodePesanan: sewa.kode, penyewa: sewa.penyewa.nama, kembaliPada: sewa.selesai },
        };
      }
      if (blok) {
        return {
          ...dasar,
          status: blok.jenis === 'SERVIS' ? ('servis' as const) : ('diblokir' as const),
          sampai: blok.selesai,
        };
      }
      return { ...dasar, status: 'kosong' as const };
    });
  }

  async beranda(penggunaId: string) {
    const mitra = await this.milik(penggunaId);
    const sekarang = Date.now();
    const hariIni = awalHariWita(sekarang);
    const units = await this.prisma.unit.findMany({ where: { mitraId: mitra.id }, select: { id: true } });
    const idUnit = units.map((u) => u.id);

    const [masukHariIni, unitDaftar, isiMinggu, selesai] = await Promise.all([
      this.prisma.pesanan.findMany({
        where: {
          unitId: { in: idUnit },
          dibuatPada: { gte: new Date(hariIni), lt: new Date(hariIni + HARI) },
        },
        select: { status: true },
      }),
      this.daftarUnit(penggunaId),
      okupansi(this.prisma, idUnit, new Date(hariIni), new Date(hariIni + 7 * HARI), sekarang),
      this.prisma.pesanan.findMany({
        where: { unitId: { in: idUnit }, status: 'SELESAI', kembaliPada: { not: null } },
        select: {
          status: true, dibuatPada: true, selesai: true, kembaliPada: true, subtotal: true,
          klaim: { select: { diselesaikanPada: true } },
        },
      }),
    ]);

    // Pendapatan bulan ini: dana yang benar-benar sudah dilepas bulan ini.
    const awalBulan = dariIsoWita(`${keIsoWita(sekarang).slice(0, 7)}-01`)!;
    const dilepas = selesai.filter((p) => {
      const lepas = waktuPelepasan(p, p.klaim);
      return lepas !== null && lepas >= awalBulan && lepas <= sekarang;
    });

    // Type guard, bukan cek status biasa: filter() tidak mempersempit tipe
    // gabungan, jadi tanpa ini TypeScript tidak tahu `keluar` pasti ada.
    const keluar = unitDaftar.filter(
      (u): u is Extract<(typeof unitDaftar)[number], { keluar: unknown }> => 'keluar' in u,
    );

    return {
      sekarang: new Date(sekarang),
      pesananHariIni: {
        masuk: masukHariIni.length,
        dikonfirmasi: masukHariIni.filter((p) => p.status === 'BERJALAN' || p.status === 'SELESAI').length,
      },
      unitKeluar: {
        jumlah: keluar.length,
        totalUnit: units.length,
        daftar: keluar.map((u) => ({
          id: u.id,
          nama: u.nama,
          plat: u.plat,
          foto: u.foto,
          penyewa: u.keluar.penyewa,
          kodePesanan: u.keluar.kodePesanan,
          kembaliPada: u.keluar.kembaliPada,
          telat: u.status === 'telat',
        })),
      },
      pendapatan: {
        bulan: namaBulan.format(sekarang),
        bersihDilepas: dilepas.reduce((n, p) => n + bersihPenyedia(p.subtotal), 0),
        jumlahPesanan: dilepas.length,
      },
      // "Unit keluar per hari" untuk 7 hari mulai hari ini.
      mingguIni: Array.from({ length: 7 }, (_, i) => {
        const hari = hariIni + i * HARI;
        const unitKeluar = new Set(
          isiMinggu
            .filter((o) => (o.jenis === 'berjalan' || o.jenis === 'telat') && o.mulai < hari + HARI && o.selesai > hari)
            .map((o) => o.unitId),
        );
        return { tanggal: keIsoWita(hari), jumlah: unitKeluar.size };
      }),
    };
  }
}
