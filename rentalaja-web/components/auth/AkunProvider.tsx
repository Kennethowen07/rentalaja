"use client";

// Status masuk yang dipakai bersama: navbar, tombol "Hubungi penyedia", dan
// halaman /chat. Dulu akun hanya hidup di state Navbar, sehingga komponen
// lain tidak bisa tahu penyewa sudah masuk atau belum.
//
// Masih simulasi (lihat AuthModal): yang disimpan hanya nama akun demo, di
// localStorage supaya tidak hilang saat pindah halaman. Bukan sesi sungguhan
// dan tidak pernah dikirim ke mana pun.

import { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore } from "react";
import AuthModal, { type ModeAuth } from "@/components/auth/AuthModal";

const KUNCI = "rentalaja-akun-demo";
const pendengar = new Set<() => void>();
// Cadangan kalau localStorage diblokir (mode privat, cookie dimatikan).
let cadangan: string | null = null;

function baca(): string | null {
  try {
    return localStorage.getItem(KUNCI) ?? cadangan;
  } catch {
    return cadangan;
  }
}

function tulis(nilai: string | null) {
  cadangan = nilai;
  try {
    if (nilai === null) localStorage.removeItem(KUNCI);
    else localStorage.setItem(KUNCI, nilai);
  } catch {
    // Tetap jalan dengan cadangan di memori.
  }
  pendengar.forEach((p) => p());
}

function langganan(p: () => void) {
  pendengar.add(p);
  // Masuk atau keluar di tab lain ikut terbaca.
  window.addEventListener("storage", p);
  return () => {
    pendengar.delete(p);
    window.removeEventListener("storage", p);
  };
}

type NilaiAkun = {
  akun: string | null;
  keluar: () => void;
  /** Buka modal masuk. `lanjut` dijalankan setelah berhasil masuk, mis.
   *  membuka chat yang tadi diklik sebelum login. */
  mintaMasuk: (mode?: ModeAuth, lanjut?: () => void) => void;
};

const KonteksAkun = createContext<NilaiAkun | null>(null);

export function useAkun(): NilaiAkun {
  const nilai = useContext(KonteksAkun);
  if (!nilai) throw new Error("useAkun harus dipakai di dalam AkunProvider");
  return nilai;
}

export default function AkunProvider({ children }: { children: React.ReactNode }) {
  // Server selalu merender keadaan belum masuk, lalu klien membaca
  // localStorage tanpa hydration mismatch.
  const akun = useSyncExternalStore(langganan, baca, () => null);
  const [modeAuth, setModeAuth] = useState<ModeAuth | null>(null);
  const lanjutRef = useRef<(() => void) | null>(null);

  const mintaMasuk = useCallback((mode: ModeAuth = "masuk", lanjut?: () => void) => {
    lanjutRef.current = lanjut ?? null;
    setModeAuth(mode);
  }, []);

  const keluar = useCallback(() => tulis(null), []);

  return (
    <KonteksAkun.Provider value={{ akun, keluar, mintaMasuk }}>
      {children}
      {modeAuth && (
        <AuthModal
          mode={modeAuth}
          onTutup={() => {
            lanjutRef.current = null;
            setModeAuth(null);
          }}
          onGantiMode={setModeAuth}
          onBerhasil={(identitas) => {
            tulis(identitas);
            setModeAuth(null);
            const lanjut = lanjutRef.current;
            lanjutRef.current = null;
            lanjut?.();
          }}
        />
      )}
    </KonteksAkun.Provider>
  );
}
