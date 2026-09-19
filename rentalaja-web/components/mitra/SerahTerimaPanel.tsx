"use client";

// Layar Serah terima (#4d).
//
// Jadwalnya diturunkan dari pesanan berjalan, bukan disimpan terpisah:
// pesanan yang mulai hari ini memunculkan baris "Antar", yang jatuh tempo
// hari ini memunculkan "Ambil kembali", dan yang lewat jadwal ditandai plum.
// Akibatnya, menerima pesanan di layar Pesanan langsung menambah jadwal di
// sini. Yang disimpan hanya catatannya: empat foto dan kondisi unit.
//
// Serah terima berfoto adalah salah satu pembeda produk (lihat project-brief),
// jadi alurnya dibuat benar-benar jalan sampai baris pindah ke tab Selesai.

import Image from "next/image";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { rupiah } from "@/lib/mitra/format";
import { tabSerah, type KunciTabSerah } from "@/lib/mitra/tab-serah";
import type { CatatanSerah, JadwalSerah, Pesanan, StatusSerah } from "@/lib/mitra/tipe";
import { awalHari, hariSama, jamSaja, statusKembali, tanggalSingkat } from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { HeaderHalaman, ThumbnailUnit, kelasTombol, kelasTombolBaris } from "./ui";

const SISI = ["depan", "belakang", "kiri", "kanan"];
const sisiKosong = () => SISI.map((label) => ({ label, foto: null }));

function judul(item: JadwalSerah) {
  return `${item.jenis === "antar" ? "Antar" : "Ambil kembali"} · ${item.unit}`;
}

function meta(item: JadwalSerah, sekarang: number) {
  if (item.telat) {
    const { label } = statusKembali(item.waktu, sekarang);
    return `${item.penyewa} · ${label.toLowerCase()}${item.catatan ? ` · ${item.catatan}` : ""}`;
  }
  // Jadwal di hari lain selalu menyebut tanggal, supaya "16.00" tidak terbaca
  // seolah hari ini.
  const waktu = hariSama(item.waktu, sekarang)
    ? jamSaja(item.waktu)
    : `${tanggalSingkat(item.waktu)} ${jamSaja(item.waktu)}`;
  return `${item.penyewa} · ${waktu} · ${item.titik}`;
}

function statusDari(c: CatatanSerah): StatusSerah {
  const fotoLengkap = c.sisi.every((s) => s.foto);
  const adaKondisi = c.kondisi.length > 0;
  if (fotoLengkap && adaKondisi) return "selesai";
  if (fotoLengkap || adaKondisi) return "menunggu-foto";
  return "jadwal";
}

/** Satu pesanan berjalan bisa memunculkan dua baris: antar dan ambil kembali. */
function jadwalDariPesanan(
  pesanan: Pesanan[],
  catatan: Record<string, CatatanSerah>,
  sekarang: number,
): JadwalSerah[] {
  const hariIni = awalHari(sekarang);
  const hasil: JadwalSerah[] = [];

  for (const p of pesanan) {
    if (p.status !== "active") continue;
    const kembali = p.kembaliPada ?? p.selesai;

    const peristiwa: { jenis: "antar" | "ambil"; waktu: number; telat: boolean }[] = [];
    if (awalHari(p.mulai) === hariIni) {
      peristiwa.push({ jenis: "antar", waktu: p.mulai, telat: false });
    }
    if (awalHari(kembali) === hariIni) {
      peristiwa.push({ jenis: "ambil", waktu: kembali, telat: false });
    } else if (awalHari(kembali) < hariIni) {
      // Belum dikembalikan, jadi tetap muncul di jadwal sampai selesai.
      peristiwa.push({ jenis: "ambil", waktu: kembali, telat: true });
    }

    for (const e of peristiwa) {
      const id = `${p.id}-${e.jenis}`;
      const tercatat = catatan[id] ?? { sisi: sisiKosong(), kondisi: [] };
      hasil.push({
        ...tercatat,
        id,
        pesananId: p.id,
        jenis: e.jenis,
        unit: p.unit,
        plat: p.plat,
        foto: p.foto,
        penyewa: p.penyewa,
        telepon: p.telepon,
        waktu: e.waktu,
        titik: p.titik ?? "Kantor rental",
        catatan: e.telat ? "belum ada konfirmasi" : undefined,
        telat: e.telat,
        status: statusDari(tercatat),
      });
    }
  }

  return hasil.sort((a, b) => a.waktu - b.waktu);
}

export default function SerahTerimaPanel({
  catatanAwal,
  tabAwal,
  kicker,
}: {
  catatanAwal: Record<string, CatatanSerah>;
  tabAwal: KunciTabSerah;
  kicker: string;
}) {
  const { pesanan, sekarang } = usePesanan();
  const [catatan, setCatatan] = useState(catatanAwal);
  const [tab, setTab] = useState<KunciTabSerah>(tabAwal);
  const [idTerpilih, setIdTerpilih] = useState<string | null>(null);
  const [kontak, setKontak] = useState<JadwalSerah | null>(null);
  const [formKondisi, setFormKondisi] = useState<JadwalSerah | null>(null);
  const [kabar, setKabar] = useState("");

  const jadwal = jadwalDariPesanan(pesanan, catatan, sekarang);
  const status = tabSerah.find((t) => t.kunci === tab)!.status;
  const isi = jadwal.filter((i) => i.status === status);

  // Tanpa pilihan manual, yang ditampilkan adalah serah terima yang sudah
  // lengkap, lalu baris pertama yang ada.
  const terpilih =
    jadwal.find((i) => i.id === idTerpilih) ??
    jadwal.find((i) => i.status === "selesai") ??
    jadwal[0];
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

  function simpanCatatan(id: string, ubah: (c: CatatanSerah) => CatatanSerah) {
    setCatatan((lama) => ({
      ...lama,
      [id]: ubah(lama[id] ?? { sisi: sisiKosong(), kondisi: [] }),
    }));
    setIdTerpilih(id);
  }

  function simulasikanFoto(item: JadwalSerah) {
    simpanCatatan(item.id, (c) => ({
      ...c,
      sisi: SISI.map((label) => ({ label, foto: `/serah-terima/scoopy-${label}.webp` })),
    }));
    setKabar(`Empat foto ${item.unit} terunggah.`);
  }

  function simpanKondisi(
    item: JadwalSerah,
    kondisi: CatatanSerah["kondisi"],
    klaim: CatatanSerah["klaim"],
  ) {
    simpanCatatan(item.id, (c) => ({ ...c, kondisi, klaim }));
    setFormKondisi(null);
    setKabar(
      klaim
        ? `Klaim ${rupiah(klaim.nominal)} diajukan untuk ${item.unit}. Dana penyewa ditahan sampai klaim selesai.`
        : item.sisi.every((s) => s.foto)
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
          const jumlah = jadwal.filter((i) => i.status === t.status).length;
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
                    aria-current={item.id === terpilih?.id ? "true" : undefined}
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
                            item.id === terpilih?.id
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
          {terpilih?.klaim && (
            <div className="mt-14 rounded-m-callout border border-mitra-plum p-20 min-[640px]:p-24">
              <p className="text-m-judul-baris text-mitra-plum">
                Klaim kerusakan {rupiah(terpilih.klaim.nominal)}
              </p>
              <p className="mt-6 text-m-body text-mitra-muted">{terpilih.klaim.keterangan}</p>
              <p className="mt-10 text-m-label text-mitra-muted">
                Dana penyewa ditahan rentalaja sampai klaim ini disepakati kedua pihak.
                Buktinya foto serah terima di sebelah kiri.
              </p>
            </div>
          )}

          <p className="mt-20 text-m-body text-mitra-muted">
            Kedua pihak menyetujui foto lewat aplikasi. Kondisi saat kembali dibandingkan
            dengan foto ini, dan jadi bukti kalau ada klaim kerusakan.
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
          onSimpan={(kondisi, klaim) => simpanKondisi(formKondisi, kondisi, klaim)}
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
  item: JadwalSerah;
  onTutup: () => void;
  onSimpan: (kondisi: CatatanSerah["kondisi"], klaim: CatatanSerah["klaim"]) => void;
}) {
  const awal = (label: string, bawaan: string) =>
    item.kondisi.find((k) => k.label === label)?.nilai ?? bawaan;

  const [odometer, setOdometer] = useState(awal("Odometer", "").replace(" km", ""));
  const [bensin, setBensin] = useState(awal("Bensin", "Penuh"));
  const [kelengkapan, setKelengkapan] = useState(awal("Helm", "2 · jas hujan 1"));
  const [goresan, setGoresan] = useState(awal("Goresan tercatat", "Tidak ada"));
  const [adaKlaim, setAdaKlaim] = useState(Boolean(item.klaim));
  const [nominalKlaim, setNominalKlaim] = useState(item.klaim ? String(item.klaim.nominal) : "");
  const [keteranganKlaim, setKeteranganKlaim] = useState(item.klaim?.keterangan ?? "");

  const angka = Number(odometer.replace(/\D/g, ""));
  const nominal = Number(nominalKlaim.replace(/\D/g, ""));
  // Klaim hanya masuk akal saat unit kembali, bukan saat diantar.
  const bisaKlaim = item.jenis === "ambil";
  const klaimValid = !adaKlaim || (nominal > 0 && keteranganKlaim.trim().length > 0);
  const valid = angka > 0 && klaimValid;
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
          onSimpan(
            [
              { label: "Odometer", nilai: `${new Intl.NumberFormat("id-ID").format(angka)} km` },
              { label: "Bensin", nilai: bensin },
              { label: "Helm", nilai: kelengkapan },
              { label: "Goresan tercatat", nilai: goresan.trim() || "Tidak ada" },
            ],
            adaKlaim && bisaKlaim ? { nominal, keterangan: keteranganKlaim.trim() } : undefined,
          );
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

        {bisaKlaim && (
          <>
            <label className="mt-18 flex items-start gap-10">
              <input
                type="checkbox"
                checked={adaKlaim}
                onChange={(e) => setAdaKlaim(e.target.checked)}
                className="mt-3 size-16"
              />
              <span>
                <span className="block text-m-status text-mitra-ink">
                  Ada kerusakan baru, ajukan klaim
                </span>
                <span className="mt-2 block text-m-label text-mitra-muted">
                  Sejak deposit tunai dihapus, inilah cara menagih kerusakan. Dana penyewa
                  ditahan rentalaja sampai klaim selesai.
                </span>
              </span>
            </label>

            {adaKlaim && (
              <>
                <label
                  htmlFor="nominal-klaim"
                  className="mt-14 block text-m-label text-mitra-muted"
                >
                  Nilai klaim
                </label>
                <input
                  id="nominal-klaim"
                  inputMode="numeric"
                  value={nominalKlaim}
                  onChange={(e) => setNominalKlaim(e.target.value)}
                  placeholder="150000"
                  className={kelasIsian}
                />

                <label
                  htmlFor="keterangan-klaim"
                  className="mt-14 block text-m-label text-mitra-muted"
                >
                  Kerusakan yang diklaim
                </label>
                <textarea
                  id="keterangan-klaim"
                  rows={2}
                  value={keteranganKlaim}
                  onChange={(e) => setKeteranganKlaim(e.target.value)}
                  placeholder="Spion kiri retak, tidak ada di foto serah terima awal"
                  className={kelasIsian}
                />
              </>
            )}
          </>
        )}

        <p className="mt-10 text-m-label text-mitra-muted">
          {!angka
            ? "Odometer harus diisi angka."
            : !klaimValid
              ? "Klaim butuh nilai dan keterangan kerusakannya."
              : adaKlaim
                ? "Klaim dikirim bersama foto serah terima sebagai bukti."
                : "Catatan ini jadi acuan saat unit dikembalikan."}
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
