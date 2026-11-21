// Panel mitra dari rentalaja-api, diterjemahkan ke tipe di lib/mitra/tipe.ts
// supaya komponen panel tidak perlu tahu datanya dari mana. Dipanggil dari
// lib/mitra/data.ts, yang tetap memakai mock kalau API_URL kosong.

import "server-only";
import { cache } from "react";
import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";
import type { Bahasa } from "@/lib/i18n";
import { rupiah, rupiahSingkat } from "@/lib/mitra/format";
import type { DataBeranda, Dompet, Mitra, Periode, Pesanan, StatusPesanan, Unit } from "@/lib/mitra/tipe";
import { namaBulan, pukulWita, tanggalSingkat } from "@/lib/mitra/waktu";

const ms = (iso: string) => new Date(iso).getTime();

/** Sesi mitra satu request: token dari cookie, dicek ke GET /mitra/saya.
 *  null kalau belum masuk, token kedaluwarsa, atau yang masuk akun penyewa.
 *  Di-cache per request supaya layout dan halaman tidak memanggilnya dua kali. */
export const sesiMitra = cache(async (): Promise<{ token: string; mitra: Mitra } | null> => {
  if (!apiAktif()) return null;
  const token = await tokenSesi();
  if (!token) return null;
  try {
    const m = await ambilApi<{ nama: string; pemilik: string; area: string; jumlahUnit: number }>("/mitra/saya", {
      token,
    });
    return { token, mitra: { nama: m.nama, pemilik: m.pemilik, area: m.area, jumlahUnit: m.jumlahUnit } };
  } catch (e) {
    if (e instanceof GalatApi && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
});

// ---------------------------------------------------------------------------
// Pesanan

type StatusApi = "menunggu" | "kedaluwarsa" | "berjalan" | "telat" | "selesai" | "ditolak" | "dibatalkan";

type PesananMitraApi = {
  kode: string;
  unit: { nama: string; plat: string; foto: string | null };
  penyewa: { nama: string; telepon: string };
  mulai: string;
  selesai: string;
  total: number;
  status: StatusApi;
  dibuatPada: string;
  titik: string;
  diantar: boolean;
  kembaliPada: string | null;
  dibatalkanPada: string | null;
  alasanBatal: "KEDALUWARSA" | "DIBATALKAN_PENYEWA" | null;
  denda: number;
};

const STATUS: Record<StatusApi, StatusPesanan> = {
  menunggu: "pending",
  berjalan: "active",
  telat: "active",
  selesai: "completed",
  ditolak: "cancelled",
  dibatalkan: "cancelled",
  kedaluwarsa: "cancelled",
};

function alasanBatal(p: PesananMitraApi, en: boolean): string {
  if (p.status === "ditolak") return en ? "Declined by the provider" : "Ditolak penyedia";
  if (p.alasanBatal === "KEDALUWARSA" || p.status === "kedaluwarsa") {
    return en ? "Cancelled automatically, past the 1-hour limit" : "Batal otomatis, lewat batas 1 jam";
  }
  return en ? "Cancelled by the renter" : "Dibatalkan penyewa";
}

/** Bentuk Pesanan di panel. `id` diisi kode pesanan (RA-xxxxxx): dipakai
 *  sebagai kunci, tujuan chat, dan parameter terima/tolak ke API. */
function kePesanan(p: PesananMitraApi, bahasa: Bahasa): Pesanan {
  const en = bahasa === "en";
  const status = STATUS[p.status];
  return {
    id: p.kode,
    unit: p.unit.nama,
    plat: p.unit.plat,
    foto: p.unit.foto,
    penyewa: p.penyewa.nama,
    telepon: p.penyewa.telepon,
    mulai: ms(p.mulai),
    selesai: ms(p.selesai),
    total: rupiah(p.total),
    status,
    titik: p.titik,
    diantar: p.diantar,
    ...(status === "pending" ? { masukPada: ms(p.dibuatPada) } : {}),
    ...(status === "active" ? { kembaliPada: ms(p.selesai) } : {}),
    ...(p.denda > 0
      ? { denda: en ? `late fee so far ${rupiah(p.denda)}` : `denda berjalan ${rupiah(p.denda)}` }
      : {}),
    ...(status === "completed" && p.kembaliPada ? { selesaiPada: ms(p.kembaliPada) } : {}),
    ...(status === "cancelled" ? { alasan: alasanBatal(p, en) } : {}),
  };
}

export async function pesananMitra(token: string, bahasa: Bahasa): Promise<Pesanan[]> {
  const daftar = await ambilApi<PesananMitraApi[]>("/mitra/pesanan", { token });
  return daftar.map((p) => kePesanan(p, bahasa));
}

// ---------------------------------------------------------------------------
// Unit

type UnitMitraApi = {
  id: string;
  nama: string;
  plat: string;
  foto: string | null;
  hargaPerHari: number;
  status: "kosong" | "keluar" | "telat" | "servis" | "diblokir";
  sampai?: string;
};

/** Status "keluar" sengaja tidak dipakai: komponen menurunkannya dari pesanan
 *  berjalan (lihat tipe Unit). Blokir manual tampil sebagai tersedia di layar
 *  Unit; kalender yang menunjukkan tanggal blokirnya. */
export async function unitMitra(token: string): Promise<Unit[]> {
  const daftar = await ambilApi<UnitMitraApi[]>("/mitra/unit", { token });
  return daftar.map((u) => ({
    id: u.id,
    nama: u.nama,
    plat: u.plat,
    foto: u.foto,
    hargaPerHari: u.hargaPerHari,
    status: u.status === "servis" ? "service" : "available",
    ...(u.status === "servis" && u.sampai ? { servisSampai: ms(u.sampai) } : {}),
  }));
}

// ---------------------------------------------------------------------------
// Beranda

type BerandaApi = {
  sekarang: string;
  pesananHariIni: { masuk: number };
  unitKeluar: {
    jumlah: number;
    totalUnit: number;
    daftar: { id: string; nama: string; plat: string; foto: string | null; penyewa: string; kembaliPada: string }[];
  };
  pendapatan: { bersihDilepas: number };
  mingguIni: { tanggal: string; jumlah: number }[];
};

export async function berandaMitra(token: string, bahasa: Bahasa): Promise<DataBeranda> {
  const b = await ambilApi<BerandaApi>("/mitra/beranda", { token });
  const sekarang = ms(b.sekarang);
  return {
    sekarang,
    pesananHariIni: { masuk: b.pesananHariIni.masuk },
    unitKeluar: {
      jumlah: b.unitKeluar.jumlah,
      totalUnit: b.unitKeluar.totalUnit,
      daftar: b.unitKeluar.daftar.map((u) => ({
        id: u.id,
        nama: u.nama,
        plat: u.plat,
        foto: u.foto,
        penyewa: u.penyewa,
        kembaliPada: ms(u.kembaliPada),
      })),
    },
    pendapatan: { nilai: rupiahSingkat(b.pendapatan.bersihDilepas, bahasa), bulan: namaBulan(sekarang, 0, bahasa) },
    // API mengirim tanggal WITA ("2026-11-21") untuk 7 hari mulai hari ini;
    // grafik memakai epoch siang hari itu, sama dengan mock.
    mingguIni: b.mingguIni.map((h, i) => ({ tanggal: pukulWita(sekarang, i, 12), jumlah: h.jumlah })),
  };
}

// ---------------------------------------------------------------------------
// Pendapatan dan saldo

type PeriodeApi = "bulan-ini" | "bulan-lalu" | "tiga-bulan";

type PendapatanApi = {
  rentang: { dari: string; sampai: string };
  kotor: number;
  biaya: number;
  bersih: number;
  ditahan: number;
  sumber: { kategori: "MOTOR" | "MOBIL"; nilai: number }[];
  transaksi: { id: string; judul: string; tanggal: string; nilai: number; arah: "masuk" | "keluar" }[];
};

/** Kunci periode di panel. "90-hari" dipertahankan dari mock (dipakai nama
 *  berkas CSV); API menyebutnya tiga-bulan. */
const PERIODE: { api: PeriodeApi; kunci: string }[] = [
  { api: "bulan-ini", kunci: "bulan-ini" },
  { api: "bulan-lalu", kunci: "bulan-lalu" },
  { api: "tiga-bulan", kunci: "90-hari" },
];

/** Judul transaksi dari API selalu berbahasa Indonesia. */
function judulTransaksi(judul: string, en: boolean): string {
  if (!en) return judul;
  return judul
    .replace(/^Dana masuk/, "Funds in")
    .replace(/^Biaya layanan$/, "Service fee")
    .replace(/^Pencairan ke rekening$/, "Payout to bank account");
}

/** "2026-11-21" (tanggal WITA dari API) jadi epoch siang WITA hari itu, supaya
 *  formatter WITA tidak bergeser ke hari sebelah. */
const dariTanggal = (iso: string) => new Date(`${iso}T12:00:00+08:00`).getTime();

function rentangPeriode(kunci: PeriodeApi, dari: number, sampai: number, bahasa: Bahasa): string {
  const f = (t: number, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(bahasa === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Makassar", ...o }).format(t);
  if (kunci === "bulan-lalu") return f(dari, { month: "long", year: "numeric" });
  if (kunci === "bulan-ini") return `1 – ${f(sampai, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${f(dari, { day: "numeric", month: "short" })} – ${f(sampai, { day: "numeric", month: "short", year: "numeric" })}`;
}

export async function pendapatanMitra(token: string, bahasa: Bahasa): Promise<Periode[]> {
  const en = bahasa === "en";
  const sekarang = Date.now();
  const bulanIni = namaBulan(sekarang, 0, bahasa);
  const bulanLalu = namaBulan(sekarang, -1, bahasa);
  const label: Record<PeriodeApi, string> = {
    "bulan-ini": en ? `${bulanIni} to date` : `${bulanIni} berjalan`,
    "bulan-lalu": en ? `All of ${bulanLalu}` : `${bulanLalu} penuh`,
    "tiga-bulan": en ? "Last 90 days" : "90 hari terakhir",
  };
  const hasil = await Promise.all(
    PERIODE.map((p) => ambilApi<PendapatanApi>(`/mitra/pendapatan?periode=${p.api}`, { token })),
  );
  return hasil.map((r, i) => {
    const { api, kunci } = PERIODE[i];
    return {
      kunci,
      label: label[api],
      rentang: rentangPeriode(api, dariTanggal(r.rentang.dari), dariTanggal(r.rentang.sampai), bahasa),
      kotor: r.kotor,
      biaya: r.biaya,
      bersih: r.bersih,
      ditahan: r.ditahan,
      transaksi: r.transaksi.map((x) => ({
        id: x.id,
        judul: judulTransaksi(x.judul, en),
        meta: tanggalSingkat(dariTanggal(x.tanggal), bahasa),
        nilai: x.nilai,
        arah: x.arah,
      })),
      sumber: r.sumber.map((s) => ({
        label: s.kategori === "MOBIL" ? (en ? "Cars" : "Mobil") : en ? "Scooters" : "Motor",
        nilai: s.nilai,
      })),
    };
  });
}

type RekeningApi = {
  label: string;
  bank: string;
  namaPemilik: string;
  terkunci: boolean;
  bisaTarikPada: string;
} | null;

export async function dompetMitra(token: string): Promise<Dompet> {
  const [s, r] = await Promise.all([
    ambilApi<{ saldo: number; ditahan: number }>("/mitra/saldo", { token }),
    ambilApi<{ rekening: RekeningApi }>("/mitra/rekening", { token }),
  ]);
  return {
    saldo: s.saldo,
    ditahan: s.ditahan,
    rekening: r.rekening
      ? {
          label: r.rekening.label,
          bank: r.rekening.bank,
          namaPemilik: r.rekening.namaPemilik,
          terkunci: r.rekening.terkunci,
          bisaTarikPada: ms(r.rekening.bisaTarikPada),
        }
      : null,
  };
}
