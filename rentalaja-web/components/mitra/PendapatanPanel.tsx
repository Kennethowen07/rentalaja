"use client";

// Layar Pendapatan (#4e). Dua hal yang benar-benar berfungsi: pilih periode
// mengganti seluruh angka di layar, dan unduh laporan menghasilkan CSV dari
// transaksi periode yang sedang dilihat.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";
import { rupiah, rupiahSingkat } from "@/lib/mitra/format";
import type { Periode } from "@/lib/mitra/tipe";
import { HeaderHalaman, kelasTombol, kelasTombolBaris } from "./ui";

function warnaBar(persen: number) {
  if (persen >= 75) return "bg-mitra-bar-pekat";
  if (persen >= 40) return "bg-mitra-bar-sedang";
  return "bg-mitra-bar-muda";
}

const TEKS = kamus({
  id: {
    csv: {
      kepala: ["Tanggal dan keterangan", "Transaksi", "Nilai"],
      kotor: "Pendapatan kotor",
      biaya: "Biaya layanan rentalaja",
      bersih: "Bersih diterima",
      berkas: "pendapatan",
    },
    judul: "Pendapatan",
    pilihPeriode: "Pilih periode",
    diunduh: (label: string) => `Laporan ${label} diunduh sebagai CSV.`,
    unduh: "Unduh laporan",
    bersihLabel: (label: string) => `Pendapatan bersih ${label}`,
    bersih: "Bersih diterima",
    dari: (kotor: string, biaya: string) =>
      `Dari nilai sewa ${kotor}, setelah biaya layanan rentalaja 5% sebesar ${biaya}.`,
    ditahan: "Dana penyewa ditahan rentalaja dan dilepas 1x24 jam setelah unit kembali.",
    transaksi: "Transaksi terbaru",
    ringkas: "Ringkas",
    lihatSemua: "Lihat semua",
    sumber: "Sumber pendapatan",
    tambahan: "Tambahan mencakup antar-jemput unit, helm ekstra, dan denda keterlambatan.",
    periodeLaporan: "Periode laporan",
    diganti: (label: string) => `Periode diganti ke ${label}.`,
    kotor: (r: string) => `kotor ${r}`,
    tutup: "Tutup",
  },
  en: {
    csv: {
      kepala: ["Date and details", "Transaction", "Amount"],
      kotor: "Gross earnings",
      biaya: "rentalaja service fee",
      bersih: "Net received",
      berkas: "earnings",
    },
    judul: "Earnings",
    pilihPeriode: "Choose period",
    diunduh: (label: string) => `${label} report downloaded as CSV.`,
    unduh: "Download report",
    bersihLabel: (label: string) => `Net earnings, ${label}`,
    bersih: "Net received",
    dari: (kotor: string, biaya: string) =>
      `From ${kotor} in rentals, after the 5% rentalaja service fee of ${biaya}.`,
    ditahan: "Renters' payments are held by rentalaja and released 24 hours after the vehicle is returned.",
    transaksi: "Recent transactions",
    ringkas: "Show less",
    lihatSemua: "See all",
    sumber: "Earnings by source",
    tambahan: "Extras cover vehicle delivery and pick-up, extra helmets, and late fees.",
    periodeLaporan: "Report period",
    diganti: (label: string) => `Period changed to ${label}.`,
    kotor: (r: string) => `gross ${r}`,
    tutup: "Close",
  },
});
type TeksCsv = (typeof TEKS)["id"]["csv"];

/** Huruf pertama kapital: keterangan bandingan di data diawali huruf kecil. */
const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function unduhCsv(periode: Periode, csv: TeksCsv) {
  const baris = [
    csv.kepala,
    ...periode.transaksi.map((t) => [
      t.meta,
      t.judul,
      `${t.arah === "keluar" ? "-" : ""}${t.nilai}`,
    ]),
    [],
    [csv.kotor, "", String(periode.kotor)],
    [csv.biaya, "", String(periode.biaya)],
    [csv.bersih, "", String(periode.bersih)],
  ];
  // Titik koma dipakai sebagai pemisah supaya Excel berbahasa Indonesia
  // membuka filenya dengan kolom yang benar.
  const isi = baris
    .map((k) => k.map((sel) => `"${sel.replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }));
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = `${csv.berkas}-${periode.kunci}.csv`;
  tautan.click();
  URL.revokeObjectURL(url);
}

export default function PendapatanPanel({ periode }: { periode: Periode[] }) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [kunci, setKunci] = useState(periode[0].kunci);
  const [pilihPeriode, setPilihPeriode] = useState(false);
  const [semuaTransaksi, setSemuaTransaksi] = useState(false);
  const [kabar, setKabar] = useState("");

  const p = periode.find((x) => x.kunci === kunci)!;
  const transaksi = semuaTransaksi ? p.transaksi : p.transaksi.slice(0, 3);
  const maksSumber = Math.max(...p.sumber.map((s) => s.nilai));

  return (
    <>
      <HeaderHalaman
        kicker={p.rentang}
        judul={t.judul}
        aksi={
          <>
            <button
              type="button"
              onClick={() => setPilihPeriode(true)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              {t.pilihPeriode}
            </button>
            <button
              type="button"
              onClick={() => {
                unduhCsv(p, t.csv);
                setKabar(t.diunduh(p.label));
              }}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              {t.unduh}
            </button>
          </>
        }
      />

      {/* Satu angka saja: yang benar-benar diterima penyedia. Kotor dan biaya
          layanan tetap disebut, tapi sebagai keterangan, bukan tiga kartu
          yang saling bersaing. */}
      <section
        aria-label={t.bersihLabel(p.label)}
        className="mt-36 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24"
      >
        <p className="text-m-label text-mitra-faint">{t.bersih}</p>
        <p className="mt-6 text-m-metrik text-mitra-primer">{rupiahSingkat(p.bersih, bahasa)}</p>
        <p className="mt-6 max-w-620 text-m-body text-mitra-muted">
          {t.dari(rupiahSingkat(p.kotor, bahasa), rupiahSingkat(p.biaya, bahasa))} {kapital(p.bandingan)}.
        </p>
        <p className="mt-4 max-w-620 text-m-body text-mitra-muted">{t.ditahan}</p>
      </section>

      <div className="mt-44 grid items-start gap-44 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64">
        <section aria-labelledby="judul-transaksi">
          <div className="flex items-baseline justify-between gap-16">
            <h2 id="judul-transaksi" className="text-m-h2 text-mitra-ink">
              {t.transaksi}
            </h2>
            {p.transaksi.length > 3 && (
              <button
                type="button"
                onClick={() => setSemuaTransaksi((v) => !v)}
                className="whitespace-nowrap text-m-tautan text-mitra-primer hover:underline"
              >
                {semuaTransaksi ? t.ringkas : t.lihatSemua}
              </button>
            )}
          </div>

          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            <ul>
              {transaksi.map((x) => (
                <li
                  key={x.id}
                  className="flex flex-wrap items-center gap-16 border-t border-mitra-hairline py-22 first:border-t-0"
                >
                  <div className="min-w-0 flex-1 basis-200">
                    <p className="text-m-total text-mitra-ink">{x.judul}</p>
                    <p className="mt-4 text-m-meta text-mitra-muted">{x.meta}</p>
                  </div>
                  <p
                    className={`shrink-0 whitespace-nowrap text-m-total ${
                      x.arah === "masuk" ? "text-mitra-ink" : "text-mitra-muted"
                    }`}
                  >
                    {x.arah === "masuk" ? "+" : "−"} {rupiah(x.nilai)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="judul-sumber">
          <h2 id="judul-sumber" className="text-m-h2 text-mitra-ink">
            {t.sumber}
          </h2>
          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            <ul>
              {p.sumber.map((s) => {
                const persen = Math.round((s.nilai / maksSumber) * 100);
                return (
                  <li
                    key={s.label}
                    className="flex items-center gap-18 border-t border-mitra-hairline py-13 first:border-t-0"
                  >
                    <span className="w-96 shrink-0 text-m-status text-mitra-muted">{s.label}</span>
                    <span aria-hidden className="h-10 flex-1 rounded-pill bg-mitra-track">
                      <span
                        className={`block h-10 rounded-pill ${warnaBar(persen)}`}
                        style={{ width: `${persen}%` }}
                      />
                    </span>
                    <span className="w-72 shrink-0 text-right text-m-angka text-mitra-ink">
                      {rupiahSingkat(s.nilai, bahasa).replace("Rp ", "")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-20 text-m-body text-mitra-muted">
            {t.tambahan}
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {pilihPeriode && (
        <Modal judul={t.pilihPeriode} onTutup={() => setPilihPeriode(false)} lebar="max-w-[420px]">
          <div role="radiogroup" aria-label={t.periodeLaporan} className="mt-14">
            {periode.map((x) => (
              <label
                key={x.kunci}
                className="flex items-start gap-10 border-t border-mitra-hairline py-14 first:border-t-0"
              >
                <input
                  type="radio"
                  name="periode"
                  value={x.kunci}
                  checked={x.kunci === kunci}
                  onChange={() => {
                    setKunci(x.kunci);
                    setSemuaTransaksi(false);
                    setPilihPeriode(false);
                    setKabar(t.diganti(x.label));
                  }}
                  className="mt-3 size-16"
                />
                <span>
                  <span className="block text-m-status text-mitra-ink">{x.label}</span>
                  <span className="mt-2 block text-m-label text-mitra-muted">
                    {x.rentang} · {t.kotor(rupiahSingkat(x.kotor, bahasa))}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-20 flex justify-end">
            <button
              type="button"
              onClick={() => setPilihPeriode(false)}
              className={kelasTombolBaris.sekunder}
            >
              {t.tutup}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
