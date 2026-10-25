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
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import PetaLokasi from "@/components/ui/PetaLokasi";
import {
  contohIsian,
  labelDokumen,
  langkah,
  metodePembayaran,
  opsiPengambilan,
  type RingkasanPesanan,
  petunjukBerkas,
  simulasi,
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

type Tahap = "form" | "qr" | "proses";

/** Pop-up pembayaran. Muncul setelah "Bayar penuh", menutupi halaman dengan
 *  lapisan hitam transparan (bukan pekat) supaya form di belakangnya masih
 *  terlihat samar. Pembayarannya tidak nyata — hanya simulasi alur. */
function ModalPembayaran({
  tahap,
  total,
  onBayar,
  onTutup,
}: {
  tahap: Exclude<Tahap, "form">;
  /** Nominal yang dibayar, sudah diformat. Harus sama persis dengan angka di
   *  ringkasan supaya tidak ada dua total berbeda di satu layar. */
  total: string;
  onBayar: () => void;
  onTutup: () => void;
}) {
  const tombolRef = useRef<HTMLButtonElement>(null);
  const judulId = useId();
  const memproses = tahap === "proses";

  // Fokus langsung ke aksi utama saat modal terbuka.
  useEffect(() => {
    tombolRef.current?.focus();
  }, []);

  // Escape membatalkan, tapi tidak saat pembayaran sedang diproses.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !memproses) onTutup();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [memproses, onTutup]);

  return (
    <div
      onClick={() => !memproses && onTutup()}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-20 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={judulId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-card border border-line bg-white p-24 text-center shadow-search"
      >
        <h2 id={judulId} className="text-result-head text-ink">
          Simulasi MidTrans
        </h2>
        <p className="mt-5 text-body-sm text-muted">
          Pindai QR untuk membayar penuh.
        </p>

        <div className="relative mx-auto mt-16 size-200">
          <Image
            src="/qr-midtrans.png"
            alt={`Kode QR pembayaran simulasi MidTrans sebesar ${total}`}
            fill
            sizes="200px"
            className="object-contain"
          />
        </div>

        {/* Nominal ditaruh tepat di bawah QR: pengguna harus bisa mencocokkan
            angka di aplikasi pembayaran tanpa menggulir ke mana pun. */}
        <div className="mt-14 rounded-input bg-green-100 px-12 py-10">
          <p className="text-meta text-green-800">Total bayar</p>
          <p className="mt-2 text-price-lg text-green-700">{total}</p>
        </div>

        <button
          ref={tombolRef}
          type="button"
          onClick={onBayar}
          disabled={memproses}
          className={`mt-14 w-full rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
            memproses
              ? "bg-surface-2 text-placeholder"
              : "bg-green-700 text-white hover:bg-green-800"
          }`}
        >
          {memproses ? "Memproses…" : "Simulasikan Payment"}
        </button>

        {!memproses && (
          <button
            type="button"
            onClick={onTutup}
            className="mt-8 text-link-sm text-muted transition-colors duration-160 ease-base hover:text-ink"
          >
            Batal
          </button>
        )}

        <p aria-live="polite" className="mt-10 text-micro text-muted">
          {memproses
            ? "Pembayaran diterima. Membuka pesanan aktif…"
            : "Tidak ada pembayaran sungguhan yang diproses."}
        </p>
      </div>
    </div>
  );
}

/** Rentang sewa yang sudah dipilih sebelum masuk halaman ini, sudah dalam
 *  bentuk teks siap tampil. Tidak bisa diubah di sini. */
export type PeriodeSewa = { ambil: string; kembali: string };

export default function BookingForm({
  periode,
  ringkasan,
}: {
  periode: PeriodeSewa;
  /** Unit dan rincian harga, dibangun dari unit yang diklik di layar detail. */
  ringkasan: RingkasanPesanan;
}) {
  const [titikAntar, setTitikAntar] = useState("");
  const [pengambilan, setPengambilan] = useState<number | null>(null);

  const [ktp, setKtp] = useState<string | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [pembayaran, setPembayaran] = useState<number | null>(null);
  // form -> qr (modal MidTrans terbuka) -> proses (jeda 3 detik) -> /pesanan
  const [tahap, setTahap] = useState<Tahap>("form");
  const bayarRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Satu langkah hijau hanya kalau SELURUH field miliknya terisi.
  const selesai = [
    Boolean(titikAntar.trim() && pengambilan !== null),
    Boolean(ktp && sim && nama.trim() && whatsapp.trim() && email.trim()),
    pembayaran !== null,
  ];
  const semuaSelesai = selesai.every(Boolean);

  // Jeda 3 detik sebelum pindah ke pesanan aktif — memberi kesan pembayaran sedang
  // diproses, bukan langsung lompat. Timer dibersihkan saat unmount supaya
  // navigasi tidak terpicu setelah pengguna meninggalkan halaman.
  useEffect(() => {
    if (tahap !== "proses") return;
    const timer = setTimeout(() => router.push("/pesanan"), 3000);
    return () => clearTimeout(timer);
  }, [tahap, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!semuaSelesai || tahap !== "form") return;
    setTahap("qr");
  }

  function tutupModal() {
    setTahap("form");
    bayarRef.current?.focus();
  }

  /** Isi seluruh form sekaligus dengan data contoh, supaya alur bisa dicoba
   *  berulang tanpa mengetik ulang. */
  function isiOtomatis() {
    setTitikAntar(simulasi.titikAntar);
    setPengambilan(simulasi.pengambilan);
    setKtp(simulasi.ktp);
    setSim(simulasi.sim);
    setNama(simulasi.nama);
    setWhatsapp(simulasi.whatsapp);
    setEmail(simulasi.email);
    setPembayaran(simulasi.pembayaran);
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
            {/* Tanggal sudah dipilih sejak pencarian, jadi di sini hanya
                ditampilkan, bukan diisi ulang. */}
            <dl className="mt-14 grid gap-12 sm:grid-cols-2">
              {(
                [
                  ["Ambil", periode.ambil],
                  ["Kembali", periode.kembali],
                ] as const
              ).map(([label, nilai]) => (
                <div key={label} className="rounded-input border border-line bg-white px-12 py-11">
                  <dt className="text-label text-muted">{label}</dt>
                  <dd className="mt-2 text-nav-strong text-ink">{nilai}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <Isian
                label="Titik antar"
                nilai={titikAntar}
                onUbah={setTitikAntar}
                placeholder={contohIsian.titikAntar}
              />
              {/* Dua arah: alamat yang diketik menggeser pin, klik peta atau
                  geser pin mengisi kolom titik antar. Kalau kolomnya kosong,
                  peta menunjuk alamat contoh. */}
              <PetaLokasi
                alamat={titikAntar.trim() || contohIsian.titikAntar}
                onPilihAlamat={setTitikAntar}
                className="mt-8 h-240"
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
              Untuk {ringkasan.unit.kategori}, KTP atau paspor dan{" "}
              {labelDokumen.sim[ringkasan.unit.kategori]}. Diverifikasi penyedia sebelum unit
              diantar.
            </p>

            <div className="mt-14 grid gap-12 sm:grid-cols-2">
              <Unggah
                label={labelDokumen.identitas}
                berkas={ktp}
                onPilih={setKtp}
              />
              <Unggah
                label={labelDokumen.sim[ringkasan.unit.kategori]}
                berkas={sim}
                onPilih={setSim}
              />
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
            judul="Bayar penuh"
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

          {/* Pintasan demo — bukan bagian dari desain. Ada supaya alur bisa
              dicoba berulang tanpa mengisi ulang sepuluh field. */}
          <button
            type="button"
            onClick={isiOtomatis}
            disabled={tahap !== "form"}
            className="mt-14 w-full rounded-input bg-green-700 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            Simulasikan Langsung
          </button>
          <p className="mt-8 text-micro text-muted">
            Mengisi seluruh kolom dengan data contoh, termasuk kedua dokumen.
            Pintasan untuk mencoba alur, bukan bagian dari produk.
          </p>
        </div>

        {/* Panel ringkasan sticky */}
        <aside className="rounded-card border border-line bg-surface-3 p-18 lg:sticky lg:top-76">
          <div className="flex gap-11">
            <div className="relative h-50 w-66 shrink-0 overflow-hidden rounded-input">
              <Image
                src={ringkasan.unit.foto}
                alt={`Foto ${ringkasan.unit.nama}`}
                fill
                sizes="66px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-btn-sm text-ink">{ringkasan.unit.nama}</p>
              <p className="mt-2 text-micro text-muted">
                {ringkasan.unit.penyedia} · ★ {ringkasan.unit.rating}
              </p>
            </div>
          </div>

          <dl className="mt-14 grid gap-8 border-t border-line pt-12">
            {ringkasan.rincian.map((r) => (
              <div key={r.label} className="flex justify-between gap-12">
                <dt className="text-row text-muted">{r.label}</dt>
                <dd className="text-row-value text-ink">{r.nilai}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 border-t border-line pt-12">
            <div className="flex items-baseline justify-between gap-12">
              <p className="text-total-label text-ink">Dibayar penuh sekarang</p>
              <p className="text-total text-ink">{ringkasan.total}</p>
            </div>
            <div className="mt-6 flex justify-between gap-12 text-body-sm text-muted">
              <span>Ditahan rentalaja sampai unit kembali</span>
              <span>{ringkasan.total}</span>
            </div>
            <div className="mt-4 flex justify-between gap-12 text-body-sm text-muted">
              <span>Deposit tunai ke pemilik</span>
              <span>Tidak ada</span>
            </div>
          </div>

          <button
            ref={bayarRef}
            type="submit"
            disabled={!semuaSelesai || tahap !== "form"}
            className={`mt-14 w-full rounded-input py-13 text-btn transition-colors duration-160 ease-base ${
              semuaSelesai && tahap === "form"
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-surface-2 text-placeholder"
            }`}
          >
            Bayar {ringkasan.total}
          </button>

          <p aria-live="polite" className="mt-10 text-micro text-muted">
            {tahap !== "form"
              ? "Menunggu pembayaran di jendela MidTrans."
              : semuaSelesai
                ? "Pesanan menunggu konfirmasi penyedia maksimal 1 jam. Dana kembali penuh kalau ditolak."
                : `Lengkapi ketiga langkah di atas untuk melanjutkan. Sisa ${
                    selesai.filter((s) => !s).length
                  } langkah.`}
          </p>
        </aside>
      </div>

      {tahap !== "form" && (
        <ModalPembayaran
          total={ringkasan.total}
          tahap={tahap}
          onBayar={() => setTahap("proses")}
          onTutup={tutupModal}
        />
      )}
    </form>
  );
}
