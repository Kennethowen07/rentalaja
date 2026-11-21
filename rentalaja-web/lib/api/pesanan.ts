// Pesanan penyewa dari rentalaja-api (GET /pesanan, GET /pesanan/:kode),
// diterjemahkan ke bentuk yang dipakai layar Pesanan aktif (OrderActive).
// Tanpa API_URL, layar itu tetap memakai lib/mock/pesanan-aktif.ts.

import "server-only";
import { ambilApi, GalatApi } from "@/lib/api/klien";
import { kamus, type Bahasa } from "@/lib/i18n";
import type { BarisBayar, TahapPesanan } from "@/lib/mock/pesanan-aktif";
import { formatRupiah } from "@/lib/mock/units";
import { jamSaja, tanggalJam, tanggalLengkap, tanggalPanjang, tanggalSingkat } from "@/lib/mitra/waktu";

type StatusApi = "menunggu" | "kedaluwarsa" | "berjalan" | "telat" | "selesai" | "ditolak" | "dibatalkan";
type DanaApi = "ditahan" | "ditahan_klaim" | "dilepas" | "dikembalikan";

/** Bentuk GET /pesanan/:kode untuk penyewa (bentuk() di pesanan.service.ts). */
export type PesananApi = {
  kode: string;
  status: StatusApi;
  statusDana: DanaApi;
  batasBalasPada: string | null;
  unit: { slug: string; nama: string; foto: string | null; plat: string | null };
  penyedia: { nama: string };
  mulai: string;
  selesai: string;
  harga: { total: number };
  diantar: boolean;
  titik: string;
  pembayaran: { jumlah: number; metode: "BCA_VA" | "QRIS" | "EWALLET"; dibayarPada: string } | null;
  dibuatPada: string;
  diterimaPada: string | null;
  kembaliPada: string | null;
  denda: number;
};

/** Yang dibutuhkan OrderActive. Serah terima berfoto boleh kosong: penyewa
 *  belum punya endpoint foto serah terima, jadi bagian itu disembunyikan
 *  alih-alih menampilkan foto contoh untuk pesanan sungguhan. */
export type DataPesananAktif = {
  kode: string;
  status: string;
  statusDetail: string;
  unit: { nama: string; plat: string; periode: { mulai: string; selesai: string }; foto: string };
  tahap: TahapPesanan[];
  serahTerima: { judul: string; sisi: { label: string; foto: string }[]; catatan: string } | null;
  pembayaran: BarisBayar[];
  penyedia: { nama: string; meta: string };
  titikPengembalian: { alamat: string; waktu: string };
  perluUbah: { aksi: { label: string; bahaya: boolean }[]; catatan: string };
};

const TEKS = kamus({
  id: {
    status: {
      menunggu: "Menunggu konfirmasi penyedia",
      kedaluwarsa: "Batal otomatis",
      berjalan: "Sedang disewa",
      telat: "Lewat jadwal kembali",
      selesai: "Selesai",
      ditolak: "Ditolak penyedia",
      dibatalkan: "Dibatalkan",
    } as Record<StatusApi, string>,
    balasSebelum: (jam: string) => `Penyedia membalas paling lambat pukul ${jam}. Kalau tidak, dana kembali penuh.`,
    kembalikan: (t: string, jam: string) => `Kembalikan ${t} pukul ${jam}`,
    telat: (t: string, jam: string) => `Seharusnya kembali ${t} pukul ${jam}`,
    selesaiPada: (t: string) => `Unit kembali ${t}`,
    danaKembali: "Dana dikembalikan penuh ke metode pembayaranmu.",
    plat: (p: string) => `Plat ${p}`,
    platNanti: "Plat tampil setelah penyedia menerima",
    tahap: { dipesan: "Dipesan", dikonfirmasi: "Dikonfirmasi", kembali: "Pengembalian" },
    menungguBalasan: "Menunggu",
    dibayar: (t: string, m: string) => `Dibayar penuh ${t} · ${m}`,
    deposit: "Deposit tunai ke pemilik",
    tidakAda: "Tidak ada",
    dana: {
      ditahan: "Ditahan rentalaja sampai unit kembali",
      ditahan_klaim: "Ditahan rentalaja, ada klaim kerusakan",
      dilepas: "Diteruskan ke penyedia",
      dikembalikan: "Dikembalikan ke kamu",
    } as Record<DanaApi, string>,
    denda: "Denda keterlambatan (dicatat, belum ditagih)",
    titikSama: (w: string) => `${w} · sama dengan titik antar`,
    ambilDiRental: (w: string) => `${w} · kembalikan ke rental`,
    aksi: [
      { label: "Perpanjang sewa", bahaya: false },
      { label: "Ajukan reschedule", bahaya: false },
      { label: "Laporkan masalah unit", bahaya: true },
    ],
    catatanUbah:
      "Perpanjangan tergantung kalender unit. Kalau sudah dipesan orang lain, sistem menawarkan unit lain di rental yang sama.",
  },
  en: {
    status: {
      menunggu: "Waiting for the provider",
      kedaluwarsa: "Cancelled automatically",
      berjalan: "Currently rented",
      telat: "Past return time",
      selesai: "Completed",
      ditolak: "Declined by the provider",
      dibatalkan: "Cancelled",
    },
    balasSebelum: (jam: string) => `The provider replies by ${jam} at the latest. Otherwise you get a full refund.`,
    kembalikan: (t: string, jam: string) => `Return by ${t} at ${jam}`,
    telat: (t: string, jam: string) => `Was due back ${t} at ${jam}`,
    selesaiPada: (t: string) => `Returned ${t}`,
    danaKembali: "Your payment is refunded in full.",
    plat: (p: string) => `Plate ${p}`,
    platNanti: "Plate shown once the provider accepts",
    tahap: { dipesan: "Booked", dikonfirmasi: "Confirmed", kembali: "Return" },
    menungguBalasan: "Waiting",
    dibayar: (t: string, m: string) => `Paid in full ${t} · ${m}`,
    deposit: "Cash deposit to the owner",
    tidakAda: "None",
    dana: {
      ditahan: "Held by rentalaja until the vehicle is returned",
      ditahan_klaim: "Held by rentalaja, damage claim open",
      dilepas: "Passed on to the provider",
      dikembalikan: "Refunded to you",
    },
    denda: "Late fee (recorded, not charged yet)",
    titikSama: (w: string) => `${w} · same as the delivery point`,
    ambilDiRental: (w: string) => `${w} · return to the rental`,
    aksi: [
      { label: "Extend rental", bahaya: false },
      { label: "Request a reschedule", bahaya: false },
      { label: "Report a problem with the vehicle", bahaya: true },
    ],
    catatanUbah:
      "Extensions depend on the vehicle's calendar. If someone else has already booked it, we'll offer another vehicle from the same rental.",
  },
});

const METODE: Record<NonNullable<PesananApi["pembayaran"]>["metode"], string> = {
  BCA_VA: "BCA VA",
  QRIS: "QRIS",
  EWALLET: "E-wallet",
};

const ms = (iso: string) => new Date(iso).getTime();

/** Satu pesanan API menjadi data layar Pesanan aktif. */
export function keDataPesanan(p: PesananApi, bahasa: Bahasa): DataPesananAktif {
  const t = TEKS[bahasa];
  const mulai = ms(p.mulai);
  const selesai = ms(p.selesai);

  let statusDetail: string;
  switch (p.status) {
    case "menunggu":
      statusDetail = t.balasSebelum(jamSaja(ms(p.batasBalasPada ?? p.dibuatPada), bahasa));
      break;
    case "berjalan":
      statusDetail = t.kembalikan(tanggalPanjang(selesai, bahasa), jamSaja(selesai, bahasa));
      break;
    case "telat":
      statusDetail = t.telat(tanggalPanjang(selesai, bahasa), jamSaja(selesai, bahasa));
      break;
    case "selesai":
      statusDetail = t.selesaiPada(
        p.kembaliPada ? tanggalJam(ms(p.kembaliPada), bahasa) : tanggalLengkap(selesai, bahasa),
      );
      break;
    default:
      statusDetail = t.danaKembali;
  }

  const pembayaran: BarisBayar[] = [];
  if (p.pembayaran) {
    pembayaran.push({
      label: t.dibayar(tanggalSingkat(ms(p.pembayaran.dibayarPada), bahasa), METODE[p.pembayaran.metode]),
      nilai: formatRupiah(p.pembayaran.jumlah),
    });
  }
  pembayaran.push({ label: t.deposit, nilai: t.tidakAda });
  pembayaran.push({
    label: t.dana[p.statusDana],
    nilai: formatRupiah(p.harga.total),
    ditahan: p.statusDana === "ditahan" || p.statusDana === "ditahan_klaim",
  });
  if (p.denda > 0) pembayaran.push({ label: t.denda, nilai: formatRupiah(p.denda), ditahan: true });

  const waktuKembali = `${tanggalPanjang(selesai, bahasa)} · ${jamSaja(selesai, bahasa)}`;

  return {
    kode: `#${p.kode}`,
    status: t.status[p.status],
    statusDetail,
    unit: {
      nama: p.unit.nama,
      plat: p.unit.plat ? t.plat(p.unit.plat) : t.platNanti,
      periode: { mulai: tanggalJam(mulai, bahasa), selesai: tanggalJam(selesai, bahasa) },
      foto: p.unit.foto ?? "/units/honda-scoopy-2023.webp",
    },
    tahap: [
      { label: t.tahap.dipesan, waktu: tanggalJam(ms(p.dibuatPada), bahasa), selesai: true },
      {
        label: t.tahap.dikonfirmasi,
        waktu: p.diterimaPada ? tanggalJam(ms(p.diterimaPada), bahasa) : t.menungguBalasan,
        selesai: p.diterimaPada !== null,
      },
      {
        label: t.tahap.kembali,
        waktu: tanggalJam(p.kembaliPada ? ms(p.kembaliPada) : selesai, bahasa),
        selesai: p.kembaliPada !== null,
      },
    ],
    serahTerima: null,
    pembayaran,
    penyedia: { nama: p.penyedia.nama, meta: "" },
    titikPengembalian: {
      alamat: p.titik,
      waktu: p.diantar ? t.titikSama(waktuKembali) : t.ambilDiRental(waktuKembali),
    },
    perluUbah: { aksi: t.aksi, catatan: t.catatanUbah },
  };
}

/** Urutan pilihan saat /pesanan dibuka tanpa ?kode=: yang masih berjalan
 *  atau menunggu dulu, baru yang terbaru. */
const PRIORITAS: Record<StatusApi, number> = {
  telat: 0,
  berjalan: 1,
  menunggu: 2,
  selesai: 3,
  ditolak: 4,
  dibatalkan: 4,
  kedaluwarsa: 4,
};

export type HasilPesanan =
  | { jenis: "ada"; data: DataPesananAktif }
  | { jenis: "kosong" }
  | { jenis: "tidak-ada" }
  | { jenis: "perlu-masuk" };

/** Pesanan `kode` milik penyewa ini, atau pesanannya yang paling relevan.
 *
 *  401 (token kedaluwarsa) diperlakukan sebagai belum masuk. 403 berarti
 *  yang masuk akun mitra: layar penyewa ini tidak punya pesanan untuknya,
 *  jadi dijawab kosong, bukan halaman galat. */
export async function ambilPesananPenyewa(
  token: string,
  kode: string | null,
  bahasa: Bahasa,
): Promise<HasilPesanan> {
  try {
    if (kode) {
      const p = await ambilApi<PesananApi>(`/pesanan/${encodeURIComponent(kode)}`, { token });
      return { jenis: "ada", data: keDataPesanan(p, bahasa) };
    }
    const semua = await ambilApi<PesananApi[]>("/pesanan", { token });
    if (semua.length === 0) return { jenis: "kosong" };
    // API sudah mengurutkan terbaru dulu; sort stabil menjaga urutan itu.
    const pilih = [...semua].sort((a, b) => PRIORITAS[a.status] - PRIORITAS[b.status])[0];
    return { jenis: "ada", data: keDataPesanan(pilih, bahasa) };
  } catch (e) {
    if (!(e instanceof GalatApi)) throw e;
    if (e.status === 401) return { jenis: "perlu-masuk" };
    if (e.status === 403) return { jenis: "kosong" };
    if (e.status === 404 || e.status === 400) return { jenis: "tidak-ada" };
    throw e;
  }
}
