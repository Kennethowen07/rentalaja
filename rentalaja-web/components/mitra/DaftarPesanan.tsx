"use client";

// Daftar pesanan berikut tab statusnya (layar #4a). Terima dan Tolak benar
// benar mengubah keadaan: baris pindah tab, badge sidebar dan callout Beranda
// ikut berkurang, karena semuanya membaca PesananProvider yang sama.
//
// Menolak butuh konfirmasi lebih dulu (README/Interactions: tindakan tidak
// bisa dibatalkan). Dialognya memakai components/ui/Modal milik sisi penyewa
// karena perilakunya sudah benar: fokus pindah ke dialog, Escape menutup, dan
// fokus kembali ke pemicu.

import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, type Bahasa } from "@/lib/i18n";
import { tabPesanan, type KunciTab } from "@/lib/mitra/tab-pesanan";
import type { Pesanan } from "@/lib/mitra/tipe";
import {
  MENIT,
  hariSama,
  jamSaja,
  jumlahHari,
  rentangTanggal,
  statusKembali,
  tanggalJam,
  tanggalSingkat,
} from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { ThumbnailUnit, kelasTombolBaris } from "./ui";

const TEKS = kamus({
  id: {
    hari: (n: number) => `${n} hari`,
    baruMasuk: "baru saja masuk",
    masukMenit: (m: number) => `masuk ${m} menit lalu`,
    antarKe: "antar ke",
    ambilDi: "ambil di",
    kembaliHariIni: (jam: string) => `kembali hari ini ${jam}`,
    kembali: (w: string) => `kembali ${w}`,
    selesai: (w: string) => `selesai ${w}`,
    dibatalkan: "Dibatalkan",
    statusPesanan: "Status pesanan",
    kosong: "Belum ada pesanan di tab ini.",
    tolak: "Tolak",
    terima: "Terima",
    diterima: (id: string) => `Pesanan ${id} diterima dan dipindahkan ke tab Berjalan.`,
    hubungi: "Hubungi",
    buka: "Buka",
    judulTolak: "Tolak pesanan ini?",
    peringatanTolak:
      "Penolakan tidak bisa dibatalkan. Dana penyewa dikembalikan penuh dari escrow, dan unit kembali terlihat kosong di tanggal tersebut.",
    batal: "Batal",
    ditolak: (id: string) => `Pesanan ${id} ditolak.`,
    tolakPesanan: "Tolak pesanan",
    hubungiPenyewa: "Hubungi penyewa",
    nomorContoh: "Nomor contoh untuk prototype, bukan nomor asli.",
    mengerti: "Mengerti",
  },
  en: {
    hari: (n: number) => `${n} ${n === 1 ? "day" : "days"}`,
    baruMasuk: "just came in",
    masukMenit: (m: number) => `came in ${m} ${m === 1 ? "minute" : "minutes"} ago`,
    antarKe: "deliver to",
    ambilDi: "pick up at",
    kembaliHariIni: (jam: string) => `returns today ${jam}`,
    kembali: (w: string) => `returns ${w}`,
    selesai: (w: string) => `completed ${w}`,
    dibatalkan: "Cancelled",
    statusPesanan: "Booking status",
    kosong: "No bookings in this tab yet.",
    tolak: "Decline",
    terima: "Accept",
    diterima: (id: string) => `Booking ${id} accepted and moved to the Ongoing tab.`,
    hubungi: "Contact",
    buka: "Open",
    judulTolak: "Decline this booking?",
    peringatanTolak:
      "Declining can't be undone. The renter gets a full refund from escrow, and the vehicle shows as available on those dates again.",
    batal: "Cancel",
    ditolak: (id: string) => `Booking ${id} declined.`,
    tolakPesanan: "Decline booking",
    hubungiPenyewa: "Contact renter",
    nomorContoh: "Sample number for the prototype, not a real one.",
    mengerti: "Got it",
  },
});
type Teks = (typeof TEKS)["id"];

/** Baris meta di bawah judul, bentuknya beda per status. */
function meta(p: Pesanan, sekarang: number, bahasa: Bahasa, t: Teks) {
  const rentang = rentangTanggal(p.mulai, p.selesai, bahasa);

  if (p.status === "pending") {
    const menit = Math.floor((sekarang - (p.masukPada ?? sekarang)) / MENIT);
    const masuk = menit < 1 ? t.baruMasuk : t.masukMenit(menit);
    const titik = `${p.diantar ? t.antarKe : t.ambilDi} ${p.titik}`;
    return `${rentang} · ${t.hari(jumlahHari(p.mulai, p.selesai))} · ${titik} · ${masuk}`;
  }

  if (p.status === "active") {
    const kembali = p.kembaliPada ?? p.selesai;
    const status = statusKembali(kembali, sekarang, bahasa);
    if (status.telat) {
      return `${rentang} · ${status.label.toLowerCase()}${p.denda ? ` · ${p.denda}` : ""}`;
    }
    const teks = hariSama(kembali, sekarang)
      ? t.kembaliHariIni(jamSaja(kembali, bahasa))
      : t.kembali(tanggalJam(kembali, bahasa));
    return `${rentang} · ${teks} · ${p.plat}`;
  }

  if (p.status === "completed") {
    return `${rentang} · ${t.selesai(tanggalSingkat(p.selesaiPada ?? p.selesai, bahasa))} · ${p.plat}`;
  }

  return `${rentang} · ${p.alasan ?? t.dibatalkan}`;
}

export default function DaftarPesanan({ tabAwal }: { tabAwal: KunciTab }) {
  const { pesanan, sekarang, terima, tolak } = usePesanan();
  const { bahasa, jalur } = useBahasa();
  const t = TEKS[bahasa];
  const [aktif, setAktif] = useState<KunciTab>(tabAwal);
  const [konfirmasi, setKonfirmasi] = useState<Pesanan | null>(null);
  const [kontak, setKontak] = useState<Pesanan | null>(null);
  const [kabar, setKabar] = useState("");

  const status = tabPesanan.find((tab) => tab.kunci === aktif)!.status;
  const isi = pesanan.filter((p) => p.status === status);

  function pindahTab(e: React.KeyboardEvent) {
    const i = tabPesanan.findIndex((tab) => tab.kunci === aktif);
    const tujuan =
      e.key === "ArrowRight"
        ? (i + 1) % tabPesanan.length
        : e.key === "ArrowLeft"
          ? (i - 1 + tabPesanan.length) % tabPesanan.length
          : null;
    if (tujuan === null) return;
    e.preventDefault();
    setAktif(tabPesanan[tujuan].kunci);
    document.getElementById(`tab-${tabPesanan[tujuan].kunci}`)?.focus();
  }

  return (
    <>
      <div
        role="tablist"
        aria-label={t.statusPesanan}
        className="mt-30 flex gap-28 overflow-x-auto border-b border-mitra-hairline"
      >
        {tabPesanan.map((tab) => {
          const dipilih = tab.kunci === aktif;
          const jumlah = pesanan.filter((p) => p.status === tab.status).length;
          return (
            <button
              key={tab.kunci}
              id={`tab-${tab.kunci}`}
              type="button"
              role="tab"
              aria-selected={dipilih}
              aria-controls="panel-pesanan"
              tabIndex={dipilih ? 0 : -1}
              onClick={() => setAktif(tab.kunci)}
              onKeyDown={pindahTab}
              className={`-mb-1 border-b-2 pb-14 whitespace-nowrap transition-colors duration-160 ease-base ${
                dipilih
                  ? "border-mitra-ink text-m-nav-aktif text-mitra-ink"
                  : "border-transparent text-m-nav text-mitra-faint hover:text-mitra-ink"
              }`}
            >
              {tab.label[bahasa]}
              {tab.berjumlah && ` · ${jumlah}`}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-pesanan"
        aria-labelledby={`tab-${aktif}`}
        className="mt-26 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24"
      >
        {isi.length === 0 ? (
          <p className="text-m-body text-mitra-faint">{t.kosong}</p>
        ) : (
          <ul>
            {isi.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-16 border-t border-mitra-hairline py-22 first:border-t-0 min-[900px]:flex-nowrap min-[900px]:gap-22 min-[900px]:py-26"
              >
                <ThumbnailUnit foto={p.foto} nama={p.unit} />
                <div className="min-w-0 flex-1 basis-220">
                  <p className="text-m-judul-baris text-mitra-ink">
                    {p.unit} · {p.penyewa}
                  </p>
                  <p className="mt-5 text-m-meta text-mitra-muted">{meta(p, sekarang, bahasa, t)}</p>
                </div>

                <div className="shrink-0 min-[900px]:w-150 min-[900px]:text-right">
                  <p className="text-m-total text-mitra-ink">{p.total}</p>
                  <p className="mt-4 text-m-label text-mitra-faint">{p.statusBayar}</p>
                </div>

                <div className="flex shrink-0 gap-8 min-[900px]:w-190 min-[900px]:justify-end">
                  {p.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setKonfirmasi(p)}
                        className={kelasTombolBaris.sekunder}
                      >
                        {t.tolak}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          terima(p.id);
                          setKabar(t.diterima(p.id));
                        }}
                        className={kelasTombolBaris.primer}
                      >
                        {t.terima}
                      </button>
                    </>
                  )}

                  {p.status === "active" &&
                    (statusKembali(p.kembaliPada ?? p.selesai, sekarang, bahasa).telat ? (
                      <button
                        type="button"
                        onClick={() => setKontak(p)}
                        className={kelasTombolBaris.sekunder}
                      >
                        {t.hubungi}
                      </button>
                    ) : (
                      <Link href={jalur("/mitra/serah-terima")} className={kelasTombolBaris.sekunder}>
                        {t.buka}
                      </Link>
                    ))}

                  {p.status === "completed" && (
                    <Link href={jalur("/mitra/serah-terima")} className={kelasTombolBaris.sekunder}>
                      {t.buka}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {konfirmasi && (
        <Modal
          judul={t.judulTolak}
          onTutup={() => setKonfirmasi(null)}
          lebar="max-w-[440px]"
        >
          <p className="mt-10 text-m-judul-baris text-mitra-ink">
            {konfirmasi.unit} · {konfirmasi.penyewa}
          </p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {rentangTanggal(konfirmasi.mulai, konfirmasi.selesai, bahasa)} ·{" "}
            {t.hari(jumlahHari(konfirmasi.mulai, konfirmasi.selesai))} · {konfirmasi.total}
          </p>
          <p className="mt-14 text-m-body text-mitra-callout">
            {t.peringatanTolak}
          </p>
          <div className="mt-20 flex justify-end gap-8">
            <button
              type="button"
              onClick={() => setKonfirmasi(null)}
              className={kelasTombolBaris.sekunder}
            >
              {t.batal}
            </button>
            <button
              type="button"
              onClick={() => {
                tolak(konfirmasi.id);
                setKabar(t.ditolak(konfirmasi.id));
                setKonfirmasi(null);
              }}
              className={kelasTombolBaris.bahaya}
            >
              {t.tolakPesanan}
            </button>
          </div>
        </Modal>
      )}

      {kontak && (
        <Modal judul={t.hubungiPenyewa} onTutup={() => setKontak(null)} lebar="max-w-[420px]">
          <p className="mt-10 text-m-judul-baris text-mitra-ink">{kontak.penyewa}</p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {kontak.unit} · {kontak.plat} · {meta(kontak, sekarang, bahasa, t)}
          </p>
          <p className="mt-14 text-m-total text-mitra-ink">{kontak.telepon}</p>
          <p className="mt-6 text-m-body text-mitra-faint">
            {t.nomorContoh}
          </p>
          <div className="mt-20 flex justify-end">
            <button
              type="button"
              onClick={() => setKontak(null)}
              className={kelasTombolBaris.primer}
            >
              {t.mengerti}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
