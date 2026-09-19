"use client";

// Layar Pendapatan (#4e). Dua hal yang benar-benar berfungsi: pilih periode
// mengganti seluruh angka di layar, dan unduh laporan menghasilkan CSV dari
// transaksi periode yang sedang dilihat.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { rupiah, rupiahSingkat } from "@/lib/mitra/format";
import type { Periode } from "@/lib/mitra/tipe";
import { HeaderHalaman, kelasTombol, kelasTombolBaris } from "./ui";

function warnaBar(persen: number) {
  if (persen >= 75) return "bg-mitra-bar-pekat";
  if (persen >= 40) return "bg-mitra-bar-sedang";
  return "bg-mitra-bar-muda";
}

function unduhCsv(periode: Periode) {
  const baris = [
    ["Tanggal dan keterangan", "Transaksi", "Nilai"],
    ...periode.transaksi.map((t) => [
      t.meta,
      t.judul,
      `${t.arah === "keluar" ? "-" : ""}${t.nilai}`,
    ]),
    [],
    ["Pendapatan kotor", "", String(periode.kotor)],
    ["Biaya layanan rentalaja", "", String(periode.biaya)],
    ["Bersih diterima", "", String(periode.bersih)],
  ];
  // Titik koma dipakai sebagai pemisah supaya Excel berbahasa Indonesia
  // membuka filenya dengan kolom yang benar.
  const isi = baris
    .map((k) => k.map((sel) => `"${sel.replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }));
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = `pendapatan-${periode.kunci}.csv`;
  tautan.click();
  URL.revokeObjectURL(url);
}

export default function PendapatanPanel({ periode }: { periode: Periode[] }) {
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
        judul="Pendapatan"
        aksi={
          <>
            <button
              type="button"
              onClick={() => setPilihPeriode(true)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              Pilih periode
            </button>
            <button
              type="button"
              onClick={() => {
                unduhCsv(p);
                setKabar(`Laporan ${p.label} diunduh sebagai CSV.`);
              }}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              Unduh laporan
            </button>
          </>
        }
      />

      <section
        aria-label={`Ringkasan pendapatan ${p.label}`}
        className="mt-36 grid rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:grid-cols-3 min-[640px]:p-24"
      >
        <div className="border-b border-mitra-hairline pb-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:pb-0 min-[640px]:pr-30">
          <p className="text-m-label text-mitra-faint">Pendapatan kotor</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{rupiahSingkat(p.kotor)}</p>
          <p className="mt-2 text-m-label text-mitra-muted">{p.bandingan}</p>
        </div>
        <div className="border-b border-mitra-hairline py-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:px-30 min-[640px]:py-0">
          <p className="text-m-label text-mitra-faint">Biaya layanan rentalaja</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{rupiahSingkat(p.biaya)}</p>
          <p className="mt-2 text-m-label text-mitra-muted">5% dari nilai sewa</p>
        </div>
        <div className="pt-20 min-[640px]:pt-0 min-[640px]:pl-30">
          <p className="text-m-label text-mitra-faint">Bersih diterima</p>
          <p className="mt-6 text-m-metrik text-mitra-primer">{rupiahSingkat(p.bersih)}</p>
          <p className="mt-2 text-m-label text-mitra-muted">pencairan DP tiap Senin</p>
        </div>
      </section>

      <div className="mt-44 grid items-start gap-44 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64">
        <section aria-labelledby="judul-transaksi">
          <div className="flex items-baseline justify-between gap-16">
            <h2 id="judul-transaksi" className="text-m-h2 text-mitra-ink">
              Transaksi terbaru
            </h2>
            {p.transaksi.length > 3 && (
              <button
                type="button"
                onClick={() => setSemuaTransaksi((v) => !v)}
                className="whitespace-nowrap text-m-tautan text-mitra-primer hover:underline"
              >
                {semuaTransaksi ? "Ringkas" : "Lihat semua"}
              </button>
            )}
          </div>

          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            <ul>
              {transaksi.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-16 border-t border-mitra-hairline py-22 first:border-t-0"
                >
                  <div className="min-w-0 flex-1 basis-200">
                    <p className="text-m-total text-mitra-ink">{t.judul}</p>
                    <p className="mt-4 text-m-meta text-mitra-muted">{t.meta}</p>
                  </div>
                  <p
                    className={`shrink-0 whitespace-nowrap text-m-total ${
                      t.arah === "masuk" ? "text-mitra-ink" : "text-mitra-muted"
                    }`}
                  >
                    {t.arah === "masuk" ? "+" : "−"} {rupiah(t.nilai)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="judul-sumber">
          <h2 id="judul-sumber" className="text-m-h2 text-mitra-ink">
            Sumber pendapatan
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
                      {rupiahSingkat(s.nilai).replace("Rp ", "")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-20 text-m-body text-mitra-muted">
            Tambahan mencakup antar-jemput unit, helm ekstra, dan denda keterlambatan.
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {pilihPeriode && (
        <Modal judul="Pilih periode" onTutup={() => setPilihPeriode(false)} lebar="max-w-[420px]">
          <div role="radiogroup" aria-label="Periode laporan" className="mt-14">
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
                    setKabar(`Periode diganti ke ${x.label}.`);
                  }}
                  className="mt-3 size-16"
                />
                <span>
                  <span className="block text-m-status text-mitra-ink">{x.label}</span>
                  <span className="mt-2 block text-m-label text-mitra-muted">
                    {x.rentang} · kotor {rupiahSingkat(x.kotor)}
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
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
