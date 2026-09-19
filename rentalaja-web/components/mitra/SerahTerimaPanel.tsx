"use client";

// Layar Serah terima (#4d). Tiga tab, jadwal hari ini di kiri, dan di
// bawahnya foto empat sisi milik baris yang sedang dipilih. Kolom kanan
// berisi catatan kondisi baris yang sama.
//
// Serah terima berfoto adalah salah satu pembeda produk (lihat project-brief),
// jadi alurnya dibuat benar-benar jalan: pilih baris, catat kondisi lewat
// form, dan begitu empat sisi terisi barisnya pindah ke tab Selesai.

import Image from "next/image";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { tabSerah, type KunciTabSerah } from "@/lib/mitra/tab-serah";
import type { SerahTerima } from "@/lib/mitra/tipe";
import { hariSama, jamSaja, statusKembali, tanggalSingkat } from "@/lib/mitra/waktu";
import { HeaderHalaman, ThumbnailUnit, kelasTombol, kelasTombolBaris } from "./ui";

const SISI = ["depan", "belakang", "kiri", "kanan"];

function judul(item: SerahTerima) {
  return `${item.jenis === "antar" ? "Antar" : "Ambil kembali"} · ${item.unit}`;
}

function meta(item: SerahTerima, sekarang: number) {
  if (item.telat) {
    const { label } = statusKembali(item.waktu, sekarang);
    return `${item.penyewa} · ${label.toLowerCase()}${item.catatan ? ` · ${item.catatan}` : ""}`;
  }
  // Jadwal di hari lain selalu menyebut tanggal, supaya "16.00" tidak terbaca
  // seolah hari ini.
  const waktu = hariSama(item.waktu, sekarang)
    ? jamSaja(item.waktu)
    : `${tanggalSingkat(item.waktu)} ${jamSaja(item.waktu)}`;
  return `${item.penyewa} · ${waktu} · ${item.titik}${item.catatan ? ` · ${item.catatan}` : ""}`;
}

export default function SerahTerimaPanel({
  daftar,
  sekarang,
  tabAwal,
  kicker,
}: {
  daftar: SerahTerima[];
  sekarang: number;
  tabAwal: KunciTabSerah;
  kicker: string;
}) {
  const [items, setItems] = useState(daftar);
  const [tab, setTab] = useState<KunciTabSerah>(tabAwal);
  const [idTerpilih, setIdTerpilih] = useState(
    daftar.find((d) => d.status === "selesai")?.id ?? daftar[0]?.id,
  );
  const [kontak, setKontak] = useState<SerahTerima | null>(null);
  const [formKondisi, setFormKondisi] = useState<SerahTerima | null>(null);
  const [kabar, setKabar] = useState("");

  const status = tabSerah.find((t) => t.kunci === tab)!.status;
  const isi = items.filter((i) => i.status === status);
  const terpilih = items.find((i) => i.id === idTerpilih) ?? items[0];
  const lengkap = terpilih?.sisi.every((s) => s.foto) ?? false;

  function pindahTab(e: React.KeyboardEvent) {
    const i = tabSerah.findIndex((t) => t.kunci === tab);
    const tujuan =
      e.key === "ArrowRight"
        ? (i + 1) % tabSerah.length
        : e.key === "ArrowLeft"
          ? (i - 1 + tabSerah.length) % tabSerah.length
          : null;
    if (tujuan === null) return;
    e.preventDefault();
    setTab(tabSerah[tujuan].kunci);
    document.getElementById(`tab-${tabSerah[tujuan].kunci}`)?.focus();
  }

  function perbarui(id: string, ubah: (i: SerahTerima) => SerahTerima) {
    setItems((d) => d.map((i) => (i.id === id ? ubah(i) : i)));
  }

  function simulasikanFoto(item: SerahTerima) {
    perbarui(item.id, (i) => ({
      ...i,
      sisi: SISI.map((label) => ({ label, foto: `/serah-terima/scoopy-${label}.webp` })),
      status: i.kondisi.length > 0 ? "selesai" : "menunggu-foto",
    }));
    setKabar(`Empat foto ${item.unit} terunggah.`);
  }

  function simpanKondisi(item: SerahTerima, kondisi: { label: string; nilai: string }[]) {
    const fotoLengkap = item.sisi.every((s) => s.foto);
    perbarui(item.id, (i) => ({
      ...i,
      kondisi,
      status: fotoLengkap ? "selesai" : "menunggu-foto",
    }));
    setIdTerpilih(item.id);
    setFormKondisi(null);
    setKabar(
      fotoLengkap
        ? `Serah terima ${item.unit} selesai dicatat.`
        : `Kondisi ${item.unit} tercatat. Empat foto masih kurang.`,
    );
  }

  return (
    <>
      <HeaderHalaman
        kicker={kicker}
        judul="Serah terima"
        aksi={
          <>
            <button
              type="button"
              onClick={() => setTab("selesai")}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              Riwayat
            </button>
            <button
              type="button"
              disabled={!terpilih}
              onClick={() => terpilih && setFormKondisi(terpilih)}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              Mulai serah terima
            </button>
          </>
        }
      />

      <div
        role="tablist"
        aria-label="Status serah terima"
        className="mt-30 flex gap-28 overflow-x-auto border-b border-mitra-hairline"
      >
        {tabSerah.map((t) => {
          const dipilih = t.kunci === tab;
          const jumlah = items.filter((i) => i.status === t.status).length;
          return (
            <button
              key={t.kunci}
              id={`tab-${t.kunci}`}
              type="button"
              role="tab"
              aria-selected={dipilih}
              aria-controls="panel-serah"
              tabIndex={dipilih ? 0 : -1}
              onClick={() => setTab(t.kunci)}
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
        id="panel-serah"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-36 grid items-start gap-36 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64"
      >
        <section aria-labelledby="judul-jadwal">
          <h2 id="judul-jadwal" className="text-m-h2 text-mitra-ink">
            {tab === "hari-ini" ? "Jadwal hari ini" : tabSerah.find((t) => t.kunci === tab)!.label}
          </h2>

          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            {isi.length === 0 ? (
              <p className="text-m-body text-mitra-faint">Belum ada serah terima di tab ini.</p>
            ) : (
              <ul>
                {isi.map((item) => (
                  <li
                    key={item.id}
                    aria-current={item.id === idTerpilih ? "true" : undefined}
                    className="flex flex-wrap items-center gap-16 border-t border-mitra-hairline py-22 first:border-t-0 min-[640px]:flex-nowrap min-[640px]:gap-22 min-[640px]:py-26"
                  >
                    <ThumbnailUnit foto={item.foto} nama={item.unit} />
                    <div className="min-w-0 flex-1 basis-200">
                      <p className="text-m-judul-baris text-mitra-ink">{judul(item)}</p>
                      <p
                        className={`mt-5 text-m-meta ${item.telat ? "text-mitra-plum" : "text-mitra-muted"}`}
                      >
                        {meta(item, sekarang)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {item.telat ? (
                        <button
                          type="button"
                          onClick={() => setKontak(item)}
                          className={kelasTombolBaris.sekunder}
                        >
                          Hubungi
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIdTerpilih(item.id)}
                          className={
                            item.id === idTerpilih
                              ? kelasTombolBaris.primer
                              : kelasTombolBaris.sekunder
                          }
                        >
                          Buka
                          <span className="sr-only"> {judul(item)}</span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {terpilih && (
            <>
              <h2 className="mt-44 text-m-h2 text-mitra-ink">
                Foto serah terima · {terpilih.unit}
              </h2>
              <p className="mt-8 text-m-body text-mitra-muted">
                {lengkap
                  ? `Diambil ${tanggalSingkat(terpilih.waktu)} ${jamSaja(terpilih.waktu)} bersama ${terpilih.penyewa}. Jadi acuan saat pengembalian.`
                  : `Belum ada foto. Empat sisi wajib difoto bersama ${terpilih.penyewa} sebelum unit berpindah tangan.`}
              </p>

              <ul className="mt-18 flex flex-wrap gap-14">
                {terpilih.sisi.map((s) => (
                  <li
                    key={s.label}
                    className="relative h-120 min-w-140 flex-1 overflow-hidden rounded-m-tombol bg-mitra-panel"
                  >
                    {s.foto && (
                      <Image
                        src={s.foto}
                        alt={`${terpilih.unit} tampak ${s.label}`}
                        fill
                        sizes="(max-width: 1100px) 45vw, 200px"
                        className="object-cover"
                      />
                    )}
                    <span
                      className={`absolute bottom-10 left-10 rounded-[4px] px-6 text-m-sublogo ${
                        s.foto ? "bg-mitra-ink/70 text-white" : "text-mitra-faint"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>

              {!lengkap &&
                (terpilih.unit.includes("Scoopy") ? (
                  <button
                    type="button"
                    onClick={() => simulasikanFoto(terpilih)}
                    className={`${kelasTombolBaris.sekunder} mt-14`}
                  >
                    Simulasikan unggah foto
                  </button>
                ) : (
                  // Foto contoh empat sisi baru ada untuk Scoopy. Mengisi slot
                  // unit lain dengan foto Scoopy akan menampilkan unit yang
                  // salah, jadi tombolnya sengaja tidak ditawarkan.
                  <p className="mt-14 text-m-label text-mitra-faint">
                    Foto contoh empat sisi baru tersedia untuk Honda Scoopy.
                  </p>
                ))}
            </>
          )}
        </section>

        <section aria-labelledby="judul-kondisi">
          <h2 id="judul-kondisi" className="text-m-h2 text-mitra-ink">
            Catatan kondisi
          </h2>
          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            {terpilih && terpilih.kondisi.length > 0 ? (
              <dl>
                {terpilih.kondisi.map((k) => (
                  <div
                    key={k.label}
                    className="flex justify-between gap-16 border-t border-mitra-hairline py-14 first:border-t-0"
                  >
                    <dt className="text-m-meta text-mitra-muted">{k.label}</dt>
                    <dd className="text-m-angka text-mitra-ink">{k.nilai}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-m-body text-mitra-faint">
                Belum dicatat. Tekan &quot;Mulai serah terima&quot; untuk mengisi odometer,
                bensin, dan kelengkapan.
              </p>
            )}
          </div>
          <p className="mt-20 text-m-body text-mitra-muted">
            Kedua pihak menyetujui foto lewat aplikasi. Selisih kondisi saat kembali otomatis
            dibandingkan dengan foto ini.
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {kontak && (
        <Modal judul="Hubungi penyewa" onTutup={() => setKontak(null)} lebar="max-w-[420px]">
          <p className="mt-10 text-m-judul-baris text-mitra-ink">{kontak.penyewa}</p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {judul(kontak)} · {kontak.plat}
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

      {formKondisi && (
        <FormKondisi
          item={formKondisi}
          onTutup={() => setFormKondisi(null)}
          onSimpan={(kondisi) => simpanKondisi(formKondisi, kondisi)}
        />
      )}
    </>
  );
}

function FormKondisi({
  item,
  onTutup,
  onSimpan,
}: {
  item: SerahTerima;
  onTutup: () => void;
  onSimpan: (kondisi: { label: string; nilai: string }[]) => void;
}) {
  const awal = (label: string, bawaan: string) =>
    item.kondisi.find((k) => k.label === label)?.nilai ?? bawaan;

  const [odometer, setOdometer] = useState(awal("Odometer", "").replace(" km", ""));
  const [bensin, setBensin] = useState(awal("Bensin", "Penuh"));
  const [kelengkapan, setKelengkapan] = useState(awal("Helm", "2 · jas hujan 1"));
  const [goresan, setGoresan] = useState(awal("Goresan tercatat", "Tidak ada"));

  const angka = Number(odometer.replace(/\D/g, ""));
  const valid = angka > 0;
  const kelasIsian =
    "mt-6 w-full rounded-m-thumb border border-mitra-border px-12 py-9 text-m-status text-mitra-ink";

  return (
    <Modal judul="Catat kondisi unit" onTutup={onTutup} lebar="max-w-[440px]">
      <p className="mt-10 text-m-judul-baris text-mitra-ink">{judul(item)}</p>
      <p className="mt-4 text-m-meta text-mitra-muted">
        {item.plat} · {item.penyewa}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSimpan([
            { label: "Odometer", nilai: `${new Intl.NumberFormat("id-ID").format(angka)} km` },
            { label: "Bensin", nilai: bensin },
            { label: "Helm", nilai: kelengkapan },
            { label: "Goresan tercatat", nilai: goresan.trim() || "Tidak ada" },
          ]);
        }}
      >
        <label htmlFor="odometer" className="mt-18 block text-m-label text-mitra-muted">
          Odometer (km)
        </label>
        <input
          id="odometer"
          inputMode="numeric"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          className={kelasIsian}
        />

        <label htmlFor="bensin" className="mt-14 block text-m-label text-mitra-muted">
          Bensin
        </label>
        <select
          id="bensin"
          value={bensin}
          onChange={(e) => setBensin(e.target.value)}
          className={kelasIsian}
        >
          <option>Penuh</option>
          <option>Tiga perempat</option>
          <option>Setengah</option>
          <option>Seperempat</option>
          <option>Hampir habis</option>
        </select>

        <label htmlFor="kelengkapan" className="mt-14 block text-m-label text-mitra-muted">
          Kelengkapan
        </label>
        <input
          id="kelengkapan"
          value={kelengkapan}
          onChange={(e) => setKelengkapan(e.target.value)}
          className={kelasIsian}
        />

        <label htmlFor="goresan" className="mt-14 block text-m-label text-mitra-muted">
          Goresan tercatat
        </label>
        <input
          id="goresan"
          value={goresan}
          onChange={(e) => setGoresan(e.target.value)}
          className={kelasIsian}
        />

        <p className="mt-10 text-m-label text-mitra-muted">
          {valid ? "Catatan ini jadi acuan saat unit dikembalikan." : "Odometer harus diisi angka."}
        </p>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            Batal
          </button>
          <button type="submit" disabled={!valid} className={kelasTombolBaris.primer}>
            Simpan catatan
          </button>
        </div>
      </form>
    </Modal>
  );
}
