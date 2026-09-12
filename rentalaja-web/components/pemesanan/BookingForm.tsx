"use client";

// Layar 4 · Pemesanan.
//
// Form mulai KOSONG dan benar-benar bisa diisi. Stepper di atas bukan
// navigasi: tiap langkah abu sampai seluruh field miliknya terisi, lalu
// menghijau. Tombol bayar baru aktif setelah ketiganya hijau.
//
// Status "lengkap" SENGAJA tidak disampaikan lewat warna saja. Tiap kartu
// membawa tiga sinyal sekaligus:
//   1. nomor langkah berubah jadi tanda centang  (bentuk)
//   2. label teks "Lengkap" muncul               (teks)
//   3. latar dan border berubah                  (warna + terang-gelap)
// Sinyal 1 dan 2 tetap terbaca oleh pengguna buta warna, dan nomor itu juga
// yang mengikat tiap kartu ke langkah di stepper — bukan hue-nya.
//
// Berkas yang dipilih tidak diunggah ke mana pun — hanya namanya yang
// dibaca di memori, cukup untuk prototype.

import Image from "next/image";
import { useId, useState } from "react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import {
  contohIsian,
  labelDokumen,
  langkah,
  metodePembayaran,
  opsiPengambilan,
  pesanan,
  petunjukBerkas,
} from "@/lib/mock/pemesanan";

const INPUT =
  "w-full rounded-input border border-line bg-white px-12 py-11 text-nav-strong text-ink placeholder:font-medium placeholder:text-placeholder";

function Kartu({
  nomor,
  judul,
  selesai,
  className = "",
  children,
}: {
  nomor: number;
  judul: string;
  selesai: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-card border p-18 transition-colors duration-160 ease-base ${
        selesai ? "border-green-700 bg-green-50" : "border-line bg-surface-3"
      } ${className}`}
    >
      <div className="flex items-center gap-10">
        <span
          aria-hidden
          className={`grid size-28 shrink-0 place-items-center rounded-input text-badge transition-colors duration-160 ease-base ${
            selesai ? "bg-green-700 text-white" : "bg-surface-2 text-muted"
          }`}
        >
          {selesai ? "✓" : nomor}
        </span>
        <h2 className="text-result-head text-ink">{judul}</h2>
        {selesai && (
          <span className="text-micro text-green-700">Lengkap</span>
        )}
        <span className="sr-only">
          Langkah {nomor}: {selesai ? "lengkap" : "belum lengkap"}
        </span>
      </div>
      {children}
    </section>
  );
}

function Isian({
  label,
  tipe = "text",
  nilai,
  onUbah,
  placeholder,
}: {
  label: string;
  tipe?: string;
  nilai: string;
  onUbah: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-6 block text-label text-muted">
        {label}
      </label>
      <input
        id={id}
        type={tipe}
        value={nilai}
        placeholder={placeholder}
        onChange={(e) => onUbah(e.target.value)}
        className={INPUT}
      />
    </div>
  );
}

function Unggah({
  label,
  berkas,
  onPilih,
}: {
  label: string;
  berkas: string | null;
  onPilih: (nama: string | null) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`block cursor-pointer rounded-result border border-dashed p-18 text-center transition-colors duration-160 ease-base ${
        berkas
          ? "border-green-700 bg-green-100"
          : "border-line bg-white hover:border-green-700"
      }`}
    >
      <span
        className={`block text-cta-sm ${berkas ? "text-green-700" : "text-ink"}`}
      >
        {berkas ? `✓ ${label}` : label}
      </span>
      <span
        className={`mt-3 block text-micro ${
          berkas ? "text-green-800" : "text-muted"
        }`}
      >
        {berkas ? `${berkas} · terunggah` : petunjukBerkas}
      </span>
      <input
        id={id}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => onPilih(e.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}

export default function BookingForm() {
  const [ambil, setAmbil] = useState("");
  const [kembali, setKembali] = useState("");
  const [titikAntar, setTitikAntar] = useState("");
  const [pengambilan, setPengambilan] = useState<number | null>(null);

  const [ktp, setKtp] = useState<string | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [pembayaran, setPembayaran] = useState<number | null>(null);
  const [terkirim, setTerkirim] = useState(false);

  // Satu langkah hijau hanya kalau SELURUH field miliknya terisi.
  const selesai = [
    Boolean(ambil && kembali && titikAntar.trim() && pengambilan !== null),
    Boolean(ktp && sim && nama.trim() && whatsapp.trim() && email.trim()),
    pembayaran !== null,
  ];
  const semuaSelesai = selesai.every(Boolean);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!semuaSelesai) return;
    setTerkirim(true);
  }

  return (
    <form onSubmit={onSubmit} className="container-page pt-20 pb-28">
      {/* Stepper — abu sampai langkahnya lengkap, lalu hijau.
          Centang ✓ menggantikan nomor supaya statusnya terbaca tanpa warna. */}
      <ol className="mb-20 flex items-center gap-10">
        {langkah.map((l, i) => (
          <li key={l} className="flex flex-1 items-center gap-10 last:flex-none">
            <span
              className={`rounded-pill px-13 py-6 transition-colors duration-160 ease-base ${
                selesai[i]
                  ? "bg-green-100 text-step text-green-700"
                  : "border border-line text-filter text-muted"
              }`}
            >
              {selesai[i] ? `✓ ${l.replace(/^\d+ · /, "")}` : l}
              <span className="sr-only">
                {selesai[i] ? " — lengkap" : " — belum lengkap"}
              </span>
            </span>
            {i < langkah.length - 1 && (
              <span
                aria-hidden
                className={`h-2 flex-1 transition-colors duration-160 ease-base ${
                  selesai[i] ? "bg-green-700" : "bg-line"
                }`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-24 lg:grid-cols-[1fr_320px]">
        <div>
          <Kartu nomor={1} judul="Tanggal dan titik antar" selesai={selesai[0]}>
            <div className="mt-14 grid gap-12 sm:grid-cols-2">
              <Isian
                label="Ambil"
                tipe="datetime-local"
                nilai={ambil}
                onUbah={setAmbil}
              />
              <Isian
                label="Kembali"
                tipe="datetime-local"
                nilai={kembali}
                onUbah={setKembali}
              />
            </div>

            <div className="mt-12">
              <Isian
                label="Titik antar"
                nilai={titikAntar}
                onUbah={setTitikAntar}
                placeholder={contohIsian.titikAntar}
              />
              <ImagePlaceholder
                label="potongan peta"
                className="mt-8 h-96 rounded-input"
              />
            </div>

            <div
              role="group"
              aria-label="Cara pengambilan unit"
              className="mt-12 flex flex-wrap gap-8"
            >
              {opsiPengambilan.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={i === pengambilan}
                  onClick={() => setPengambilan(i)}
                  className={`rounded-input border px-13 py-8 text-filter transition-colors duration-160 ease-base ${
                    i === pengambilan
                      ? "border-green-700 bg-green-100 text-green-700"
                      : "border-line bg-white text-muted hover:border-green-700"
                  }`}
                >
                  {i === pengambilan ? `✓ ${o}` : o}
                </button>
              ))}
            </div>
          </Kartu>

          <Kartu
            nomor={2}
            judul="Dokumen"
            selesai={selesai[1]}
            className="mt-14"
          >
            <p className="mt-4 text-body-sm text-muted">
              Untuk motor, KTP atau paspor dan SIM C. Diverifikasi penyedia
              sebelum unit diantar.
            </p>

            <div className="mt-14 grid gap-12 sm:grid-cols-2">
              <Unggah
                label={labelDokumen.identitas}
                berkas={ktp}
                onPilih={setKtp}
              />
              <Unggah label={labelDokumen.sim} berkas={sim} onPilih={setSim} />
            </div>

            <div className="mt-14 grid gap-8 border-t border-line pt-12">
              <Isian
                label="Nama sesuai dokumen"
                nilai={nama}
                onUbah={setNama}
                placeholder={contohIsian.nama}
              />
              <div className="grid gap-12 sm:grid-cols-2">
                <Isian
                  label="Nomor WhatsApp"
                  tipe="tel"
                  nilai={whatsapp}
                  onUbah={setWhatsapp}
                  placeholder={contohIsian.whatsapp}
                />
                <Isian
                  label="Email"
                  tipe="email"
                  nilai={email}
                  onUbah={setEmail}
                  placeholder={contohIsian.email}
                />
              </div>
            </div>
          </Kartu>

          <Kartu
            nomor={3}
            judul="Bayar DP"
            selesai={selesai[2]}
            className="mt-14"
          >
            <div
              role="radiogroup"
              aria-label="Metode pembayaran"
              className="mt-12 grid gap-8"
            >
              {metodePembayaran.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={i === pembayaran}
                  onClick={() => setPembayaran(i)}
                  className={`rounded-input border p-12 text-left transition-colors duration-160 ease-base ${
                    i === pembayaran
                      ? "border-green-700 bg-green-100 text-tab text-green-700"
                      : "border-line bg-white text-nav-strong text-ink hover:border-green-700"
                  }`}
                >
                  {i === pembayaran ? `✓ ${m}` : m}
                </button>
              ))}
            </div>
          </Kartu>
        </div>

        {/* Panel ringkasan sticky */}
        <aside className="rounded-card border border-line bg-surface-3 p-18 lg:sticky lg:top-76">
          <div className="flex gap-11">
            <div className="relative h-50 w-66 shrink-0 overflow-hidden rounded-input">
              <Image
                src={pesanan.unit.foto}
                alt={`Foto ${pesanan.unit.nama}`}
                fill
                sizes="66px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-btn-sm text-ink">{pesanan.unit.nama}</p>
              <p className="mt-2 text-micro text-muted">
                {pesanan.unit.penyedia} · ★ {pesanan.unit.rating}
              </p>
            </div>
          </div>

          <dl className="mt-14 grid gap-8 border-t border-line pt-12">
            {pesanan.rincian.map((r) => (
              <div key={r.label} className="flex justify-between gap-12">
                <dt className="text-row text-muted">{r.label}</dt>
                <dd className="text-row-value text-ink">{r.nilai}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 border-t border-line pt-12">
            <div className="flex items-baseline justify-between gap-12">
              <p className="text-total-label text-ink">DP dibayar sekarang</p>
              <p className="text-total text-ink">{pesanan.dp}</p>
            </div>
            <div className="mt-6 flex justify-between gap-12 text-body-sm text-muted">
              <span>Sisa tunai saat serah terima</span>
              <span>{pesanan.sisa}</span>
            </div>
            <div className="mt-4 flex justify-between gap-12 text-body-sm text-muted">
              <span>Deposit tunai, dikembalikan</span>
              <span>{pesanan.deposit}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!semuaSelesai}
            className={`mt-14 w-full rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
              semuaSelesai
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-surface-2 text-placeholder"
            }`}
          >
            Bayar DP {pesanan.dp}
          </button>

          <p aria-live="polite" className="mt-10 text-micro text-muted">
            {terkirim
              ? "Pesanan terkirim. Menunggu konfirmasi penyedia."
              : semuaSelesai
                ? "Pesanan menunggu konfirmasi penyedia maksimal 1 jam. DP kembali penuh kalau ditolak."
                : `Lengkapi ketiga langkah di atas untuk melanjutkan. Sisa ${
                    selesai.filter((s) => !s).length
                  } langkah.`}
          </p>
        </aside>
      </div>
    </form>
  );
}
