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

const legenda: { keadaan: Keadaan; label: string; kelas: string }[] = [
  { keadaan: "disewa", label: "Disewa", kelas: "bg-mitra-primer" },
  { keadaan: "dipesan", label: "Sudah dipesan", kelas: "bg-mitra-bar-muda" },
  { keadaan: "kosong", label: "Kosong", kelas: "bg-mitra-panel" },
  { keadaan: "diblokir", label: "Diblokir / servis", kelas: "bg-mitra-blocked sel-diblokir" },
  { keadaan: "telat", label: "Lewat jadwal", kelas: "bg-mitra-plum" },
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
): IsiSel {
  const berjalan = pesanan.find(
    (p) => p.status === "active" && p.plat === u.plat && menutupi(p, hari),
  );
  if (berjalan) {
    const kembali = berjalan.kembaliPada ?? berjalan.selesai;
    return {
      keadaan: "disewa",
      keterangan: `disewa ${berjalan.penyewa}, kembali ${tanggalSingkat(kembali)} ${jamSaja(kembali)}`,
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
      keterangan: `lewat jadwal, ${telat.penyewa} belum mengembalikan`,
    };
  }

  const menunggu = pesanan.find(
    (p) => p.status === "pending" && p.plat === u.plat && menutupi(p, hari),
  );
  if (menunggu) {
    return {
      keadaan: "dipesan",
      keterangan: `sudah dipesan ${menunggu.penyewa}, menunggu konfirmasi`,
    };
  }

  if (blokir.has(`${u.id}|${kunciTanggal(hari)}`)) {
    return { keadaan: "diblokir", keterangan: "diblokir manual" };
  }

  if (u.status === "service" && u.servisSampai && hari <= awalHari(u.servisSampai)) {
    return {
      keadaan: "servis",
      keterangan: `servis sampai ${tanggalSingkat(u.servisSampai)}`,
    };
  }

  return { keadaan: "kosong", keterangan: "kosong, klik untuk blokir tanggal" };
}

export default function KalenderUnit({ unit, sekarang }: { unit: Unit[]; sekarang: number }) {
  const { pesanan } = usePesanan();
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
    setKabar(
      `${u.nama} ${u.plat} ${tanggalSingkat(tanggal)} ${jadiBlokir ? "diblokir" : "dibuka kembali"}.`,
    );
  }

  return (
    <>
      <HeaderHalaman
        kicker={rentangMinggu(hari[0], hari[6])}
        judul="Kalender unit"
        aksi={
          <>
            <button
              type="button"
              onClick={() => setMinggu((m) => m - 1)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              Minggu lalu
            </button>
            <button
              type="button"
              onClick={() => setMinggu((m) => m + 1)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              Minggu depan
            </button>
            <button
              type="button"
              onClick={() => setFormBlokir(true)}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              Blokir tanggal
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
          Kembali ke minggu ini
        </button>
      )}

      <ul className="mt-28 flex flex-wrap gap-x-24 gap-y-10">
        {legenda.map((l) => (
          <li key={l.keadaan} className="flex items-center gap-9">
            <span aria-hidden className={`size-14 rounded-[4px] ${l.kelas}`} />
            <span className="text-m-status text-mitra-muted">{l.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-26 overflow-x-auto rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[200px_repeat(7,1fr)] min-[1100px]:grid-cols-[290px_repeat(7,1fr)]">
            <div />
            {hari.map((h) => {
              const ini = awalHari(h) === hariIni;
              return (
                <div
                  key={h}
                  className={`pb-12 text-center ${
                    ini ? "text-m-nav-aktif text-mitra-ink" : "text-m-status text-mitra-faint"
                  }`}
                >
                  {hariSingkat(h)}
                </div>
              );
            })}
          </div>

          {unit.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[200px_repeat(7,1fr)] items-center border-t border-mitra-hairline last:border-b min-[1100px]:grid-cols-[290px_repeat(7,1fr)]"
            >
              <div className="flex items-center gap-16 py-16 pr-18">
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
                const sel = isiSel(u, tanggal, pesanan, blokir, sekarang);
                const bisaDiklik = sel.keadaan === "kosong" || sel.keadaan === "diblokir";
                const label = `${u.nama} ${u.plat}, ${hariSingkat(h)}, ${sel.keterangan}`;

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
        Kalender ini yang dibaca penyewa. Klik sel kosong untuk blokir tanggal, misalnya saat
        unit masuk servis. Sel yang sudah ada pesanan tidak bisa diblokir.
      </p>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {formBlokir && (
        <FormBlokir
          unit={unit}
          sekarang={sekarang}
          onTutup={() => setFormBlokir(false)}
          onSimpan={(u, mulai, selesai) => {
            const kunci: string[] = [];
            for (let t = awalHari(mulai); t <= awalHari(selesai); t += HARI) {
              kunci.push(`${u.id}|${kunciTanggal(t)}`);
            }
            setBlokir((lama) => new Set([...lama, ...kunci]));
            setKabar(
              `${kunci.length} tanggal diblokir untuk ${u.nama} ${u.plat}, mulai ${tanggalSingkat(mulai)}.`,
            );
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
  onTutup,
  onSimpan,
}: {
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
    <Modal judul="Blokir tanggal" onTutup={onTutup} lebar="max-w-[440px]">
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
          Unit
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
              Mulai
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
              Sampai
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
          {valid
            ? "Sel yang sudah ada pesanannya tetap tampil sebagai pesanan, bukan blokir."
            : "Tanggal mulai harus sebelum tanggal selesai."}
        </p>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            Batal
          </button>
          <button type="submit" disabled={!valid} className={kelasTombolBaris.primer}>
            Blokir
          </button>
        </div>
      </form>
    </Modal>
  );
}
