"use client";

// Layar Ulasan (#4f). Balasan benar-benar bisa ditulis: tombol "Balas ulasan"
// membuka kotak teks di tempat, dan begitu terkirim chip "Belum dibalas" serta
// ringkasan di kanan ikut berkurang.

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { filterUlasan, type KunciFilterUlasan } from "@/lib/mitra/filter-ulasan";
import type { RingkasanUlasan, Ulasan } from "@/lib/mitra/tipe";
import { tanggalSingkat } from "@/lib/mitra/waktu";
import { HeaderHalaman, kelasTombol, kelasTombolBaris } from "./ui";

type Urutan = "terbaru" | "skor-terendah";

function angka(nilai: number) {
  return nilai.toFixed(1).replace(".", ",");
}

function cocok(u: Ulasan, saring: KunciFilterUlasan) {
  if (saring === "belum-dibalas") return !u.balasan;
  if (saring === "skor-rendah") return u.skor < 4;
  return true;
}

function unduhCsv(daftar: Ulasan[]) {
  const baris = [
    ["Tanggal", "Penyewa", "Unit", "Skor", "Ulasan", "Balasan"],
    ...daftar.map((u) => [
      tanggalSingkat(u.tanggal),
      u.nama,
      u.unit,
      angka(u.skor),
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
  tautan.download = "ulasan-rentalaja.csv";
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
    setKabar(`Balasan untuk ${u.nama} terkirim. Sisa ${belumDibalas - 1} ulasan belum dibalas.`);
  }

  return (
    <>
      <HeaderHalaman
        kicker={`${ringkasan.total} ulasan · 12 bulan terakhir`}
        judul="Ulasan"
        aksi={
          <>
            <button
              type="button"
              onClick={() => setFormFilter(true)}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                unduhCsv(terlihat);
                setKabar(`${terlihat.length} ulasan diunduh sebagai CSV.`);
              }}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              Unduh
            </button>
          </>
        }
      />

      <div className="mt-36 grid items-start gap-44 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64">
        <section aria-labelledby="judul-ulasan">
          <h2 id="judul-ulasan" className="sr-only">
            Daftar ulasan
          </h2>

          <div role="group" aria-label="Saring ulasan" className="flex flex-wrap gap-10">
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
                  {f.label} · {jumlah}
                </button>
              );
            })}
          </div>

          <div className="mt-22 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            {terlihat.length === 0 ? (
              <p className="text-m-body text-mitra-faint">Tidak ada ulasan di saringan ini.</p>
            ) : (
              <ul>
                {terlihat.map((u) => (
                  <li key={u.id} className="border-t border-mitra-hairline py-26 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-16">
                      <p className="text-m-total text-mitra-ink">
                        {u.nama} · {u.unit}
                      </p>
                      <p className="shrink-0 text-m-total text-mitra-ink">
                        {angka(u.skor)}
                        <span className="sr-only"> dari 5</span>
                      </p>
                    </div>
                    <p className="mt-4 text-m-label text-mitra-faint">{tanggalSingkat(u.tanggal)}</p>
                    <p className="mt-8 max-w-620 text-m-ulasan text-mitra-muted">{u.isi}</p>

                    {u.balasan ? (
                      <p className="mt-12 max-w-620 border-l-2 border-mitra-bar-muda pl-18 text-m-ulasan text-mitra-muted">
                        <span className="text-m-tautan text-mitra-ink">Balasan kamu · </span>
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
                          Balasan untuk {u.nama}
                        </label>
                        <textarea
                          id={`balasan-${u.id}`}
                          value={draf}
                          rows={3}
                          onChange={(e) => setDraf(e.target.value)}
                          placeholder={`Tulis balasan untuk ${u.nama}`}
                          className="w-full rounded-m-thumb border border-mitra-border px-12 py-10 text-m-ulasan text-mitra-ink"
                        />
                        <div className="mt-10 flex gap-8">
                          <button
                            type="submit"
                            disabled={!draf.trim()}
                            className={kelasTombolBaris.primer}
                          >
                            Kirim balasan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSedangBalas(null);
                              setDraf("");
                            }}
                            className={kelasTombolBaris.sekunder}
                          >
                            Batal
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
                        Balas ulasan
                        <span className="sr-only">
                          {" "}
                          dari {u.nama} untuk {u.unit}
                        </span>
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
            Ringkasan
          </h2>
          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            <p className="text-m-rating text-mitra-ink">{angka(ringkasan.rata)}</p>
            <p className="mt-4 text-m-body text-mitra-muted">
              dari {ringkasan.total} ulasan · {belumDibalas} belum dibalas
            </p>

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
                      <span className="sr-only"> bintang</span>
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
            Rental dengan rata-rata di atas 4,8 muncul lebih dulu di hasil pencarian penyewa.
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {formFilter && (
        <Modal judul="Urutkan ulasan" onTutup={() => setFormFilter(false)} lebar="max-w-[420px]">
          <div role="radiogroup" aria-label="Urutan ulasan" className="mt-14">
            {(
              [
                { kunci: "terbaru", label: "Terbaru dulu", ket: "Ulasan paling baru di atas." },
                {
                  kunci: "skor-terendah",
                  label: "Skor terendah dulu",
                  ket: "Berguna saat mengejar ulasan yang perlu ditanggapi.",
                },
              ] as const
            ).map((o) => (
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
                    setKabar(`Urutan diganti ke ${o.label.toLowerCase()}.`);
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
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
