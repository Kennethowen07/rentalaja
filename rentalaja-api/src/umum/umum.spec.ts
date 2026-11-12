import { biayaLayanan, rincianHarga } from './harga.js';
import {
  bersihPenyedia,
  dendaBerjalan,
  hariTelat,
  statusDana,
  statusTurunan,
  waktuPelepasan,
} from './status-pesanan.js';
import { awalHariWita, bacaJam, dariIsoWita, HARI, JAM, keIsoWita, MENIT, pukulWita } from './waktu-wita.js';

// 28 Okt 2026 pukul 23.30 WITA = 15.30 UTC. Dipilih karena di UTC tanggalnya
// masih 28, tapi satu jam lagi sudah 29 di WITA: tempat bug zona waktu muncul.
const MALAM_WITA = Date.UTC(2026, 9, 28, 15, 30);

describe('waktu WITA', () => {
  it('awal hari dihitung dari tengah malam WITA, bukan UTC', () => {
    expect(awalHariWita(MALAM_WITA)).toBe(Date.UTC(2026, 9, 27, 16)); // 28 Okt 00.00 WITA
    // 30 menit kemudian sudah 29 Okt di WITA, padahal masih 28 di UTC.
    expect(keIsoWita(MALAM_WITA + 30 * MENIT)).toBe('2026-10-29');
  });

  it('pukulWita menggeser hari dan jam', () => {
    expect(pukulWita(MALAM_WITA, 1, 9)).toBe(Date.UTC(2026, 9, 29, 1)); // 29 Okt 09.00 WITA
  });

  it('dariIsoWita dan keIsoWita saling membalik', () => {
    const t = dariIsoWita('2026-10-28')!;
    expect(keIsoWita(t)).toBe('2026-10-28');
    expect(keIsoWita(t + HARI - 1)).toBe('2026-10-28');
  });

  it.each(['2026-02-31', '2026-13-01', '28-10-2026', '2026-10-28T00:00', ''])(
    'menolak tanggal yang tidak ada atau salah format: %s',
    (iso) => expect(dariIsoWita(iso)).toBeNull(),
  );

  it('membaca jam dengan titik atau titik dua', () => {
    expect(bacaJam('09.00')).toEqual([9, 0]);
    expect(bacaJam('17:30')).toEqual([17, 30]);
    expect(bacaJam('24.00')).toBeNull();
    expect(bacaJam('9.00')).toBeNull();
  });
});

describe('status yang diturunkan', () => {
  const sekarang = Date.UTC(2026, 9, 28, 4);
  const dasar = {
    status: 'MENUNGGU' as const,
    dibuatPada: new Date(sekarang - 30 * MENIT),
    selesai: new Date(sekarang + 2 * HARI),
    kembaliPada: null,
  };

  it('menunggu menjadi kedaluwarsa tepat setelah 1 jam', () => {
    expect(statusTurunan(dasar, sekarang)).toBe('menunggu');
    const lama = { ...dasar, dibuatPada: new Date(sekarang - JAM) };
    expect(statusTurunan(lama, sekarang)).toBe('kedaluwarsa');
  });

  it('berjalan menjadi telat setelah jadwal kembali lewat', () => {
    const berjalan = { ...dasar, status: 'BERJALAN' as const };
    expect(statusTurunan(berjalan, sekarang)).toBe('berjalan');
    expect(statusTurunan({ ...berjalan, selesai: new Date(sekarang - MENIT) }, sekarang)).toBe('telat');
  });

  it('dana dikembalikan untuk pesanan yang ditolak, batal, atau kedaluwarsa', () => {
    expect(statusDana({ ...dasar, status: 'DITOLAK' }, null, sekarang)).toBe('dikembalikan');
    expect(statusDana({ ...dasar, dibuatPada: new Date(sekarang - 2 * JAM) }, null, sekarang)).toBe(
      'dikembalikan',
    );
  });

  it('dana dilepas 24 jam setelah unit kembali', () => {
    const kembali = new Date(sekarang - 23 * JAM);
    const selesai = { ...dasar, status: 'SELESAI' as const, kembaliPada: kembali };
    expect(statusDana(selesai, null, sekarang)).toBe('ditahan');
    expect(statusDana(selesai, null, sekarang + JAM)).toBe('dilepas');
  });

  it('klaim yang belum selesai menahan dana selama apa pun', () => {
    const selesai = { ...dasar, status: 'SELESAI' as const, kembaliPada: new Date(sekarang - 30 * HARI) };
    expect(statusDana(selesai, { diselesaikanPada: null }, sekarang)).toBe('ditahan_klaim');
    expect(waktuPelepasan(selesai, { diselesaikanPada: null })).toBeNull();
  });

  it('klaim yang selesai melepas dana, paling cepat 24 jam setelah kembali', () => {
    const kembali = new Date(sekarang - 2 * JAM);
    const selesai = { ...dasar, status: 'SELESAI' as const, kembaliPada: kembali };
    const klaim = { diselesaikanPada: new Date(sekarang - JAM) };
    expect(waktuPelepasan(selesai, klaim)).toBe(kembali.getTime() + HARI);
  });

  it('penyedia menerima nilai sewa dipotong 5%', () => {
    expect(bersihPenyedia(140_000)).toBe(133_000);
  });
});

describe('denda keterlambatan (dicatat saja)', () => {
  const sekarang = Date.UTC(2026, 9, 28, 4);
  const jadwal = new Date(sekarang - 2 * HARI);
  const keluar = { status: 'BERJALAN' as const, selesai: jadwal, kembaliPada: null, hargaPerHari: 70_000 };

  it('0 selama belum sampai jadwal kembali', () => {
    const tepat = { ...keluar, selesai: new Date(sekarang + MENIT) };
    expect(dendaBerjalan(tepat, sekarang)).toBe(0);
    expect(dendaBerjalan({ ...keluar, selesai: new Date(sekarang + 1) }, sekarang)).toBe(0);
  });

  it('sejalan dengan statusTurunan: status "telat" selalu punya denda, termasuk tepat di jam jadwal', () => {
    // statusTurunan menganggap unit yang belum kembali di jam jadwal sudah
    // telat (selesai <= sekarang). Denda harus memakai batas yang sama,
    // supaya tidak pernah ada status telat dengan denda 0.
    const pesanan = { ...keluar, dibuatPada: new Date(sekarang - 10 * HARI) };
    for (const geser of [-HARI, -1, 0, 1, MENIT, HARI, HARI + 1]) {
      const p = { ...pesanan, selesai: new Date(sekarang - geser) };
      const telat = statusTurunan(p, sekarang) === 'telat';
      expect({ geser, telat: hariTelat(p, sekarang) > 0 }).toEqual({ geser, telat });
    }
    expect(hariTelat({ ...keluar, selesai: new Date(sekarang) }, sekarang)).toBe(1);
    // Unit yang kembali tepat di jam jadwal tidak telat.
    const kembaliTepat = { ...keluar, status: 'SELESAI' as const, kembaliPada: jadwal };
    expect(dendaBerjalan(kembaliTepat, sekarang)).toBe(0);
  });

  it('telat satu menit sudah dihitung satu hari', () => {
    const baru = { ...keluar, selesai: new Date(sekarang - MENIT) };
    expect(hariTelat(baru, sekarang)).toBe(1);
    expect(dendaBerjalan(baru, sekarang)).toBe(70_000);
  });

  it('hargaPerHari x hari telat, dibulatkan ke atas, terus berjalan sampai unit kembali', () => {
    expect(dendaBerjalan(keluar, sekarang)).toBe(140_000); // tepat 2 hari
    expect(dendaBerjalan(keluar, sekarang + JAM)).toBe(210_000); // 2 hari 1 jam -> 3
  });

  it('unit yang sudah kembali telat dihitung sampai kembaliPada, tidak bertambah lagi', () => {
    const kembali = { ...keluar, status: 'SELESAI' as const, kembaliPada: new Date(jadwal.getTime() + 5 * JAM) };
    expect(dendaBerjalan(kembali, sekarang)).toBe(70_000);
    expect(dendaBerjalan(kembali, sekarang + 30 * HARI)).toBe(70_000);
    const tepatWaktu = { ...kembali, kembaliPada: new Date(jadwal.getTime() - JAM) };
    expect(dendaBerjalan(tepatWaktu, sekarang)).toBe(0);
  });

  it('0 untuk pesanan yang tidak pernah keluar', () => {
    for (const status of ['MENUNGGU', 'DITOLAK', 'DIBATALKAN'] as const) {
      expect(dendaBerjalan({ ...keluar, status }, sekarang)).toBe(0);
    }
  });

  it('tidak mengubah dana: status dana dan bersih penyedia tetap sama', () => {
    const kembali = {
      ...keluar, status: 'SELESAI' as const, dibuatPada: new Date(sekarang - 10 * HARI),
      kembaliPada: new Date(jadwal.getTime() + 5 * JAM),
    };
    expect(dendaBerjalan(kembali, sekarang)).toBeGreaterThan(0);
    expect(statusDana(kembali, null, sekarang)).toBe('dilepas');
    expect(bersihPenyedia(140_000)).toBe(133_000);
  });
});

describe('harga', () => {
  it('biaya layanan penyewa 3% dari harga sewa, total = sewa + biaya', () => {
    expect(rincianHarga(70_000, 2)).toEqual({
      perHari: 70_000, jumlahHari: 2, subtotal: 140_000, biayaLayanan: 4_200, total: 144_200,
    });
  });

  it('dibulatkan ke rupiah terdekat, setengah ke atas', () => {
    expect(biayaLayanan(1_050)).toBe(32); // 31,5
    expect(biayaLayanan(55_000)).toBe(1_650);
    expect(biayaLayanan(1_016)).toBe(30);
  });
});
