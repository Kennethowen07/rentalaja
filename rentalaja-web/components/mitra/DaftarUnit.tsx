"use client";

// Daftar unit dengan chip filter (layar #4b).
//
// Status "sedang keluar" tidak disimpan di data unit, melainkan diturunkan
// dari pesanan berjalan lewat kecocokan plat. Efeknya: begitu satu pesanan
// diterima di layar Pesanan, unitnya ikut berpindah dari chip Kosong ke chip
// Keluar tanpa data kedua yang harus dijaga.
//
// Edit mengubah harga dan menandai servis. Perubahan hidup di state client,
// jadi hilang saat refresh, sesuai status prototype tanpa backend.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { filterUnit, type KunciFilter } from "@/lib/mitra/filter-unit";
import { rupiah } from "@/lib/mitra/format";
import type { Pesanan, Unit } from "@/lib/mitra/tipe";
import { pukulWita, statusKembali, tanggalLengkap, tanggalSingkat } from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { ThumbnailUnit, TitikStatus, kelasTombolBaris } from "./ui";

type StatusTampil = {
  kunci: Exclude<KunciFilter, "semua">;
  label: string;
  telat: boolean;
  netral: boolean;
  /** Jadwal kembali, hanya untuk unit yang sedang keluar. */
  kembali?: number;
};

function statusUnit(u: Unit, berjalan: Pesanan[], sekarang: number): StatusTampil {
  const sewa = berjalan.find((p) => p.plat === u.plat);
  if (sewa) {
    const kembali = sewa.kembaliPada ?? sewa.selesai;
    const s = statusKembali(kembali, sekarang);
    return {
      kunci: "keluar",
      label: s.telat ? "Lewat jadwal" : "Sedang keluar",
      telat: s.telat,
      netral: false,
      kembali,
    };
  }
  if (u.status === "service") {
    return {
      kunci: "servis",
      label: u.servisSampai ? `Servis sampai ${tanggalSingkat(u.servisSampai)}` : "Servis",
      telat: false,
      netral: true,
    };
  }
  return { kunci: "kosong", label: "Kosong", telat: false, netral: true };
}

export default function DaftarUnit({
  unit,
  filterAwal,
}: {
  unit: Unit[];
  filterAwal: KunciFilter;
}) {
  const { pesanan, sekarang } = usePesanan();
  const [daftar, setDaftar] = useState(unit);
  const [aktif, setAktif] = useState<KunciFilter>(filterAwal);
  const [edit, setEdit] = useState<Unit | null>(null);
  const [kabar, setKabar] = useState("");

  const berjalan = pesanan.filter((p) => p.status === "active");
  const berstatus = daftar.map((u) => ({ unit: u, status: statusUnit(u, berjalan, sekarang) }));
  const terlihat = berstatus.filter((b) => aktif === "semua" || b.status.kunci === aktif);

  function simpan(ubahan: Unit) {
    setDaftar((d) => d.map((u) => (u.id === ubahan.id ? ubahan : u)));
    setKabar(`Unit ${ubahan.nama} ${ubahan.plat} diperbarui.`);
    setEdit(null);
  }

  return (
    <>
      <div role="group" aria-label="Saring unit" className="mt-30 flex flex-wrap gap-10">
        {filterUnit.map((f) => {
          const jumlah =
            f.kunci === "semua"
              ? berstatus.length
              : berstatus.filter((b) => b.status.kunci === f.kunci).length;
          const dipilih = f.kunci === aktif;
          return (
            <button
              key={f.kunci}
              type="button"
              aria-pressed={dipilih}
              onClick={() => setAktif(f.kunci)}
              className={`rounded-pill px-16 py-8 whitespace-nowrap transition-colors duration-160 ease-base ${
                dipilih
                  ? "border border-mitra-primer bg-mitra-primer text-m-status text-white"
                  : "border border-mitra-border bg-white text-m-status text-mitra-muted hover:border-mitra-border-hover"
              }`}
            >
              {f.label} · {jumlah}
            </button>
          );
        })}
      </div>

      <div className="mt-22 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
        {terlihat.length === 0 ? (
          <p className="text-m-body text-mitra-faint">Tidak ada unit di saringan ini.</p>
        ) : (
          <ul>
            {terlihat.map(({ unit: u, status }) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-16 border-t border-mitra-hairline py-22 first:border-t-0 min-[900px]:flex-nowrap min-[900px]:gap-22 min-[900px]:py-26"
              >
                <ThumbnailUnit foto={u.foto} nama={u.nama} />
                <div className="min-w-0 flex-1 basis-220">
                  <p className="text-m-judul-baris text-mitra-ink">{u.nama}</p>
                  <p className="mt-5 text-m-meta text-mitra-muted">
                    {u.plat} · {u.spesifikasi}
                  </p>
                </div>

                <div className="shrink-0 min-[900px]:w-190">
                  <p className="text-m-total text-mitra-ink">{rupiah(u.hargaPerHari)}</p>
                  <p className="mt-4 text-m-label text-mitra-faint">per hari</p>
                </div>

                <div className="shrink-0 min-[900px]:w-190">
                  <TitikStatus label={status.label} telat={status.telat} netral={status.netral} />
                  {/* Menjorok 16px (titik 7px + jarak 9px) supaya sejajar dengan
                      teks label di atasnya, bukan dengan titiknya. */}
                  {status.kembali !== undefined && (
                    <p className="mt-4 pl-16 text-m-label text-mitra-faint">
                      {status.telat ? "Jatuh tempo" : "Kembali"} {tanggalLengkap(status.kembali)}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setEdit(u)}
                    className={kelasTombolBaris.sekunder}
                  >
                    Edit
                    <span className="sr-only">
                      {" "}
                      {u.nama} {u.plat}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-24 text-m-body text-mitra-muted">
        Menampilkan {terlihat.length} dari {daftar.length} unit.
      </p>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {edit && (
        <FormEdit
          unit={edit}
          sedangKeluar={berjalan.some((p) => p.plat === edit.plat)}
          sekarang={sekarang}
          onSimpan={simpan}
          onTutup={() => setEdit(null)}
        />
      )}
    </>
  );
}

function FormEdit({
  unit,
  sedangKeluar,
  sekarang,
  onSimpan,
  onTutup,
}: {
  unit: Unit;
  sedangKeluar: boolean;
  sekarang: number;
  onSimpan: (u: Unit) => void;
  onTutup: () => void;
}) {
  const [harga, setHarga] = useState(String(unit.hargaPerHari));
  const [servis, setServis] = useState(unit.status === "service");

  const angka = Number(harga.replace(/\D/g, ""));
  const hargaValid = angka >= 10_000;

  return (
    <Modal judul="Edit unit" onTutup={onTutup} lebar="max-w-[440px]">
      <p className="mt-10 text-m-judul-baris text-mitra-ink">{unit.nama}</p>
      <p className="mt-4 text-m-meta text-mitra-muted">
        {unit.plat} · {unit.spesifikasi}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!hargaValid) return;
          onSimpan({
            ...unit,
            hargaPerHari: angka,
            status: servis ? "service" : "available",
            servisSampai: servis ? (unit.servisSampai ?? pukulWita(sekarang, 2, 17)) : undefined,
          });
        }}
      >
        <label htmlFor="harga-unit" className="mt-18 block text-m-label text-mitra-muted">
          Harga per hari
        </label>
        <div className="mt-6 flex items-center gap-8">
          <span className="text-m-total text-mitra-ink">Rp</span>
          <input
            id="harga-unit"
            inputMode="numeric"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            aria-describedby="bantuan-harga"
            className="w-full rounded-m-thumb border border-mitra-border px-12 py-9 text-m-total text-mitra-ink"
          />
        </div>
        <p id="bantuan-harga" className="mt-6 text-m-label text-mitra-muted">
          {hargaValid ? `Terbaca ${rupiah(angka)} per hari.` : "Isi angka saja, minimal 10.000."}
        </p>

        <label className="mt-18 flex items-start gap-10">
          <input
            type="checkbox"
            checked={servis}
            disabled={sedangKeluar}
            onChange={(e) => setServis(e.target.checked)}
            className="mt-3 size-16"
          />
          <span>
            <span className="block text-m-status text-mitra-ink">Sedang servis</span>
            <span className="mt-2 block text-m-label text-mitra-muted">
              {sedangKeluar
                ? "Tidak bisa diubah selagi unit masih disewa."
                : "Unit servis hilang dari hasil pencarian penyewa."}
            </span>
          </span>
        </label>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            Batal
          </button>
          <button type="submit" disabled={!hargaValid} className={kelasTombolBaris.primer}>
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
