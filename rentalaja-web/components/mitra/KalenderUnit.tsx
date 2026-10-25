"use client";

// Kalender ketersediaan per unit (layar #4c). Ini layar paling menentukan di
// panel: isinya persis yang dibaca penyewa saat mencari unit kosong.
//
// Status tiap sel diturunkan, tidak disimpan:
//   disewa        <- pesanan berjalan yang menutupi tanggal itu
//   lewat jadwal  <- pesanan berjalan yang jatuh temponya sudah lewat
//   sudah dipesan <- pesanan yang masih menunggu konfirmasi
//   diblokir      <- unit berstatus servis, atau blokir manual di layar ini
//   kosong        <- sisanya
// Jadi menerima pesanan di layar Pesanan langsung mengubah warna kalender,
// tanpa ada data kedua yang harus disinkronkan.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, type Bahasa } from "@/lib/i18n";
import { rupiah } from "@/lib/mitra/format";
import type { Pesanan, Unit } from "@/lib/mitra/tipe";
import {
  HARI,
  awalHari,
  hariSingkat,
  jamSaja,
  kunciTanggal,
  pukulWita,
  rentangMinggu,
  tanggalSingkat,
} from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { HeaderHalaman, ThumbnailUnit, kelasTombol, kelasTombolBaris } from "./ui";

type Keadaan = "disewa" | "telat" | "dipesan" | "diblokir" | "servis" | "kosong";

const TEKS = kamus({
  id: {
    legenda: {
      disewa: "Disewa",
      dipesan: "Sudah dipesan",
      kosong: "Kosong",
      diblokir: "Diblokir / servis",
      telat: "Lewat jadwal",
    },
    disewaOleh: (nama: string, kembali: string) => `disewa ${nama}, kembali ${kembali}`,
    telatOleh: (nama: string) => `lewat jadwal, ${nama} belum mengembalikan`,
    dipesanOleh: (nama: string) => `sudah dipesan ${nama}, menunggu konfirmasi`,
    blokirManual: "diblokir manual",
    servisSampai: (t: string) => `servis sampai ${t}`,
    kosong: "kosong, klik untuk blokir tanggal",
    diubah: (unit: string, tanggal: string, blokir: boolean) =>
      `${unit} ${tanggal} ${blokir ? "diblokir" : "dibuka kembali"}.`,
    judul: "Kalender unit",
    mingguLalu: "Minggu lalu",
    mingguDepan: "Minggu depan",
    blokir: "Blokir tanggal",
    mingguIni: "Kembali ke minggu ini",
    catatan:
      "Kalender ini yang dibaca penyewa. Klik sel kosong untuk blokir tanggal, misalnya saat unit masuk servis. Sel yang sudah ada pesanan tidak bisa diblokir.",
    diblokirBanyak: (n: number, unit: string, mulai: string) =>
      `${n} tanggal diblokir untuk ${unit}, mulai ${mulai}.`,
    unit: "Unit",
    mulai: "Mulai",
    sampai: "Sampai",
    validCatatan: "Sel yang sudah ada pesanannya tetap tampil sebagai pesanan, bukan blokir.",
    tidakValid: "Tanggal mulai harus sebelum tanggal selesai.",
    batal: "Batal",
    tombolBlokir: "Blokir",
  },
  en: {
    legenda: {
      disewa: "Rented",
      dipesan: "Booked",
      kosong: "Available",
      diblokir: "Blocked / servicing",
      telat: "Overdue",
    },
    disewaOleh: (nama: string, kembali: string) => `rented by ${nama}, returns ${kembali}`,
    telatOleh: (nama: string) => `overdue, ${nama} hasn't returned it yet`,
    dipesanOleh: (nama: string) => `booked by ${nama}, awaiting confirmation`,
    blokirManual: "blocked manually",
    servisSampai: (t: string) => `servicing until ${t}`,
    kosong: "available, click to block the date",
    diubah: (unit: string, tanggal: string, blokir: boolean) =>
      `${unit} ${tanggal} ${blokir ? "blocked" : "unblocked"}.`,
    judul: "Vehicle calendar",
    mingguLalu: "Previous week",
    mingguDepan: "Next week",
    blokir: "Block dates",
    mingguIni: "Back to this week",
    catatan:
      "This is the calendar renters see. Click an available cell to block the date, for example when a vehicle goes in for servicing. Cells that already have a booking can't be blocked.",
    diblokirBanyak: (n: number, unit: string, mulai: string) =>
      `${n} ${n === 1 ? "date" : "dates"} blocked for ${unit}, starting ${mulai}.`,
    unit: "Vehicle",
    mulai: "From",
    sampai: "To",
    validCatatan: "Cells that already have a booking still show as booked, not blocked.",
    tidakValid: "The start date must be before the end date.",
    batal: "Cancel",
    tombolBlokir: "Block",
  },
});
type Teks = (typeof TEKS)["id"];

const legenda: { keadaan: Exclude<Keadaan, "servis">; kelas: string }[] = [
  { keadaan: "disewa", kelas: "bg-mitra-primer" },
  { keadaan: "dipesan", kelas: "bg-mitra-bar-muda" },
  { keadaan: "kosong", kelas: "bg-mitra-panel" },
  { keadaan: "diblokir", kelas: "bg-mitra-blocked sel-diblokir" },
  { keadaan: "telat", kelas: "bg-mitra-plum" },
];

const warna: Record<Keadaan, string> = {
  disewa: "bg-mitra-primer",
  telat: "bg-mitra-plum",
  dipesan: "bg-mitra-bar-muda",
  // Warna dasar tetap lewat utility Tailwind, garis diagonalnya lewat
  // .sel-diblokir. Kalau CSS custom belum termuat, selnya masih berwarna.
  diblokir: "bg-mitra-blocked sel-diblokir",
  servis: "bg-mitra-blocked sel-diblokir",
  kosong: "bg-mitra-panel",
};

function menutupi(p: Pesanan, hari: number) {
  return awalHari(p.mulai) <= hari && hari <= awalHari(p.selesai);
}

type IsiSel = { keadaan: Keadaan; keterangan: string };

function isiSel(
  u: Unit,
  hari: number,
  pesanan: Pesanan[],
  blokir: Set<string>,
  sekarang: number,
  bahasa: Bahasa,
  t: Teks,
): IsiSel {
  const berjalan = pesanan.find(
    (p) => p.status === "active" && p.plat === u.plat && menutupi(p, hari),
  );
  if (berjalan) {
    const kembali = berjalan.kembaliPada ?? berjalan.selesai;
    return {
      keadaan: "disewa",
      keterangan: t.disewaOleh(berjalan.penyewa, `${tanggalSingkat(kembali, bahasa)} ${jamSaja(kembali, bahasa)}`),
    };
  }

  // Unit yang belum dikembalikan menandai hari-hari setelah jatuh tempo,
  // sampai hari ini, sebagai lewat jadwal.
  const telat = pesanan.find((p) => {
    if (p.status !== "active" || p.plat !== u.plat) return false;
    const kembali = awalHari(p.kembaliPada ?? p.selesai);
    return kembali < awalHari(sekarang) && hari > kembali && hari <= awalHari(sekarang);
  });
  if (telat) {
    return {
      keadaan: "telat",
      keterangan: t.telatOleh(telat.penyewa),
    };
  }

  const menunggu = pesanan.find(
    (p) => p.status === "pending" && p.plat === u.plat && menutupi(p, hari),
  );
  if (menunggu) {
    return {
      keadaan: "dipesan",
      keterangan: t.dipesanOleh(menunggu.penyewa),
    };
  }

  if (blokir.has(`${u.id}|${kunciTanggal(hari)}`)) {
    return { keadaan: "diblokir", keterangan: t.blokirManual };
  }

  if (u.status === "service" && u.servisSampai && hari <= awalHari(u.servisSampai)) {
    return {
      keadaan: "servis",
      keterangan: t.servisSampai(tanggalSingkat(u.servisSampai, bahasa)),
    };
  }

  return { keadaan: "kosong", keterangan: t.kosong };
}

export default function KalenderUnit({ unit, sekarang }: { unit: Unit[]; sekarang: number }) {
  const { pesanan } = usePesanan();
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [minggu, setMinggu] = useState(0);
  const [blokir, setBlokir] = useState<Set<string>>(new Set());
  const [formBlokir, setFormBlokir] = useState(false);
  const [kabar, setKabar] = useState("");

  const hari = Array.from({ length: 7 }, (_, i) => pukulWita(sekarang, minggu * 7 + i, 12));
  const hariIni = awalHari(sekarang);

  function ubahBlokir(u: Unit, tanggal: number, jadiBlokir: boolean) {
    const kunci = `${u.id}|${kunciTanggal(tanggal)}`;
    setBlokir((lama) => {
      const baru = new Set(lama);
      if (jadiBlokir) baru.add(kunci);
      else baru.delete(kunci);
      return baru;
    });
    setKabar(t.diubah(`${u.nama} ${u.plat}`, tanggalSingkat(tanggal, bahasa), jadiBlokir));
  }

  return (
    <>
      <HeaderHalaman
        kicker={rentangMinggu(hari[0], hari[6], bahasa)}
        judul={t.judul}
        aksi={
          <>
            <button
              type="button"
              onClick={() => setMinggu((m) => m - 1)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              {t.mingguLalu}
            </button>
            <button
              type="button"
              onClick={() => setMinggu((m) => m + 1)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              {t.mingguDepan}
            </button>
            <button
              type="button"
              onClick={() => setFormBlokir(true)}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              {t.blokir}
            </button>
          </>
        }
      />

      {minggu !== 0 && (
        <button
          type="button"
          onClick={() => setMinggu(0)}
          className="mt-16 text-m-tautan text-mitra-primer hover:underline"
        >
          {t.mingguIni}
        </button>
      )}

      <ul className="mt-28 flex flex-wrap gap-x-24 gap-y-10">
        {legenda.map((l) => (
          <li key={l.keadaan} className="flex items-center gap-9">
            <span aria-hidden className={`size-14 rounded-[4px] ${l.kelas}`} />
            <span className="text-m-status text-mitra-muted">{t.legenda[l.keadaan]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-26 overflow-x-auto rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[200px_repeat(7,1fr)] min-[1100px]:grid-cols-[290px_repeat(7,1fr)]">
            <div className="sticky left-0 z-1 bg-white" />
            {hari.map((h) => {
              const ini = awalHari(h) === hariIni;
              return (
                <div
                  key={h}
                  className={`pb-12 text-center ${
                    ini ? "text-m-nav-aktif text-mitra-ink" : "text-m-status text-mitra-faint"
                  }`}
                >
                  {hariSingkat(h, bahasa)}
                </div>
              );
            })}
          </div>

          {unit.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[200px_repeat(7,1fr)] items-center border-t border-mitra-hairline last:border-b min-[1100px]:grid-cols-[290px_repeat(7,1fr)]"
            >
              {/* Sticky supaya nama unit tetap terlihat saat tabel digeser
                  ke samping di layar sempit (README/Responsif). */}
              <div className="sticky left-0 z-1 flex items-center gap-16 bg-white py-16 pr-18">
                <ThumbnailUnit foto={u.foto} nama={u.nama} className="h-46 w-64" />
                <div className="min-w-0">
                  <p className="text-m-unit-kalender text-mitra-ink">{u.nama}</p>
                  <p className="mt-3 text-m-label text-mitra-muted">
                    {u.plat} · {rupiah(u.hargaPerHari)}
                  </p>
                </div>
              </div>

              {hari.map((h) => {
                const tanggal = awalHari(h);
                const sel = isiSel(u, tanggal, pesanan, blokir, sekarang, bahasa, t);
                const bisaDiklik = sel.keadaan === "kosong" || sel.keadaan === "diblokir";
                const label = `${u.nama} ${u.plat}, ${hariSingkat(h, bahasa)}, ${sel.keterangan}`;

                return (
                  <div key={h} className="px-5 py-10">
                    {bisaDiklik ? (
                      <button
                        type="button"
                        aria-pressed={sel.keadaan === "diblokir"}
                        aria-label={label}
                        title={sel.keterangan}
                        onClick={() => ubahBlokir(u, tanggal, sel.keadaan !== "diblokir")}
                        className={`h-34 w-full rounded-m-sel transition-colors duration-160 ease-base ${warna[sel.keadaan]} hover:brightness-95`}
                      />
                    ) : (
                      <div
                        role="img"
                        aria-label={label}
                        title={sel.keterangan}
                        className={`h-34 w-full rounded-m-sel ${warna[sel.keadaan]}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-24 text-m-body text-mitra-muted">
        {t.catatan}
      </p>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {formBlokir && (
        <FormBlokir
          unit={unit}
          sekarang={sekarang}
          t={t}
          onTutup={() => setFormBlokir(false)}
          onSimpan={(u, mulai, selesai) => {
            const kunci: string[] = [];
            for (let t = awalHari(mulai); t <= awalHari(selesai); t += HARI) {
              kunci.push(`${u.id}|${kunciTanggal(t)}`);
            }
            setBlokir((lama) => new Set([...lama, ...kunci]));
            setKabar(t.diblokirBanyak(kunci.length, `${u.nama} ${u.plat}`, tanggalSingkat(mulai, bahasa)));
            setFormBlokir(false);
          }}
        />
      )}
    </>
  );
}

function FormBlokir({
  unit,
  sekarang,
  t,
  onTutup,
  onSimpan,
}: {
  t: Teks;
  unit: Unit[];
  sekarang: number;
  onTutup: () => void;
  onSimpan: (u: Unit, mulai: number, selesai: number) => void;
}) {
  const [idUnit, setIdUnit] = useState(unit[0]?.id ?? "");
  const [mulai, setMulai] = useState(kunciTanggal(sekarang));
  const [selesai, setSelesai] = useState(kunciTanggal(sekarang + 2 * HARI));

  const dipilih = unit.find((u) => u.id === idUnit);
  const valid = Boolean(dipilih) && mulai <= selesai;
  const kelasIsian =
    "mt-6 w-full rounded-m-thumb border border-mitra-border px-12 py-9 text-m-status text-mitra-ink";

  return (
    <Modal judul={t.blokir} onTutup={onTutup} lebar="max-w-[440px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!dipilih || !valid) return;
          // Tanggal dari input date dibaca sebagai tengah hari WITA supaya
          // tidak bergeser satu hari karena zona waktu browser.
          onSimpan(
            dipilih,
            Date.parse(`${mulai}T12:00:00+08:00`),
            Date.parse(`${selesai}T12:00:00+08:00`),
          );
        }}
      >
        <label htmlFor="unit-blokir" className="mt-14 block text-m-label text-mitra-muted">
          {t.unit}
        </label>
        <select
          id="unit-blokir"
          value={idUnit}
          onChange={(e) => setIdUnit(e.target.value)}
          className={kelasIsian}
        >
          {unit.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nama} · {u.plat}
            </option>
          ))}
        </select>

        <div className="mt-14 flex gap-12">
          <div className="flex-1">
            <label htmlFor="mulai-blokir" className="block text-m-label text-mitra-muted">
              {t.mulai}
            </label>
            <input
              id="mulai-blokir"
              type="date"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className={kelasIsian}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="selesai-blokir" className="block text-m-label text-mitra-muted">
              {t.sampai}
            </label>
            <input
              id="selesai-blokir"
              type="date"
              value={selesai}
              onChange={(e) => setSelesai(e.target.value)}
              className={kelasIsian}
            />
          </div>
        </div>

        <p className="mt-10 text-m-label text-mitra-muted">
          {valid ? t.validCatatan : t.tidakValid}
        </p>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            {t.batal}
          </button>
          <button type="submit" disabled={!valid} className={kelasTombolBaris.primer}>
            {t.tombolBlokir}
          </button>
        </div>
      </form>
    </Modal>
  );
}
