"use client";

// Peta lokasi OpenStreetMap + Leaflet, tanpa API key dan tanpa kartu.
// Menggantikan Google Maps Embed (25 Okt 2026), yang butuh billing account
// (docs/TECH_DEBT.md K1).
//
// Dua mode:
//   - tampil saja (tanpa onPilihAlamat): pin di lokasi alamat.
//   - pilih titik (dengan onPilihAlamat): alamat yang diketik menggeser pin,
//     dan klik peta atau geser pin mengisi alamat lewat reverse geocoding.
//
// Geocoding lewat Nominatim (lib/geocode.ts), ditunda sampai pengguna
// berhenti mengetik karena Nominatim membatasi 1 permintaan per detik.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { alamatDari, cariAlamat, type Koordinat } from "@/lib/geocode";

const PetaLeaflet = dynamic(() => import("@/components/ui/PetaLeaflet"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface" />,
});

/** Canggu, area default design. Dipakai sampai alamat pertama ketemu. */
const PUSAT_AWAL: Koordinat = [-8.6478, 115.1385];
const JEDA_KETIK_MS = 800;

type Status = "siap" | "mencari" | "tidakKetemu" | "gagal";

export default function PetaLokasi({
  alamat,
  onPilihAlamat,
  className = "",
}: {
  alamat: string;
  /** Diisi untuk mode pilih titik: dipanggil dengan alamat hasil klik peta. */
  onPilihAlamat?: (alamat: string) => void;
  /** Ukuran dan margin kotak peta, mis. "mt-8 h-240" atau "aspect-[16/9]". */
  className?: string;
}) {
  const [posisi, setPosisi] = useState<Koordinat>(PUSAT_AWAL);
  const [status, setStatus] = useState<Status>("siap");
  // Alamat terakhir yang diisi dari peta. Alamat itu tidak dicari ulang,
  // supaya pin tidak melompat ke hasil pencarian teksnya sendiri.
  const dariPeta = useRef<string | null>(null);
  const urutanBalik = useRef(0);

  useEffect(() => {
    const q = alamat.trim();
    if (!q || q === dariPeta.current) return;
    const batal = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("mencari");
      try {
        const titik = await cariAlamat(q, batal.signal);
        if (titik) {
          setPosisi(titik);
          setStatus("siap");
        } else {
          setStatus("tidakKetemu");
        }
      } catch {
        if (!batal.signal.aborted) setStatus("gagal");
      }
    }, JEDA_KETIK_MS);
    return () => {
      clearTimeout(timer);
      batal.abort();
    };
  }, [alamat]);

  async function pindah(titik: Koordinat) {
    setPosisi(titik);
    if (!onPilihAlamat) return;
    // Klik beruntun: hanya jawaban untuk klik terakhir yang dipakai.
    const urutan = ++urutanBalik.current;
    setStatus("mencari");
    let label: string | null = null;
    try {
      label = await alamatDari(titik);
    } catch {
      label = null;
    }
    if (urutan !== urutanBalik.current) return;
    const teks = label ?? `${titik[0].toFixed(5)}, ${titik[1].toFixed(5)}`;
    dariPeta.current = teks;
    onPilihAlamat(teks);
    setStatus("siap");
  }

  const keterangan =
    status === "mencari"
      ? "Mencari lokasi…"
      : status === "tidakKetemu"
        ? "Alamat belum ketemu di peta. Tulis nama jalan atau daerahnya, atau klik peta."
        : status === "gagal"
          ? "Peta tidak bisa mencari alamat saat ini. Klik peta untuk memilih titik."
          : onPilihAlamat
            ? "Klik peta atau geser pin untuk memilih titik antar."
            : null;

  return (
    <div>
      {/* isolate: z-index internal Leaflet (400+) tetap di dalam kotak ini,
          tidak menimpa navbar yang menempel saat halaman digulir. */}
      <div className={`relative isolate overflow-hidden rounded-input border border-line bg-surface ${className}`}>
        <PetaLeaflet posisi={posisi} interaktif={Boolean(onPilihAlamat)} onPindah={pindah} />
      </div>
      {keterangan && (
        <p aria-live="polite" className="mt-6 text-body-sm text-muted">
          {keterangan}
        </p>
      )}
    </div>
  );
}
