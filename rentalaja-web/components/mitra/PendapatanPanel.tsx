"use client";

// Layar Pendapatan (#4e). Tiga hal yang benar-benar berfungsi: pilih periode
// mengganti seluruh angka di layar, unduh laporan menghasilkan CSV dari
// transaksi periode yang sedang dilihat, dan tarik saldo mengosongkan saldo
// lalu mencatat pencairannya. Penarikan hidup di state client, jadi hilang
// saat refresh, sesuai status prototype tanpa backend.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";
import { rupiah, rupiahSingkat } from "@/lib/mitra/format";
import type { Periode, Transaksi } from "@/lib/mitra/tipe";
import { tanggalSingkat } from "@/lib/mitra/waktu";
import { HeaderHalaman, kelasTombol, kelasTombolBaris } from "./ui";

/** Rekening contoh untuk prototype, bukan rekening asli. */
const REKENING = "BCA ···4471";

function warnaBar(persen: number) {
  if (persen >= 75) return "bg-mitra-bar-pekat";
  if (persen >= 40) return "bg-mitra-bar-sedang";
  return "bg-mitra-bar-muda";
}

const TEKS = kamus({
  id: {
    csv: {
      kepala: ["Tanggal", "Transaksi", "Nilai"],
      kotor: "Pendapatan kotor",
      biaya: "Biaya layanan rentalaja",
      bersih: "Bersih diterima",
      berkas: "pendapatan",
    },
    judul: "Pendapatan",
    pilihPeriode: "Pilih periode",
    diunduh: (label: string) => `Laporan ${label} diunduh sebagai CSV.`,
    unduh: "Unduh laporan",
    saldoLabel: (label: string) => `Saldo ${label}`,
    saldo: "Saldo Kamu",
    ditahan: "Saldo Ditahan",
    tarik: "Tarik Saldo",
    tarikJudul: "Tarik saldo ke rekening?",
    tarikIsi: (nilai: string, rek: string) => `${nilai} dikirim ke ${rek}, biasanya masuk dalam 1 hari kerja.`,
    tarikKonfirmasi: "Tarik sekarang",
    batal: "Batal",
    pencairan: "Pencairan ke rekening",
    ditarik: (nilai: string) => `${nilai} sedang dikirim ke rekening.`,
    transaksi: "Transaksi terbaru",
    ringkas: "Ringkas",
    lihatSemua: "Lihat semua",
    sumber: "Sumber pendapatan",
    periodeLaporan: "Periode laporan",
    diganti: (label: string) => `Periode diganti ke ${label}.`,
    kotor: (r: string) => `kotor ${r}`,
    tutup: "Tutup",
  },
  en: {
    csv: {
      kepala: ["Date", "Transaction", "Amount"],
      kotor: "Gross earnings",
      biaya: "rentalaja service fee",
      bersih: "Net received",
      berkas: "earnings",
    },
    judul: "Earnings",
    pilihPeriode: "Choose period",
    diunduh: (label: string) => `${label} report downloaded as CSV.`,
    unduh: "Download report",
    saldoLabel: (label: string) => `Balance, ${label}`,
    saldo: "Your Balance",
    ditahan: "On Hold",
    tarik: "Withdraw",
    tarikJudul: "Withdraw to your bank account?",
    tarikIsi: (nilai: string, rek: string) => `${nilai} goes to ${rek}, usually within 1 working day.`,
    tarikKonfirmasi: "Withdraw now",
    batal: "Cancel",
    pencairan: "Payout to bank account",
    ditarik: (nilai: string) => `${nilai} is on its way to your bank account.`,
    transaksi: "Recent transactions",
    ringkas: "Show less",
    lihatSemua: "See all",
    sumber: "Earnings by source",
    periodeLaporan: "Report period",
    diganti: (label: string) => `Period changed to ${label}.`,
    kotor: (r: string) => `gross ${r}`,
    tutup: "Close",
  },
});
type TeksCsv = (typeof TEKS)["id"]["csv"];

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
  const [tarik, setTarik] = useState(false);
  /** Pencairan yang dibuat di sesi ini, per periode. */
  const [pencairan, setPencairan] = useState<Record<string, Transaksi>>({});

  const asli = periode.find((x) => x.kunci === kunci)!;
  const cair = pencairan[kunci];
  const p = cair ? { ...asli, transaksi: [cair, ...asli.transaksi] } : asli;
  const saldo = cair ? 0 : p.bersih;
  const transaksi = semuaTransaksi ? p.transaksi : p.transaksi.slice(0, 3);

  function tarikSaldo() {
    setPencairan((c) => ({
      ...c,
      [kunci]: { id: `tarik-${kunci}`, judul: t.pencairan, meta: tanggalSingkat(Date.now(), bahasa), nilai: saldo, arah: "keluar" },
    }));
    setKabar(t.ditarik(rupiah(saldo)));
    setTarik(false);
  }
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

      {/* Saldo yang sudah diterima penyedia dan dana yang masih ditahan escrow
          sampai unitnya kembali. Kotor dan biaya layanan ada di laporan CSV. */}
      <section aria-label={t.saldoLabel(p.label)} className="mt-36 grid gap-20 min-[640px]:grid-cols-2">
        <div className="flex flex-wrap items-end justify-between gap-16 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
          <div>
            <p className="text-m-label text-mitra-faint">{t.saldo}</p>
            <p className="mt-6 text-m-metrik text-mitra-primer">{rupiah(saldo)}</p>
          </div>
          <button
            type="button"
            disabled={saldo === 0}
            onClick={() => setTarik(true)}
            className={`${kelasTombol.primer} px-19 py-11 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {t.tarik}
          </button>
        </div>
        <div className="rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
          <p className="text-m-label text-mitra-faint">{t.ditahan}</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{rupiah(p.ditahan)}</p>
        </div>
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
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {tarik && (
        <Modal judul={t.tarikJudul} onTutup={() => setTarik(false)} lebar="max-w-[420px]">
          <p className="mt-10 text-m-metrik text-mitra-primer">{rupiah(saldo)}</p>
          <p className="mt-8 text-m-body text-mitra-muted">{t.tarikIsi(rupiah(saldo), REKENING)}</p>
          <div className="mt-20 flex justify-end gap-8">
            <button type="button" onClick={() => setTarik(false)} className={kelasTombolBaris.sekunder}>
              {t.batal}
            </button>
            <button type="button" onClick={tarikSaldo} className={kelasTombolBaris.primer}>
              {t.tarikKonfirmasi}
            </button>
          </div>
        </Modal>
      )}

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
