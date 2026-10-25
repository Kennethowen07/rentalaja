"use client";

// Layar Ulasan (#4f). Balasan benar-benar bisa ditulis: tombol "Balas ulasan"
// membuka kotak teks di tempat, dan begitu terkirim chip "Belum dibalas" serta
// ringkasan di kanan ikut berkurang.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, type Bahasa } from "@/lib/i18n";
import { filterUlasan, type KunciFilterUlasan } from "@/lib/mitra/filter-ulasan";
import type { RingkasanUlasan, Ulasan } from "@/lib/mitra/tipe";
import { tanggalSingkat } from "@/lib/mitra/waktu";
import { HeaderHalaman, kelasTombol, kelasTombolBaris } from "./ui";

type Urutan = "terbaru" | "skor-terendah";

const TEKS = kamus({
  id: {
    csv: ["Tanggal", "Penyewa", "Unit", "Skor", "Ulasan", "Balasan"],
    berkas: "ulasan-rentalaja.csv",
    terkirim: (nama: string, sisa: number) => `Balasan untuk ${nama} terkirim. Sisa ${sisa} ulasan belum dibalas.`,
    kicker: (n: number) => `${n} ulasan · 12 bulan terakhir`,
    judul: "Ulasan",
    filter: "Filter",
    diunduh: (n: number) => `${n} ulasan diunduh sebagai CSV.`,
    unduh: "Unduh",
    daftar: "Daftar ulasan",
    saring: "Saring ulasan",
    kosong: "Tidak ada ulasan di saringan ini.",
    dari5: " dari 5",
    balasanKamu: "Balasan kamu · ",
    balasanUntuk: (nama: string) => `Balasan untuk ${nama}`,
    tulisBalasan: (nama: string) => `Tulis balasan untuk ${nama}`,
    kirim: "Kirim balasan",
    batal: "Batal",
    balas: "Balas ulasan",
    srBalas: (nama: string, unit: string) => ` dari ${nama} untuk ${unit}`,
    ringkasan: "Ringkasan",
    dariTotal: (total: number, belum: number) => `dari ${total} ulasan · ${belum} belum dibalas`,
    bintang: " bintang",
    catatan: "Rental dengan rata-rata di atas 4,8 muncul lebih dulu di hasil pencarian penyewa.",
    urutkan: "Urutkan ulasan",
    urutan: "Urutan ulasan",
    opsi: {
      terbaru: { label: "Terbaru dulu", ket: "Ulasan paling baru di atas." },
      "skor-terendah": {
        label: "Skor terendah dulu",
        ket: "Berguna saat mengejar ulasan yang perlu ditanggapi.",
      },
    },
    diganti: (label: string) => `Urutan diganti ke ${label.toLowerCase()}.`,
    tutup: "Tutup",
  },
  en: {
    csv: ["Date", "Renter", "Vehicle", "Score", "Review", "Reply"],
    berkas: "rentalaja-reviews.csv",
    terkirim: (nama: string, sisa: number) =>
      `Reply to ${nama} sent. ${sisa} ${sisa === 1 ? "review" : "reviews"} still without a reply.`,
    kicker: (n: number) => `${n} reviews · last 12 months`,
    judul: "Reviews",
    filter: "Filter",
    diunduh: (n: number) => `${n} ${n === 1 ? "review" : "reviews"} downloaded as CSV.`,
    unduh: "Download",
    daftar: "Review list",
    saring: "Filter reviews",
    kosong: "No reviews match this filter.",
    dari5: " out of 5",
    balasanKamu: "Your reply · ",
    balasanUntuk: (nama: string) => `Reply to ${nama}`,
    tulisBalasan: (nama: string) => `Write a reply to ${nama}`,
    kirim: "Send reply",
    batal: "Cancel",
    balas: "Reply to review",
    srBalas: (nama: string, unit: string) => ` from ${nama} for ${unit}`,
    ringkasan: "Summary",
    dariTotal: (total: number, belum: number) => `from ${total} reviews · ${belum} without a reply`,
    bintang: " stars",
    catatan: "Rentals averaging above 4.8 appear first in renters' search results.",
    urutkan: "Sort reviews",
    urutan: "Review order",
    opsi: {
      terbaru: { label: "Newest first", ket: "The most recent reviews at the top." },
      "skor-terendah": {
        label: "Lowest score first",
        ket: "Handy when you're catching up on reviews that need a response.",
      },
    },
    diganti: (label: string) => `Order changed to ${label.toLowerCase()}.`,
    tutup: "Close",
  },
});

/** "4,5" (id) atau "4.5" (en). */
function angka(nilai: number, bahasa: Bahasa) {
  const s = nilai.toFixed(1);
  return bahasa === "id" ? s.replace(".", ",") : s;
}

function cocok(u: Ulasan, saring: KunciFilterUlasan) {
  if (saring === "belum-dibalas") return !u.balasan;
  if (saring === "skor-rendah") return u.skor < 4;
  return true;
}

function unduhCsv(daftar: Ulasan[], bahasa: Bahasa) {
  const t = TEKS[bahasa];
  const baris = [
    t.csv,
    ...daftar.map((u) => [
      tanggalSingkat(u.tanggal, bahasa),
      u.nama,
      u.unit,
      angka(u.skor, bahasa),
      u.isi,
      u.balasan ?? "",
    ]),
  ];
  const isi = baris
    .map((k) => k.map((sel) => `"${sel.replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }));
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = t.berkas;
  tautan.click();
  URL.revokeObjectURL(url);
}

export default function UlasanPanel({
  daftar,
  ringkasan,
  filterAwal,
}: {
  daftar: Ulasan[];
  ringkasan: RingkasanUlasan;
  filterAwal: KunciFilterUlasan;
}) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [items, setItems] = useState(daftar);
  const [saring, setSaring] = useState<KunciFilterUlasan>(filterAwal);
  const [urutan, setUrutan] = useState<Urutan>("terbaru");
  const [formFilter, setFormFilter] = useState(false);
  const [sedangBalas, setSedangBalas] = useState<string | null>(null);
  const [draf, setDraf] = useState("");
  const [kabar, setKabar] = useState("");

  const belumDibalas = items.filter((u) => !u.balasan).length;
  const terlihat = items
    .filter((u) => cocok(u, saring))
    .sort((a, b) => (urutan === "terbaru" ? b.tanggal - a.tanggal : a.skor - b.skor));
  const maksDistribusi = Math.max(...ringkasan.distribusi.map((d) => d.jumlah));

  function kirimBalasan(u: Ulasan) {
    const teks = draf.trim();
    if (!teks) return;
    setItems((d) => d.map((x) => (x.id === u.id ? { ...x, balasan: teks } : x)));
    setSedangBalas(null);
    setDraf("");
    setKabar(t.terkirim(u.nama, belumDibalas - 1));
  }

  return (
    <>
      <HeaderHalaman
        kicker={t.kicker(ringkasan.total)}
        judul={t.judul}
        aksi={
          <>
            <button
              type="button"
              onClick={() => setFormFilter(true)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              {t.filter}
            </button>
            <button
              type="button"
              onClick={() => {
                unduhCsv(terlihat, bahasa);
                setKabar(t.diunduh(terlihat.length));
              }}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              {t.unduh}
            </button>
          </>
        }
      />

      <div className="mt-36 grid items-start gap-44 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64">
        <section aria-labelledby="judul-ulasan">
          <h2 id="judul-ulasan" className="sr-only">
            {t.daftar}
          </h2>

          <div role="group" aria-label={t.saring} className="flex flex-wrap gap-10">
            {filterUlasan.map((f) => {
              const jumlah = items.filter((u) => cocok(u, f.kunci)).length;
              const dipilih = f.kunci === saring;
              return (
                <button
                  key={f.kunci}
                  type="button"
                  aria-pressed={dipilih}
                  onClick={() => setSaring(f.kunci)}
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
              <p className="text-m-body text-mitra-faint">{t.kosong}</p>
            ) : (
              <ul>
                {terlihat.map((u) => (
                  <li key={u.id} className="border-t border-mitra-hairline py-26 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-16">
                      <p className="text-m-total text-mitra-ink">
                        {u.nama} · {u.unit}
                      </p>
                      <p className="shrink-0 text-m-total text-mitra-ink">
                        {angka(u.skor, bahasa)}
                        <span className="sr-only">{t.dari5}</span>
                      </p>
                    </div>
                    <p className="mt-4 text-m-label text-mitra-faint">{tanggalSingkat(u.tanggal, bahasa)}</p>
                    <p className="mt-8 max-w-620 text-m-ulasan text-mitra-muted">{u.isi}</p>

                    {u.balasan ? (
                      <p className="mt-12 max-w-620 border-l-2 border-mitra-bar-muda pl-18 text-m-ulasan text-mitra-muted">
                        <span className="text-m-tautan text-mitra-ink">{t.balasanKamu}</span>
                        {u.balasan}
                      </p>
                    ) : sedangBalas === u.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          kirimBalasan(u);
                        }}
                        className="mt-12 max-w-620"
                      >
                        <label htmlFor={`balasan-${u.id}`} className="sr-only">
                          {t.balasanUntuk(u.nama)}
                        </label>
                        <textarea
                          id={`balasan-${u.id}`}
                          value={draf}
                          rows={3}
                          onChange={(e) => setDraf(e.target.value)}
                          placeholder={t.tulisBalasan(u.nama)}
                          className="w-full rounded-m-thumb border border-mitra-border px-12 py-10 text-m-ulasan text-mitra-ink"
                        />
                        <div className="mt-10 flex gap-8">
                          <button
                            type="submit"
                            disabled={!draf.trim()}
                            className={kelasTombolBaris.primer}
                          >
                            {t.kirim}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSedangBalas(null);
                              setDraf("");
                            }}
                            className={kelasTombolBaris.sekunder}
                          >
                            {t.batal}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSedangBalas(u.id);
                          setDraf("");
                        }}
                        className="mt-12 text-m-tautan text-mitra-primer hover:underline"
                      >
                        {t.balas}
                        <span className="sr-only">{t.srBalas(u.nama, u.unit)}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="judul-ringkasan">
          <h2 id="judul-ringkasan" className="text-m-h2 text-mitra-ink">
            {t.ringkasan}
          </h2>
          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            <p className="text-m-rating text-mitra-ink">{angka(ringkasan.rata, bahasa)}</p>
            <p className="mt-4 text-m-body text-mitra-muted">{t.dariTotal(ringkasan.total, belumDibalas)}</p>

            <ul className="mt-22">
              {ringkasan.distribusi.map((d) => {
                const persen = Math.round((d.jumlah / maksDistribusi) * 100);
                return (
                  <li
                    key={d.bintang}
                    className="flex items-center gap-18 border-t border-mitra-hairline py-13"
                  >
                    <span className="w-52 shrink-0 text-m-status text-mitra-muted">
                      {d.bintang}
                      <span className="sr-only">{t.bintang}</span>
                    </span>
                    <span aria-hidden className="h-10 flex-1 rounded-pill bg-mitra-track">
                      <span
                        className={`block h-10 rounded-pill ${
                          persen >= 75 ? "bg-mitra-bar-pekat" : "bg-mitra-bar-muda"
                        }`}
                        style={{ width: `${Math.max(persen, 1)}%` }}
                      />
                    </span>
                    <span className="w-34 shrink-0 text-right text-m-angka text-mitra-ink">
                      {d.jumlah}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-20 text-m-body text-mitra-muted">
            {t.catatan}
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {formFilter && (
        <Modal judul={t.urutkan} onTutup={() => setFormFilter(false)} lebar="max-w-[420px]">
          <div role="radiogroup" aria-label={t.urutan} className="mt-14">
            {(["terbaru", "skor-terendah"] as const).map((kunci) => ({ kunci, ...t.opsi[kunci] })).map((o) => (
              <label
                key={o.kunci}
                className="flex items-start gap-10 border-t border-mitra-hairline py-14 first:border-t-0"
              >
                <input
                  type="radio"
                  name="urutan"
                  checked={urutan === o.kunci}
                  onChange={() => {
                    setUrutan(o.kunci);
                    setFormFilter(false);
                    setKabar(t.diganti(o.label));
                  }}
                  className="mt-3 size-16"
                />
                <span>
                  <span className="block text-m-status text-mitra-ink">{o.label}</span>
                  <span className="mt-2 block text-m-label text-mitra-muted">{o.ket}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-20 flex justify-end">
            <button
              type="button"
              onClick={() => setFormFilter(false)}
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
