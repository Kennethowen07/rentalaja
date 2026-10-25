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
import { useBahasa } from "@/components/BahasaProvider";
import { kamus, lokal, type Bahasa } from "@/lib/i18n";
import { rupiah } from "@/lib/mitra/format";
import { tabSerah, type KunciTabSerah } from "@/lib/mitra/tab-serah";
import type { CatatanSerah, JadwalSerah, Pesanan, StatusSerah } from "@/lib/mitra/tipe";
import { awalHari, hariSama, jamSaja, statusKembali, tanggalSingkat } from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";
import { HeaderHalaman, ThumbnailUnit, kelasTombol, kelasTombolBaris } from "./ui";

const TEKS = kamus({
  id: {
    sisi: ["depan", "belakang", "kiri", "kanan"],
    kondisi: { odometer: "Odometer", bensin: "Bensin", helm: "Helm", goresan: "Goresan tercatat" },
    bensinOpsi: ["Penuh", "Tiga perempat", "Setengah", "Seperempat", "Hampir habis"],
    helmBawaan: "2 · jas hujan 1",
    tidakAda: "Tidak ada",
    antar: "Antar",
    ambilKembali: "Ambil kembali",
    kantor: "Kantor rental",
    belumKonfirmasi: "belum ada konfirmasi",
    fotoTerunggah: (unit: string) => `Empat foto ${unit} terunggah.`,
    klaimDiajukan: (nominal: string, unit: string) =>
      `Klaim ${nominal} diajukan untuk ${unit}. Dana penyewa ditahan sampai klaim selesai.`,
    selesaiDicatat: (unit: string) => `Serah terima ${unit} selesai dicatat.`,
    kondisiTercatat: (unit: string) => `Kondisi ${unit} tercatat. Empat foto masih kurang.`,
    judul: "Serah terima",
    riwayat: "Riwayat",
    mulai: "Mulai serah terima",
    statusSerah: "Status serah terima",
    jadwalHariIni: "Jadwal hari ini",
    kosong: "Belum ada serah terima di tab ini.",
    hubungi: "Hubungi",
    buka: "Buka",
    fotoSerah: (unit: string) => `Foto serah terima · ${unit}`,
    diambil: (waktu: string, nama: string) => `Diambil ${waktu} bersama ${nama}. Jadi acuan saat pengembalian.`,
    belumFoto: (nama: string) =>
      `Belum ada foto. Empat sisi wajib difoto bersama ${nama} sebelum unit berpindah tangan.`,
    tampak: (unit: string, sisi: string) => `${unit} tampak ${sisi}`,
    simulasikan: "Simulasikan unggah foto",
    hanyaScoopy: "Foto contoh empat sisi baru tersedia untuk Honda Scoopy.",
    catatanKondisi: "Catatan kondisi",
    belumDicatat:
      "Belum dicatat. Tekan \"Mulai serah terima\" untuk mengisi odometer, bensin, dan kelengkapan.",
    klaim: (nominal: string) => `Klaim kerusakan ${nominal}`,
    klaimDitahan:
      "Dana penyewa ditahan rentalaja sampai klaim ini disepakati kedua pihak. Buktinya foto serah terima di sebelah kiri.",
    persetujuan:
      "Kedua pihak menyetujui foto lewat aplikasi. Kondisi saat kembali dibandingkan dengan foto ini, dan jadi bukti kalau ada klaim kerusakan.",
    hubungiPenyewa: "Hubungi penyewa",
    nomorContoh: "Nomor contoh untuk prototype, bukan nomor asli.",
    mengerti: "Mengerti",
    catatKondisi: "Catat kondisi unit",
    odometerKm: "Odometer (km)",
    kelengkapan: "Kelengkapan",
    adaKerusakan: "Ada kerusakan baru, ajukan klaim",
    adaKerusakanSub:
      "Sejak deposit tunai dihapus, inilah cara menagih kerusakan. Dana penyewa ditahan rentalaja sampai klaim selesai.",
    nilaiKlaim: "Nilai klaim",
    kerusakanDiklaim: "Kerusakan yang diklaim",
    contohKerusakan: "Spion kiri retak, tidak ada di foto serah terima awal",
    errOdometer: "Odometer harus diisi angka.",
    errKlaim: "Klaim butuh nilai dan keterangan kerusakannya.",
    klaimBukti: "Klaim dikirim bersama foto serah terima sebagai bukti.",
    acuan: "Catatan ini jadi acuan saat unit dikembalikan.",
    batal: "Batal",
    simpan: "Simpan catatan",
  },
  en: {
    sisi: ["front", "rear", "left", "right"],
    kondisi: { odometer: "Odometer", bensin: "Fuel", helm: "Helmets", goresan: "Recorded scratches" },
    bensinOpsi: ["Full", "Three quarters", "Half", "Quarter", "Nearly empty"],
    helmBawaan: "2 · 1 raincoat",
    tidakAda: "None",
    antar: "Delivery",
    ambilKembali: "Pick-up",
    kantor: "Rental office",
    belumKonfirmasi: "no confirmation yet",
    fotoTerunggah: (unit: string) => `All four photos of ${unit} uploaded.`,
    klaimDiajukan: (nominal: string, unit: string) =>
      `A ${nominal} claim was filed for ${unit}. The renter's payment is held until the claim is settled.`,
    selesaiDicatat: (unit: string) => `Handover for ${unit} recorded.`,
    kondisiTercatat: (unit: string) => `Condition of ${unit} recorded. The four photos are still missing.`,
    judul: "Handovers",
    riwayat: "History",
    mulai: "Start handover",
    statusSerah: "Handover status",
    jadwalHariIni: "Today's schedule",
    kosong: "No handovers in this tab yet.",
    hubungi: "Contact",
    buka: "Open",
    fotoSerah: (unit: string) => `Handover photos · ${unit}`,
    diambil: (waktu: string, nama: string) => `Taken ${waktu} with ${nama}. Used as the reference at return.`,
    belumFoto: (nama: string) =>
      `No photos yet. All four sides must be photographed with ${nama} before the vehicle changes hands.`,
    tampak: (unit: string, sisi: string) => `${unit}, ${sisi} view`,
    simulasikan: "Simulate photo upload",
    hanyaScoopy: "Sample four-side photos are only available for the Honda Scoopy.",
    catatanKondisi: "Condition notes",
    belumDicatat:
      "Not recorded yet. Press \"Start handover\" to fill in the odometer, fuel, and accessories.",
    klaim: (nominal: string) => `Damage claim ${nominal}`,
    klaimDitahan:
      "The renter's payment is held by rentalaja until both sides agree on this claim. The handover photos on the left are the evidence.",
    persetujuan:
      "Both sides approve the photos in the app. The condition at return is compared against these photos, and they serve as evidence if there's a damage claim.",
    hubungiPenyewa: "Contact renter",
    nomorContoh: "Sample number for the prototype, not a real one.",
    mengerti: "Got it",
    catatKondisi: "Record vehicle condition",
    odometerKm: "Odometer (km)",
    kelengkapan: "Accessories",
    adaKerusakan: "There's new damage, file a claim",
    adaKerusakanSub:
      "Since cash deposits were removed, this is how damage gets billed. The renter's payment is held by rentalaja until the claim is settled.",
    nilaiKlaim: "Claim amount",
    kerusakanDiklaim: "Damage being claimed",
    contohKerusakan: "Cracked left mirror, not in the original handover photos",
    errOdometer: "Enter the odometer as a number.",
    errKlaim: "A claim needs an amount and a description of the damage.",
    klaimBukti: "The claim is sent along with the handover photos as evidence.",
    acuan: "These notes are the reference when the vehicle is returned.",
    batal: "Cancel",
    simpan: "Save notes",
  },
});
type Teks = (typeof TEKS)["id"];

// Nama berkas foto contoh memakai nama sisi dalam bahasa Indonesia.
const BERKAS_SISI = ["depan", "belakang", "kiri", "kanan"];
const sisiKosong = (t: Teks) => t.sisi.map((label) => ({ label, foto: null }));

function judul(item: JadwalSerah, t: Teks) {
  return `${item.jenis === "antar" ? t.antar : t.ambilKembali} · ${item.unit}`;
}

function meta(item: JadwalSerah, sekarang: number, bahasa: Bahasa) {
  if (item.telat) {
    const { label } = statusKembali(item.waktu, sekarang, bahasa);
    return `${item.penyewa} · ${label.toLowerCase()}${item.catatan ? ` · ${item.catatan}` : ""}`;
  }
  // Jadwal di hari lain selalu menyebut tanggal, supaya "16.00" tidak terbaca
  // seolah hari ini.
  const waktu = hariSama(item.waktu, sekarang)
    ? jamSaja(item.waktu, bahasa)
    : `${tanggalSingkat(item.waktu, bahasa)} ${jamSaja(item.waktu, bahasa)}`;
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
  t: Teks,
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
      const tercatat = catatan[id] ?? { sisi: sisiKosong(t), kondisi: [] };
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
        titik: p.titik ?? t.kantor,
        catatan: e.telat ? t.belumKonfirmasi : undefined,
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
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [catatan, setCatatan] = useState(catatanAwal);
  const [tab, setTab] = useState<KunciTabSerah>(tabAwal);
  const [idTerpilih, setIdTerpilih] = useState<string | null>(null);
  const [kontak, setKontak] = useState<JadwalSerah | null>(null);
  const [formKondisi, setFormKondisi] = useState<JadwalSerah | null>(null);
  const [kabar, setKabar] = useState("");

  const jadwal = jadwalDariPesanan(pesanan, catatan, sekarang, t);
  const status = tabSerah.find((x) => x.kunci === tab)!.status;
  const isi = jadwal.filter((i) => i.status === status);

  // Tanpa pilihan manual, yang ditampilkan adalah serah terima yang sudah
  // lengkap, lalu baris pertama yang ada.
  const terpilih =
    jadwal.find((i) => i.id === idTerpilih) ??
    jadwal.find((i) => i.status === "selesai") ??
    jadwal[0];
  const lengkap = terpilih?.sisi.every((s) => s.foto) ?? false;

  function pindahTab(e: React.KeyboardEvent) {
    const i = tabSerah.findIndex((x) => x.kunci === tab);
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
      [id]: ubah(lama[id] ?? { sisi: sisiKosong(t), kondisi: [] }),
    }));
    setIdTerpilih(id);
  }

  function simulasikanFoto(item: JadwalSerah) {
    simpanCatatan(item.id, (c) => ({
      ...c,
      sisi: t.sisi.map((label, i) => ({ label, foto: `/serah-terima/scoopy-${BERKAS_SISI[i]}.webp` })),
    }));
    setKabar(t.fotoTerunggah(item.unit));
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
        ? t.klaimDiajukan(rupiah(klaim.nominal), item.unit)
        : item.sisi.every((s) => s.foto)
          ? t.selesaiDicatat(item.unit)
          : t.kondisiTercatat(item.unit),
    );
  }

  return (
    <>
      <HeaderHalaman
        kicker={kicker}
        judul={t.judul}
        aksi={
          <>
            <button
              type="button"
              onClick={() => setTab("selesai")}
              className={`${kelasTombol.sekunder} px-17 py-11`}
            >
              {t.riwayat}
            </button>
            <button
              type="button"
              disabled={!terpilih}
              onClick={() => terpilih && setFormKondisi(terpilih)}
              className={`${kelasTombol.primer} px-19 py-11`}
            >
              {t.mulai}
            </button>
          </>
        }
      />

      <div
        role="tablist"
        aria-label={t.statusSerah}
        className="mt-30 flex gap-28 overflow-x-auto border-b border-mitra-hairline"
      >
        {tabSerah.map((x) => {
          const dipilih = x.kunci === tab;
          const jumlah = jadwal.filter((i) => i.status === x.status).length;
          return (
            <button
              key={x.kunci}
              id={`tab-${x.kunci}`}
              type="button"
              role="tab"
              aria-selected={dipilih}
              aria-controls="panel-serah"
              tabIndex={dipilih ? 0 : -1}
              onClick={() => setTab(x.kunci)}
              onKeyDown={pindahTab}
              className={`-mb-1 border-b-2 pb-14 whitespace-nowrap transition-colors duration-160 ease-base ${
                dipilih
                  ? "border-mitra-ink text-m-nav-aktif text-mitra-ink"
                  : "border-transparent text-m-nav text-mitra-faint hover:text-mitra-ink"
              }`}
            >
              {x.label[bahasa]}
              {x.berjumlah && ` · ${jumlah}`}
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
            {tab === "hari-ini" ? t.jadwalHariIni : tabSerah.find((x) => x.kunci === tab)!.label[bahasa]}
          </h2>

          <div className="mt-18 rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24">
            {isi.length === 0 ? (
              <p className="text-m-body text-mitra-faint">{t.kosong}</p>
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
                      <p className="text-m-judul-baris text-mitra-ink">{judul(item, t)}</p>
                      <p
                        className={`mt-5 text-m-meta ${item.telat ? "text-mitra-plum" : "text-mitra-muted"}`}
                      >
                        {meta(item, sekarang, bahasa)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {item.telat ? (
                        <button
                          type="button"
                          onClick={() => setKontak(item)}
                          className={kelasTombolBaris.sekunder}
                        >
                          {t.hubungi}
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
                          {t.buka}
                          <span className="sr-only"> {judul(item, t)}</span>
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
                {t.fotoSerah(terpilih.unit)}
              </h2>
              <p className="mt-8 text-m-body text-mitra-muted">
                {lengkap
                  ? t.diambil(`${tanggalSingkat(terpilih.waktu, bahasa)} ${jamSaja(terpilih.waktu, bahasa)}`, terpilih.penyewa)
                  : t.belumFoto(terpilih.penyewa)}
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
                        alt={t.tampak(terpilih.unit, s.label)}
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
                    {t.simulasikan}
                  </button>
                ) : (
                  // Foto contoh empat sisi baru ada untuk Scoopy. Mengisi slot
                  // unit lain dengan foto Scoopy akan menampilkan unit yang
                  // salah, jadi tombolnya sengaja tidak ditawarkan.
                  <p className="mt-14 text-m-label text-mitra-faint">
                    {t.hanyaScoopy}
                  </p>
                ))}
            </>
          )}
        </section>

        <section aria-labelledby="judul-kondisi">
          <h2 id="judul-kondisi" className="text-m-h2 text-mitra-ink">
            {t.catatanKondisi}
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
                {t.belumDicatat}
              </p>
            )}
          </div>
          {terpilih?.klaim && (
            <div className="mt-14 rounded-m-callout border border-mitra-plum p-20 min-[640px]:p-24">
              <p className="text-m-judul-baris text-mitra-plum">
                {t.klaim(rupiah(terpilih.klaim.nominal))}
              </p>
              <p className="mt-6 text-m-body text-mitra-muted">{terpilih.klaim.keterangan}</p>
              <p className="mt-10 text-m-label text-mitra-muted">
                {t.klaimDitahan}
              </p>
            </div>
          )}

          <p className="mt-20 text-m-body text-mitra-muted">
            {t.persetujuan}
          </p>
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {kabar}
      </p>

      {kontak && (
        <Modal judul={t.hubungiPenyewa} onTutup={() => setKontak(null)} lebar="max-w-[420px]">
          <p className="mt-10 text-m-judul-baris text-mitra-ink">{kontak.penyewa}</p>
          <p className="mt-4 text-m-meta text-mitra-muted">
            {judul(kontak, t)} · {kontak.plat}
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

      {formKondisi && (
        <FormKondisi
          item={formKondisi}
          t={t}
          bahasa={bahasa}
          onTutup={() => setFormKondisi(null)}
          onSimpan={(kondisi, klaim) => simpanKondisi(formKondisi, kondisi, klaim)}
        />
      )}
    </>
  );
}

function FormKondisi({
  item,
  t,
  bahasa,
  onTutup,
  onSimpan,
}: {
  t: Teks;
  bahasa: Bahasa;
  item: JadwalSerah;
  onTutup: () => void;
  onSimpan: (kondisi: CatatanSerah["kondisi"], klaim: CatatanSerah["klaim"]) => void;
}) {
  const awal = (label: string, bawaan: string) =>
    item.kondisi.find((k) => k.label === label)?.nilai ?? bawaan;

  const k = t.kondisi;
  const [odometer, setOdometer] = useState(awal(k.odometer, "").replace(" km", ""));
  const [bensin, setBensin] = useState(awal(k.bensin, t.bensinOpsi[0]));
  const [kelengkapan, setKelengkapan] = useState(awal(k.helm, t.helmBawaan));
  const [goresan, setGoresan] = useState(awal(k.goresan, t.tidakAda));
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
    <Modal judul={t.catatKondisi} onTutup={onTutup} lebar="max-w-[440px]">
      <p className="mt-10 text-m-judul-baris text-mitra-ink">{judul(item, t)}</p>
      <p className="mt-4 text-m-meta text-mitra-muted">
        {item.plat} · {item.penyewa}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSimpan(
            [
              { label: k.odometer, nilai: `${new Intl.NumberFormat(lokal(bahasa)).format(angka)} km` },
              { label: k.bensin, nilai: bensin },
              { label: k.helm, nilai: kelengkapan },
              { label: k.goresan, nilai: goresan.trim() || t.tidakAda },
            ],
            adaKlaim && bisaKlaim ? { nominal, keterangan: keteranganKlaim.trim() } : undefined,
          );
        }}
      >
        <label htmlFor="odometer" className="mt-18 block text-m-label text-mitra-muted">
          {t.odometerKm}
        </label>
        <input
          id="odometer"
          inputMode="numeric"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          className={kelasIsian}
        />

        <label htmlFor="bensin" className="mt-14 block text-m-label text-mitra-muted">
          {k.bensin}
        </label>
        <select
          id="bensin"
          value={bensin}
          onChange={(e) => setBensin(e.target.value)}
          className={kelasIsian}
        >
          {t.bensinOpsi.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        <label htmlFor="kelengkapan" className="mt-14 block text-m-label text-mitra-muted">
          {t.kelengkapan}
        </label>
        <input
          id="kelengkapan"
          value={kelengkapan}
          onChange={(e) => setKelengkapan(e.target.value)}
          className={kelasIsian}
        />

        <label htmlFor="goresan" className="mt-14 block text-m-label text-mitra-muted">
          {k.goresan}
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
                <span className="block text-m-status text-mitra-ink">{t.adaKerusakan}</span>
                <span className="mt-2 block text-m-label text-mitra-muted">{t.adaKerusakanSub}</span>
              </span>
            </label>

            {adaKlaim && (
              <>
                <label
                  htmlFor="nominal-klaim"
                  className="mt-14 block text-m-label text-mitra-muted"
                >
                  {t.nilaiKlaim}
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
                  {t.kerusakanDiklaim}
                </label>
                <textarea
                  id="keterangan-klaim"
                  rows={2}
                  value={keteranganKlaim}
                  onChange={(e) => setKeteranganKlaim(e.target.value)}
                  placeholder={t.contohKerusakan}
                  className={kelasIsian}
                />
              </>
            )}
          </>
        )}

        <p className="mt-10 text-m-label text-mitra-muted">
          {!angka ? t.errOdometer : !klaimValid ? t.errKlaim : adaKlaim ? t.klaimBukti : t.acuan}
        </p>

        <div className="mt-20 flex justify-end gap-8">
          <button type="button" onClick={onTutup} className={kelasTombolBaris.sekunder}>
            {t.batal}
          </button>
          <button type="submit" disabled={!valid} className={kelasTombolBaris.primer}>
            {t.simpan}
          </button>
        </div>
      </form>
    </Modal>
  );
}
