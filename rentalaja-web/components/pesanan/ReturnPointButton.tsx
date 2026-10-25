"use client";

// Tombol "Lihat titik pengembalian" di Layar 5 beserta pop-up petanya.
// Dipisah dari OrderActive supaya layar itu tetap server component — hanya
// bagian ini yang butuh state. Petanya OpenStreetMap lewat PetaLokasi.

import { useState } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import Modal from "@/components/ui/Modal";
import PetaLokasi from "@/components/ui/PetaLokasi";
import { kamus } from "@/lib/i18n";
import { pesananAktif } from "@/lib/mock/pesanan-aktif";

const TEKS = kamus({
  id: { tombol: "Lihat titik pengembalian", judul: "Titik pengembalian", mengerti: "Mengerti" },
  en: { tombol: "View return point", judul: "Return point", mengerti: "Got it" },
});

export default function ReturnPointButton() {
  const [terbuka, setTerbuka] = useState(false);
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const titik = pesananAktif[bahasa].titikPengembalian;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setTerbuka(true)}
        className="mt-8 w-full rounded-input border border-line py-10 text-link-sm text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:text-green-700"
      >
        {t.tombol}
      </button>

      {terbuka && (
        <Modal
          judul={t.judul}
          onTutup={() => setTerbuka(false)}
          lebar="max-w-[720px]"
        >
          <p className="mt-10 text-nav-strong text-ink">{titik.alamat}</p>
          <p className="mt-2 text-body-sm text-muted">{titik.waktu}</p>

          <PetaLokasi alamat={titik.alamat} className="mt-14 aspect-[16/9]" />

          <button
            type="button"
            onClick={() => setTerbuka(false)}
            className="mt-14 w-full rounded-input bg-green-700 py-13 text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            {t.mengerti}
          </button>
        </Modal>
      )}
    </>
  );
}
