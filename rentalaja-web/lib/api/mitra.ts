// Panel mitra dari rentalaja-api, diterjemahkan ke tipe di lib/mitra/tipe.ts
// supaya komponen panel tidak perlu tahu datanya dari mana. Dipanggil dari
// lib/mitra/data.ts, yang tetap memakai mock kalau API_URL kosong.

import "server-only";
import { cache } from "react";
import { ambilApi, apiAktif, GalatApi } from "@/lib/api/klien";
import { tokenSesi } from "@/lib/api/sesi";
import type { Bahasa } from "@/lib/i18n";
import { rupiah, rupiahSingkat } from "@/lib/mitra/format";
import type { DataBeranda, Mitra, Pesanan, StatusPesanan, Unit } from "@/lib/mitra/tipe";
import { namaBulan, pukulWita } from "@/lib/mitra/waktu";

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
