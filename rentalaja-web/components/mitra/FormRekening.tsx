"use client";

// Form isi atau ganti rekening tarik saldo, mengikuti aplikasi saham dan
// kripto: bank dari daftar, nomor rekening, nama pemilik yang harus sama
// dengan nama akun, dan kata sandi untuk konfirmasi. Aturannya dijaga API
// (PUT /mitra/rekening); form ini hanya mengumpulkan isian dan menampilkan
// penolakannya. Setelah rekening diubah, tarik saldo dikunci 24 jam.

import { useState } from "react";
import { ubahRekening } from "@/app/actions/mitra";
import { useBahasa } from "@/components/BahasaProvider";
import Modal from "@/components/ui/Modal";
import { kamus } from "@/lib/i18n";
import { BANK } from "@/lib/mitra/bank";
import { kelasTombolBaris } from "./ui";

const TEKS = kamus({
  id: {
    judulIsi: "Atur rekening",
    judulUbah: "Ganti rekening",
    bank: "Bank",
    pilihBank: "Pilih bank",
    nomor: "Nomor rekening",
    nomorBantuan: (n: number | undefined) => (n ? `${n} digit.` : "8 sampai 18 digit."),
    nama: "Nama pemilik rekening",
    namaBantuan: "Harus sama dengan nama akunmu, persis seperti di buku tabungan.",
    sandi: "Kata sandi akun",
    sandiBantuan: "Untuk memastikan ini memang kamu.",
    peringatan: "Setelah rekening diganti, tarik saldo dikunci 24 jam demi keamanan.",
    simpan: "Simpan rekening",
    menyimpan: "Menyimpan…",
    batal: "Batal",
  },
  en: {
    judulIsi: "Set up bank account",
    judulUbah: "Change bank account",
    bank: "Bank",
    pilihBank: "Choose a bank",
    nomor: "Account number",
    nomorBantuan: (n: number | undefined) => (n ? `${n} digits.` : "8 to 18 digits."),
    nama: "Account holder name",
    namaBantuan: "Must match your account name, exactly as on your bank book.",
    sandi: "Account password",
    sandiBantuan: "To make sure it's really you.",
    peringatan: "After changing your bank account, withdrawals are locked for 24 hours for security.",
    simpan: "Save account",
    menyimpan: "Saving…",
    batal: "Cancel",
  },
});

const KELAS_ISIAN =
  "mt-6 w-full rounded-input border border-mitra-border px-12 py-10 text-m-body text-mitra-ink disabled:bg-mitra-tint";

export default function FormRekening({
  adaRekening,
  onTutup,
  onTersimpan,
}: {
  /** true = mengganti rekening yang sudah ada. */
  adaRekening: boolean;
  onTutup: () => void;
  onTersimpan: () => void;
}) {
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [bank, setBank] = useState("");
  const [nomor, setNomor] = useState("");
  const [nama, setNama] = useState("");
  const [sandi, setSandi] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const digit = BANK.find((b) => b.kode === bank)?.digit;
  const bersih = nomor.replace(/[\s-]/g, "");
  const sah = bank !== "" && /^[0-9]{8,18}$/.test(bersih) && nama.trim().length >= 2 && sandi.length > 0;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!sah || menyimpan) return;
    setMenyimpan(true);
    setGalat(null);
    const h = await ubahRekening({ bank, nomor: bersih, namaPemilik: nama.trim(), kataSandi: sandi }).catch(() => ({
      ok: false as const,
      pesan: bahasa === "en" ? "The server can't be reached right now." : "Server sedang tidak bisa dihubungi.",
    }));
    setMenyimpan(false);
    // Kata sandi tidak dibiarkan tertinggal di state setelah dipakai.
    setSandi("");
    if (h.ok) onTersimpan();
    else setGalat(h.pesan);
  }

  return (
    <Modal judul={adaRekening ? t.judulUbah : t.judulIsi} onTutup={menyimpan ? () => {} : onTutup} lebar="max-w-[440px]">
      <form onSubmit={simpan} className="mt-12">
        <label htmlFor="rek-bank" className="block text-m-label text-mitra-ink">
          {t.bank}
        </label>
        <select
          id="rek-bank"
          value={bank}
          disabled={menyimpan}
          onChange={(e) => setBank(e.target.value)}
          className={KELAS_ISIAN}
        >
          <option value="">{t.pilihBank}</option>
          {BANK.map((b) => (
            <option key={b.kode} value={b.kode}>
              {b.nama}
            </option>
          ))}
        </select>

        <label htmlFor="rek-nomor" className="mt-12 block text-m-label text-mitra-ink">
          {t.nomor}
        </label>
        <input
          id="rek-nomor"
          inputMode="numeric"
          autoComplete="off"
          value={nomor}
          disabled={menyimpan}
          onChange={(e) => setNomor(e.target.value)}
          className={KELAS_ISIAN}
        />
        <p className="mt-4 text-m-meta text-mitra-muted">{t.nomorBantuan(digit)}</p>

        <label htmlFor="rek-nama" className="mt-12 block text-m-label text-mitra-ink">
          {t.nama}
        </label>
        <input
          id="rek-nama"
          autoComplete="name"
          value={nama}
          disabled={menyimpan}
          onChange={(e) => setNama(e.target.value)}
          className={KELAS_ISIAN}
        />
        <p className="mt-4 text-m-meta text-mitra-muted">{t.namaBantuan}</p>

        <label htmlFor="rek-sandi" className="mt-12 block text-m-label text-mitra-ink">
          {t.sandi}
        </label>
        <input
          id="rek-sandi"
          type="password"
          autoComplete="current-password"
          value={sandi}
          disabled={menyimpan}
          onChange={(e) => setSandi(e.target.value)}
          className={KELAS_ISIAN}
        />
        <p className="mt-4 text-m-meta text-mitra-muted">{t.sandiBantuan}</p>

        <p className="mt-14 rounded-input bg-mitra-tint px-12 py-10 text-m-meta text-mitra-ink-2">{t.peringatan}</p>

        {galat && (
          <p role="alert" className="mt-10 text-m-meta text-mitra-merah">
            {galat}
          </p>
        )}

        <div className="mt-18 flex justify-end gap-8">
          <button type="button" disabled={menyimpan} onClick={onTutup} className={kelasTombolBaris.sekunder}>
            {t.batal}
          </button>
          <button
            type="submit"
            disabled={!sah || menyimpan}
            className={`${kelasTombolBaris.primer} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {menyimpan ? t.menyimpan : t.simpan}
          </button>
        </div>
      </form>
    </Modal>
  );
}
