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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import PetaLokasi from "@/components/ui/PetaLokasi";
import { useBahasa } from "@/components/BahasaProvider";
import { gantiBahasa, kamus } from "@/lib/i18n";
import {
  type Asal,
  contohIsian,
  labelDokumen,
  langkah,
  metodePembayaran,
  opsiPengambilan,
  type RingkasanPesanan,
  petunjukBerkas,
  simulasi,
} from "@/lib/mock/pemesanan";

const TEKS = kamus({
  id: {
    lengkap: "Lengkap",
    langkahKe: (n: number, ok: boolean) => `Langkah ${n}: ${ok ? "lengkap" : "belum lengkap"}`,
    terunggah: (nama: string) => `${nama} · terunggah`,
    midtrans: "Simulasi MidTrans",
    pindai: "Pindai QR untuk membayar penuh.",
    altQr: (total: string) => `Kode QR pembayaran simulasi MidTrans sebesar ${total}`,
    totalBayar: "Total bayar",
    memproses: "Memproses…",
    simulasikanBayar: "Simulasikan Payment",
    batal: "Batal",
    diterima: "Pembayaran diterima. Membuka pesanan aktif…",
    tidakNyata: "Tidak ada pembayaran sungguhan yang diproses.",
    srLengkap: " — lengkap",
    srBelum: " — belum lengkap",
    kartu1: "Tanggal dan titik antar",
    ambil: "Ambil",
    kembali: "Kembali",
    titikAntar: "Titik antar",
    caraAmbil: "Cara pengambilan unit",
    kartu2: "Dokumen",
    negara: "Kewarganegaraan",
    kyc: "Verifikasi wajah (KYC)",
    kycOk: "Wajah terverifikasi",
    kycPetunjuk: (dok: string) =>
      `Posisikan wajah di dalam bingkai, cahaya cukup, tanpa kacamata hitam. Wajahmu dicocokkan dengan foto di ${dok}.`,
    kycMulai: "Mulai verifikasi",
    kycProses: "Memeriksa wajah…",
    kycBerhasil: (dok: string) => `Wajah cocok dengan foto ${dok}.`,
    kycSelesai: "Selesai",
    kycSimulasi: "Simulasi, kamera tidak dinyalakan.",
    namaDokumen: "Nama sesuai dokumen",
    whatsapp: "Nomor WhatsApp",
    email: "Email",
    kartu3: "Bayar penuh",
    metode: "Metode pembayaran",
    simulasikan: "Simulasikan Langsung",
    simulasikanSub:
      "Mengisi seluruh kolom dengan data contoh, termasuk dokumennya. Pintasan untuk mencoba alur, bukan bagian dari produk.",
    foto: (nama: string) => `Foto ${nama}`,
    totalPembayaran: "Total Pembayaran",
    bayar: (total: string) => `Bayar ${total}`,
    menunggu: "Menunggu pembayaran di jendela MidTrans.",
    konfirmasi: "Pesanan menunggu konfirmasi penyedia maksimal 1 jam. Dana kembali penuh kalau ditolak.",
  },
  en: {
    lengkap: "Complete",
    langkahKe: (n: number, ok: boolean) => `Step ${n}: ${ok ? "complete" : "not complete"}`,
    terunggah: (nama: string) => `${nama} · uploaded`,
    midtrans: "MidTrans simulation",
    pindai: "Scan the QR code to pay in full.",
    altQr: (total: string) => `Simulated MidTrans payment QR code for ${total}`,
    totalBayar: "Total to pay",
    memproses: "Processing…",
    simulasikanBayar: "Simulate payment",
    batal: "Cancel",
    diterima: "Payment received. Opening your active booking…",
    tidakNyata: "No real payment is processed.",
    srLengkap: " — complete",
    srBelum: " — not complete",
    kartu1: "Dates and delivery point",
    ambil: "Pick-up",
    kembali: "Return",
    titikAntar: "Delivery point",
    caraAmbil: "How you get the vehicle",
    kartu2: "Documents",
    negara: "Nationality",
    kyc: "Face verification (KYC)",
    kycOk: "Face verified",
    kycPetunjuk: (dok: string) =>
      `Keep your face inside the frame, in good light, without sunglasses. It is matched against the photo on your ${dok}.`,
    kycMulai: "Start verification",
    kycProses: "Checking your face…",
    kycBerhasil: (dok: string) => `Your face matches the ${dok} photo.`,
    kycSelesai: "Done",
    kycSimulasi: "Simulation, the camera is not turned on.",
    namaDokumen: "Name as on your documents",
    whatsapp: "WhatsApp number",
    email: "Email",
    kartu3: "Pay in full",
    metode: "Payment method",
    simulasikan: "Fill in for me",
    simulasikanSub:
      "Fills every field with sample data, including the documents. A shortcut for trying the flow, not part of the product.",
    foto: (nama: string) => `Photo of ${nama}`,
    totalPembayaran: "Total Payment",
    bayar: (total: string) => `Pay ${total}`,
    menunggu: "Waiting for payment in the MidTrans window.",
    konfirmasi: "The provider has up to 1 hour to confirm. You get a full refund if they decline.",
  },
});
type Teks = (typeof TEKS)["id"];

const INPUT =
  "w-full rounded-input border border-line bg-white px-12 py-11 text-nav-strong text-ink placeholder:font-medium placeholder:text-placeholder";

function Kartu({
  nomor,
  judul,
  selesai,
  t,
  className = "",
  children,
}: {
  t: Teks;
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
          <span className="text-micro text-green-700">{t.lengkap}</span>
        )}
        <span className="sr-only">{t.langkahKe(nomor, selesai)}</span>
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
  t,
  petunjuk,
}: {
  t: Teks;
  petunjuk: string;
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
        {berkas ? t.terunggah(berkas) : petunjuk}
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
  t,
}: {
  t: Teks;
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
          {t.midtrans}
        </h2>
        <p className="mt-5 text-body-sm text-muted">{t.pindai}</p>

        <div className="relative mx-auto mt-16 size-200">
          <Image
            src="/qr-midtrans.png"
            alt={t.altQr(total)}
            fill
            sizes="200px"
            className="object-contain"
          />
        </div>

        {/* Nominal ditaruh tepat di bawah QR: pengguna harus bisa mencocokkan
            angka di aplikasi pembayaran tanpa menggulir ke mana pun. */}
        <div className="mt-14 rounded-input bg-green-100 px-12 py-10">
          <p className="text-meta text-green-800">{t.totalBayar}</p>
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
          {memproses ? t.memproses : t.simulasikanBayar}
        </button>

        {!memproses && (
          <button
            type="button"
            onClick={onTutup}
            className="mt-8 text-link-sm text-muted transition-colors duration-160 ease-base hover:text-ink"
          >
            {t.batal}
          </button>
        )}

        <p aria-live="polite" className="mt-10 text-micro text-muted">
          {memproses ? t.diterima : t.tidakNyata}
        </p>
      </div>
    </div>
  );
}

/** Rentang sewa yang sudah dipilih sebelum masuk halaman ini, sudah dalam
 *  bentuk teks siap tampil. Tidak bisa diubah di sini. */
export type PeriodeSewa = { ambil: string; kembali: string };

/** Pertanyaan asal penyewa sengaja selalu berbahasa Inggris: wisatawan asing
 *  bisa saja tiba di versi bahasa Indonesia, dan justru merekalah yang harus
 *  bisa menjawabnya. */
const TANYA_ASAL = {
  judul: "Are you a foreign visitor?",
  wni: "No, I'm Indonesian",
  wna: "Yes, I'm visiting from abroad",
};

export default function BookingForm({
  periode,
  ringkasan,
  asal,
}: {
  periode: PeriodeSewa;
  /** Unit dan rincian harga, dibangun dari unit yang diklik di layar detail. */
  ringkasan: RingkasanPesanan;
  /** Dari ?asal=. Kosong berarti belum dipilih, jadi pop-up asal tampil
   *  lebih dulu dan menentukan dokumen yang diminta di langkah 2. */
  asal: Asal | null;
}) {
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];
  const halamanPesanan = jalur("/pesanan");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [titikAntar, setTitikAntar] = useState("");
  const [pengambilan, setPengambilan] = useState<number | null>(null);

  // WNI: KTP + SIM Indonesia. WNA: paspor + IDP + SIM negara asal.
  const [ktp, setKtp] = useState<string | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  const [idp, setIdp] = useState<string | null>(null);
  const [negara, setNegara] = useState("");
  // Verifikasi wajah: belum -> proses (jeda 2 detik) -> ok. Simulasi saja.
  const [kyc, setKyc] = useState<"belum" | "proses" | "ok">("belum");
  const [bukaKyc, setBukaKyc] = useState(false);
  const [nama, setNama] = useState("");
  const label = labelDokumen[bahasa];
  // Dokumen berfoto yang dicocokkan dengan wajah penyewa.
  const dokumenWajah = asal === "wna" ? label.wna.identitas : label.wni.identitas;
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
    Boolean(
      ktp &&
        sim &&
        (asal !== "wna" || (idp && negara.trim())) &&
        kyc === "ok" &&
        nama.trim() &&
        whatsapp.trim() &&
        email.trim(),
    ),
    pembayaran !== null,
  ];
  const semuaSelesai = selesai.every(Boolean);

  // Jeda 3 detik sebelum pindah ke pesanan aktif — memberi kesan pembayaran sedang
  // diproses, bukan langsung lompat. Timer dibersihkan saat unmount supaya
  // navigasi tidak terpicu setelah pengguna meninggalkan halaman.
  useEffect(() => {
    if (tahap !== "proses") return;
    const timer = setTimeout(() => router.push(halamanPesanan), 3000);
    return () => clearTimeout(timer);
  }, [tahap, router, halamanPesanan]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!semuaSelesai || tahap !== "form") return;
    setTahap("qr");
  }

  /** Pilihan asal disimpan di URL (?asal=), jadi tetap bertahan saat halaman
   *  dimuat ulang dan bisa dibagikan. Wisatawan asing dipindah ke versi bahasa
   *  Inggris, termasuk navbar dan footer. */
  function pilihAsal(pilihan: Asal) {
    const q = new URLSearchParams(searchParams.toString());
    q.set("asal", pilihan);
    const tujuan = pilihan === "wna" ? gantiBahasa(pathname, "en") : pathname;
    router.replace(`${tujuan}?${q}`, { scroll: false });
  }

  useEffect(() => {
    if (kyc !== "proses") return;
    const timer = setTimeout(() => setKyc("ok"), 2000);
    return () => clearTimeout(timer);
  }, [kyc]);

  function tutupModal() {
    setTahap("form");
    bayarRef.current?.focus();
  }

  /** Isi seluruh form sekaligus dengan data contoh, supaya alur bisa dicoba
   *  berulang tanpa mengetik ulang. */
  function isiOtomatis() {
    setTitikAntar(simulasi.titikAntar);
    setPengambilan(simulasi.pengambilan);
    setKyc("ok");
    if (asal === "wna") {
      setKtp(simulasi.wna.identitas);
      setIdp(simulasi.wna.idp);
      setSim(simulasi.wna.sim);
      setNegara(simulasi.wna.negara);
    } else {
      setKtp(simulasi.ktp);
      setSim(simulasi.sim);
    }
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
        {langkah[bahasa].map((l, i) => (
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
                {selesai[i] ? t.srLengkap : t.srBelum}
              </span>
            </span>
            {i < langkah[bahasa].length - 1 && (
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
          <Kartu t={t} nomor={1} judul={t.kartu1} selesai={selesai[0]}>
            {/* Tanggal sudah dipilih sejak pencarian, jadi di sini hanya
                ditampilkan, bukan diisi ulang. */}
            <dl className="mt-14 grid gap-12 sm:grid-cols-2">
              {(
                [
                  [t.ambil, periode.ambil],
                  [t.kembali, periode.kembali],
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
                label={t.titikAntar}
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
              aria-label={t.caraAmbil}
              className="mt-12 flex flex-wrap gap-8"
            >
              {opsiPengambilan[bahasa].map((o, i) => (
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
            t={t}
            nomor={2}
            judul={t.kartu2}
            selesai={selesai[1]}
            className="mt-14"
          >
            <div className={`mt-14 grid gap-12 ${asal === "wna" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <Unggah
                t={t}
                petunjuk={petunjukBerkas[bahasa]}
                label={asal === "wna" ? label.wna.identitas : label.wni.identitas}
                berkas={ktp}
                onPilih={setKtp}
              />
              {asal === "wna" && (
                <Unggah
                  t={t}
                  petunjuk={petunjukBerkas[bahasa]}
                  label={label.wna.idp}
                  berkas={idp}
                  onPilih={setIdp}
                />
              )}
              <Unggah
                t={t}
                petunjuk={petunjukBerkas[bahasa]}
                label={asal === "wna" ? label.wna.sim : label.wni.sim[ringkasan.unit.kategori]}
                berkas={sim}
                onPilih={setSim}
              />
            </div>

            {/* Tombol solid, bukan kotak putus-putus seperti unggah dokumen,
                supaya terbaca sebagai langkah yang harus ditekan. */}
            {kyc === "ok" ? (
              <p className="mt-12 flex items-center justify-center gap-8 rounded-input border border-green-700 bg-green-100 py-13 text-btn text-green-700">
                ✓ {t.kycOk}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setBukaKyc(true)}
                className="mt-12 flex w-full items-center justify-center gap-10 rounded-input bg-green-700 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="size-20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                {t.kyc}
              </button>
            )}

            <div className="mt-14 grid gap-8 border-t border-line pt-12">
              {asal === "wna" ? (
                <div className="grid gap-12 sm:grid-cols-2">
                  <Isian
                    label={t.namaDokumen}
                    nilai={nama}
                    onUbah={setNama}
                    placeholder={contohIsian.nama}
                  />
                  <Isian
                    label={t.negara}
                    nilai={negara}
                    onUbah={setNegara}
                    placeholder={simulasi.wna.negara}
                  />
                </div>
              ) : (
                <Isian
                  label={t.namaDokumen}
                  nilai={nama}
                  onUbah={setNama}
                  placeholder={contohIsian.nama}
                />
              )}
              <div className="grid gap-12 sm:grid-cols-2">
                <Isian
                  label={t.whatsapp}
                  tipe="tel"
                  nilai={whatsapp}
                  onUbah={setWhatsapp}
                  placeholder={contohIsian.whatsapp}
                />
                <Isian
                  label={t.email}
                  tipe="email"
                  nilai={email}
                  onUbah={setEmail}
                  placeholder={contohIsian.email}
                />
              </div>
            </div>
          </Kartu>

          <Kartu
            t={t}
            nomor={3}
            judul={t.kartu3}
            selesai={selesai[2]}
            className="mt-14"
          >
            <div
              role="radiogroup"
              aria-label={t.metode}
              className="mt-12 grid gap-8"
            >
              {metodePembayaran[bahasa].map((m, i) => (
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
            {t.simulasikan}
          </button>
          <p className="mt-8 text-micro text-muted">{t.simulasikanSub}</p>
        </div>

        {/* Panel ringkasan sticky */}
        <aside className="rounded-card border border-line bg-surface-3 p-18 lg:sticky lg:top-76">
          <div className="flex gap-11">
            <div className="relative h-50 w-66 shrink-0 overflow-hidden rounded-input">
              <Image
                src={ringkasan.unit.foto}
                alt={t.foto(ringkasan.unit.nama)}
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

          <div className="mt-12 flex items-baseline justify-between gap-12 border-t border-line pt-12">
            <p className="text-total-label text-ink">{t.totalPembayaran}</p>
            <p className="text-total whitespace-nowrap text-ink">{ringkasan.total}</p>
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
            {t.bayar(ringkasan.total)}
          </button>

          {/* Tanpa keterangan "Lengkapi ketiga langkah..." (dihapus atas
              permintaan pemilik proyek); tombol yang mati sudah cukup. */}
          {(tahap !== "form" || semuaSelesai) && (
            <p aria-live="polite" className="mt-10 text-micro text-muted">
              {tahap !== "form" ? t.menunggu : t.konfirmasi}
            </p>
          )}
        </aside>
      </div>

      {tahap !== "form" && (
        <ModalPembayaran
          t={t}
          total={ringkasan.total}
          tahap={tahap}
          onBayar={() => setTahap("proses")}
          onTutup={tutupModal}
        />
      )}

      {/* Ditanya sebelum form bisa diisi; latarnya digelapkan pekat. Menutup
          tanpa memilih berarti batal memesan, jadi kembali ke halaman unit. */}
      {bukaKyc && (
        <Modal judul={t.kyc} onTutup={() => kyc !== "proses" && setBukaKyc(false)} lebar="max-w-[400px]">
          <div className="mt-16 grid place-items-center">
            {/* Bingkai wajah oval; hijau setelah cocok. */}
            <div
              aria-hidden
              className={`grid h-200 w-160 place-items-center rounded-[50%] border-3 border-dashed bg-surface-2 transition-colors duration-160 ease-base ${
                kyc === "ok" ? "border-green-700" : kyc === "proses" ? "animate-pulse border-green-700" : "border-line"
              }`}
            >
              <svg viewBox="0 0 40 40" className="size-96 text-placeholder">
                <circle cx="20" cy="15.5" r="7" fill="currentColor" />
                <path d="M6 38c0-8 6.3-13 14-13s14 5 14 13z" fill="currentColor" />
              </svg>
            </div>
            <p aria-live="polite" className="mt-14 text-center text-body text-muted">
              {kyc === "ok" ? t.kycBerhasil(dokumenWajah) : kyc === "proses" ? t.kycProses : t.kycPetunjuk(dokumenWajah)}
            </p>
            <button
              type="button"
              disabled={kyc === "proses"}
              onClick={() => (kyc === "ok" ? setBukaKyc(false) : setKyc("proses"))}
              className="mt-16 w-full rounded-input bg-green-700 py-11 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800 disabled:bg-surface-2 disabled:text-muted"
            >
              {kyc === "ok" ? t.kycSelesai : kyc === "proses" ? t.kycProses : t.kycMulai}
            </button>
            <p className="mt-8 text-micro text-muted">{t.kycSimulasi}</p>
          </div>
        </Modal>
      )}

      {!asal && (
        <Modal judul={TANYA_ASAL.judul} onTutup={() => router.back()} lebar="max-w-[400px]" latar="pekat">
          <div className="mt-16 grid gap-10">
            {(["wni", "wna"] as const).map((pilihan) => (
              <button
                key={pilihan}
                type="button"
                onClick={() => pilihAsal(pilihan)}
                className="rounded-input border border-line bg-white px-16 py-14 text-left text-nav-strong text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:bg-green-100"
              >
                {TANYA_ASAL[pilihan]}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </form>
  );
}
