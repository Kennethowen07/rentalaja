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
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, type Bahasa } from "@/lib/i18n";
import { filterUnit, type KunciFilter } from "@/lib/mitra/filter-unit";
import { rupiah } from "@/lib/mitra/format";
import type { Pesanan, Unit } from "@/lib/mitra/tipe";
import { pukulWita, statusKembali, tanggalLengkap, tanggalSingkat } from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { ThumbnailUnit, TitikStatus, kelasTombolBaris } from "./ui";

const TEKS = kamus({
  id: {
    lewat: "Lewat jadwal",
    keluar: "Sedang keluar",
    servisSampai: (t: string) => `Servis sampai ${t}`,
    servis: "Servis",
    kosong: "Kosong",
    diperbarui: (nama: string, plat: string) => `Unit ${nama} ${plat} diperbarui.`,
    saring: "Saring unit",
    kosongSaringan: "Tidak ada unit di saringan ini.",
    kembali: "Kembali",
    edit: "Edit",
    menampilkan: (a: number, b: number) => `Menampilkan ${a} dari ${b} unit.`,
    editUnit: "Edit unit",
    hargaPerHari: "Harga per hari",
    terbaca: (r: string) => `Terbaca ${r} per hari.`,
    isiAngka: "Isi angka saja, minimal 10.000.",
    sedangServis: "Sedang servis",
    tidakBisa: "Tidak bisa diubah selagi unit masih disewa.",
    hilang: "Unit servis hilang dari hasil pencarian penyewa.",
    batal: "Batal",
    simpan: "Simpan",
  },
  en: {
    lewat: "Overdue",
    keluar: "Out on rent",
    servisSampai: (t: string) => `Servicing until ${t}`,
    servis: "Servicing",
    kosong: "Available",
    diperbarui: (nama: string, plat: string) => `${nama} ${plat} updated.`,
    saring: "Filter vehicles",
    kosongSaringan: "No vehicles match this filter.",
    kembali: "Due back",
    edit: "Edit",
    menampilkan: (a: number, b: number) => `Showing ${a} of ${b} vehicles.`,
    editUnit: "Edit vehicle",
    hargaPerHari: "Price per day",
    terbaca: (r: string) => `Reads as ${r} per day.`,
    isiAngka: "Numbers only, at least 10,000.",
    sedangServis: "In servicing",
    tidakBisa: "Can't be changed while the vehicle is rented out.",
    hilang: "Vehicles in servicing are hidden from renters' search results.",
    batal: "Cancel",
    simpan: "Save",
  },
});
type Teks = (typeof TEKS)["id"];

type StatusTampil = {
  kunci: Exclude<KunciFilter, "semua">;
  label: string;
  telat: boolean;
  netral: boolean;
  /** Jadwal kembali dan total dibayar penyewa, hanya untuk unit yang sedang keluar. */
  kembali?: number;
  total?: string;
};

function statusUnit(u: Unit, berjalan: Pesanan[], sekarang: number, bahasa: Bahasa, t: Teks): StatusTampil {
  const sewa = berjalan.find((p) => p.plat === u.plat);
  if (sewa) {
    const kembali = sewa.kembaliPada ?? sewa.selesai;
    const s = statusKembali(kembali, sekarang, bahasa);
    return {
      kunci: "keluar",
      label: s.telat ? t.lewat : t.keluar,
      telat: s.telat,
      netral: false,
      kembali,
      total: sewa.total,
    };
  }
  if (u.status === "service") {
    return {
      kunci: "servis",
      label: u.servisSampai ? t.servisSampai(tanggalSingkat(u.servisSampai, bahasa)) : t.servis,
      telat: false,
      netral: true,
    };
  }
  return { kunci: "kosong", label: t.kosong, telat: false, netral: true };
}

export default function DaftarUnit({
  unit,
  filterAwal,
}: {
  unit: Unit[];
  filterAwal: KunciFilter;
}) {
  const { pesanan, sekarang } = usePesanan();
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [daftar, setDaftar] = useState(unit);
  const [aktif, setAktif] = useState<KunciFilter>(filterAwal);
  const [edit, setEdit] = useState<Unit | null>(null);
  const [kabar, setKabar] = useState("");

  const berjalan = pesanan.filter((p) => p.status === "active");
  const berstatus = daftar.map((u) => ({ unit: u, status: statusUnit(u, berjalan, sekarang, bahasa, t) }));
  const terlihat = berstatus.filter((b) => aktif === "semua" || b.status.kunci === aktif);

  function simpan(ubahan: Unit) {
    setDaftar((d) => d.map((u) => (u.id === ubahan.id ? ubahan : u)));
    setKabar(t.diperbarui(ubahan.nama, ubahan.plat));
    setEdit(null);
  }

  return (
    <>
      <div role="group" aria-label={t.saring} className="mt-30 flex flex-wrap gap-10">
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
              {f.label[bahasa]} · {jumlah}
            </button>
          );
        })}
      </div>

      <div className="mt-22 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
        {terlihat.length === 0 ? (
          <p className="text-m-body text-mitra-faint">{t.kosongSaringan}</p>
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
                  <p className="mt-5 text-m-meta text-mitra-muted">{u.plat}</p>
                </div>

                {/* Total yang dibayar penyewa untuk sewa yang sedang berjalan. Unit
                    kosong dan servis tidak punya tagihan, tapi kolomnya tetap
                    selebar 190px supaya kolom status sejajar di semua baris. */}
                <div className="shrink-0 min-[900px]:w-190">
                  {status.total && <p className="text-m-total text-mitra-ink">{status.total}</p>}
                </div>

                <div className="shrink-0 min-[900px]:w-190">
                  <TitikStatus label={status.label} telat={status.telat} netral={status.netral} />
                  {/* Menjorok 16px (titik 7px + jarak 9px) supaya sejajar dengan
                      teks label di atasnya, bukan dengan titiknya. */}
                  {status.kembali !== undefined && (
                    <p className="mt-4 pl-16 text-m-label text-mitra-faint">
                      {t.kembali} {tanggalLengkap(status.kembali, bahasa)}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setEdit(u)}
                    className={kelasTombolBaris.sekunder}
                  >
                    {t.edit}
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
        {t.menampilkan(terlihat.length, daftar.length)}
      </p>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {edit && (
        <FormEdit
          unit={edit}
          sedangKeluar={berjalan.some((p) => p.plat === edit.plat)}
          sekarang={sekarang}
          t={t}
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
  t,
  onSimpan,
  onTutup,
}: {
  t: Teks;
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
    <Modal judul={t.editUnit} onTutup={onTutup} lebar="max-w-[440px]">
      <p className="mt-10 text-m-judul-baris text-mitra-ink">{unit.nama}</p>
      <p className="mt-4 text-m-meta text-mitra-muted">{unit.plat}</p>

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
          {t.hargaPerHari}
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
          {hargaValid ? t.terbaca(rupiah(angka)) : t.isiAngka}
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
            <span className="block text-m-status text-mitra-ink">{t.sedangServis}</span>
            <span className="mt-2 block text-m-label text-mitra-muted">
              {sedangKeluar ? t.tidakBisa : t.hilang}
            </span>
          </span>
        </label>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            {t.batal}
          </button>
          <button type="submit" disabled={!hargaValid} className={kelasTombolBaris.primer}>
            {t.simpan}
          </button>
        </div>
      </form>
    </Modal>
  );
}
