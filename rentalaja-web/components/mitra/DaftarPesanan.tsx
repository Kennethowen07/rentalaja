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

/** Baris meta di bawah judul, bentuknya beda per status. */
function meta(p: Pesanan, sekarang: number) {
  const rentang = rentangTanggal(p.mulai, p.selesai);

  if (p.status === "pending") {
    const menit = Math.floor((sekarang - (p.masukPada ?? sekarang)) / MENIT);
    const masuk = menit < 1 ? "baru saja masuk" : `masuk ${menit} menit lalu`;
    return `${rentang} · ${jumlahHari(p.mulai, p.selesai)} hari · ${p.titik} · ${masuk}`;
  }

  if (p.status === "active") {
    const kembali = p.kembaliPada ?? p.selesai;
    const status = statusKembali(kembali, sekarang);
    if (status.telat) {
      return `${rentang} · ${status.label.toLowerCase()}${p.denda ? ` · ${p.denda}` : ""}`;
    }
    const teks = hariSama(kembali, sekarang)
      ? `kembali hari ini ${jamSaja(kembali)}`
      : `kembali ${tanggalJam(kembali)}`;
    return `${rentang} · ${teks} · ${p.plat}`;
  }

  if (p.status === "completed") {
    return `${rentang} · selesai ${tanggalSingkat(p.selesaiPada ?? p.selesai)} · ${p.plat}`;
  }

  return `${rentang} · ${p.alasan ?? "Dibatalkan"}`;
}

export default function DaftarPesanan({ tabAwal }: { tabAwal: KunciTab }) {
  const { pesanan, sekarang, terima, tolak } = usePesanan();
  const [aktif, setAktif] = useState<KunciTab>(tabAwal);
  const [konfirmasi, setKonfirmasi] = useState<Pesanan | null>(null);
  const [kontak, setKontak] = useState<Pesanan | null>(null);
  const [kabar, setKabar] = useState("");

  const status = tabPesanan.find((t) => t.kunci === aktif)!.status;
  const isi = pesanan.filter((p) => p.status === status);

  function pindahTab(e: React.KeyboardEvent) {
    const i = tabPesanan.findIndex((t) => t.kunci === aktif);
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
        aria-label="Status pesanan"
        className="mt-30 flex gap-28 overflow-x-auto border-b border-mitra-hairline"
      >
        {tabPesanan.map((t) => {
          const dipilih = t.kunci === aktif;
          const jumlah = pesanan.filter((p) => p.status === t.status).length;
          return (
            <button
              key={t.kunci}
              id={`tab-${t.kunci}`}
              type="button"
              role="tab"
              aria-selected={dipilih}
              aria-controls="panel-pesanan"
              tabIndex={dipilih ? 0 : -1}
              onClick={() => setAktif(t.kunci)}
              onKeyDown={pindahTab}
              className={`-mb-1 border-b-2 pb-14 whitespace-nowrap transition-colors duration-160 ease-base ${
                dipilih
                  ? "border-mitra-ink text-m-nav-aktif text-mitra-ink"
                  : "border-transparent text-m-nav text-mitra-faint hover:text-mitra-ink"
              }`}
            >
              {t.label}
              {t.berjumlah && ` · ${jumlah}`}
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
          <p className="text-m-body text-mitra-faint">Belum ada pesanan di tab ini.</p>
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
                  <p className="mt-5 text-m-meta text-mitra-muted">{meta(p, sekarang)}</p>
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
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          terima(p.id);
                          setKabar(
                            `Pesanan ${p.id} diterima dan dipindahkan ke tab Berjalan.`,
                          );
                        }}
                        className={kelasTombolBaris.primer}
                      >
                        Terima
                      </button>
                    </>
                  )}

                  {p.status === "active" &&
                    (statusKembali(p.kembaliPada ?? p.selesai, sekarang).telat ? (
                      <button
                        type="button"
                        onClick={() => setKontak(p)}
                        className={kelasTombolBaris.sekunder}
                      >
                        Hubungi
                      </button>
                    ) : (
                      <Link href="/mitra/serah-terima" className={kelasTombolBaris.sekunder}>
                        Buka
                      </Link>
                    ))}

                  {p.status === "completed" && (
                    <Link href="/mitra/serah-terima" className={kelasTombolBaris.sekunder}>
                      Buka
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
          judul="Tolak pesanan ini?"
          onTutup={() => setKonfirmasi(null)}
          lebar="max-w-[440px]"
        >
          <p className="mt-10 text-m-judul-baris text-mitra-ink">
            {konfirmasi.unit} · {konfirmasi.penyewa}
          </p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {rentangTanggal(konfirmasi.mulai, konfirmasi.selesai)} ·{" "}
            {jumlahHari(konfirmasi.mulai, konfirmasi.selesai)} hari · {konfirmasi.total}
          </p>
          <p className="mt-14 text-m-body text-mitra-callout">
            Penolakan tidak bisa dibatalkan. DP penyewa dikembalikan otomatis, dan unit
            kembali terlihat kosong di tanggal tersebut.
          </p>
          <div className="mt-20 flex justify-end gap-8">
            <button
              type="button"
              onClick={() => setKonfirmasi(null)}
              className={kelasTombolBaris.sekunder}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                tolak(konfirmasi.id);
                setKabar(`Pesanan ${konfirmasi.id} ditolak.`);
                setKonfirmasi(null);
              }}
              className={kelasTombolBaris.bahaya}
            >
              Tolak pesanan
            </button>
          </div>
        </Modal>
      )}

      {kontak && (
        <Modal judul="Hubungi penyewa" onTutup={() => setKontak(null)} lebar="max-w-[420px]">
          <p className="mt-10 text-m-judul-baris text-mitra-ink">{kontak.penyewa}</p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {kontak.unit} · {kontak.plat} · {meta(kontak, sekarang)}
          </p>
          <p className="mt-14 text-m-total text-mitra-ink">{kontak.telepon}</p>
          <p className="mt-6 text-m-body text-mitra-faint">
            Nomor contoh untuk prototype, bukan nomor asli.
          </p>
          <div className="mt-20 flex justify-end">
            <button
              type="button"
              onClick={() => setKontak(null)}
              className={kelasTombolBaris.primer}
            >
              Mengerti
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
