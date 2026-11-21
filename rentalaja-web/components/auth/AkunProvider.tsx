"use client";

// Status masuk yang dipakai bersama: navbar, tombol "Hubungi penyedia", dan
// halaman /chat.
//
// Dua mode, dipilih layout dari env server:
//
//   nyata  API_URL diisi. Masuk lewat rentalaja-api (app/actions/akun.ts);
//          token disimpan di cookie httpOnly, jadi tidak pernah terlihat di
//          sini. Saat halaman dimuat, sesinya dibaca lewat sesiSaya(). Belum
//          ada pendaftaran: hanya akun demo dari seed yang bisa masuk.
//   simulasi  Tanpa API (mis. deploy Vercel sebelum backend online). Yang
//          disimpan hanya nama akun demo di localStorage. Bukan sesi
//          sungguhan dan tidak pernah dikirim ke mana pun.

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { keluar as keluarSesi, sesiSaya, type Akun } from "@/app/actions/akun";
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
  /** Nama yang ditampilkan, atau null kalau belum masuk. */
  akun: string | null;
  /** Hanya di mode nyata; null di mode simulasi atau belum masuk. */
  peran: Akun["peran"] | null;
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

export default function AkunProvider({
  children,
  nyata,
  adaDemo,
}: {
  children: React.ReactNode;
  /** true kalau API_URL diisi: login sungguhan. */
  nyata: boolean;
  /** true kalau server punya kata sandi akun demo (tombol masuk sekali klik). */
  adaDemo: boolean;
}) {
  const router = useRouter();
  // Mode simulasi: server selalu merender keadaan belum masuk, lalu klien
  // membaca localStorage tanpa hydration mismatch.
  const akunSimulasi = useSyncExternalStore(langganan, baca, () => null);
  // Mode nyata: dibaca dari server setelah halaman dimuat. Cookie sengaja
  // tidak dibaca di layout, karena itu membuat semua halaman jadi dinamis.
  const [akunNyata, setAkunNyata] = useState<Akun | null>(null);
  const [modeAuth, setModeAuth] = useState<ModeAuth | null>(null);
  const lanjutRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!nyata) return;
    let batal = false;
    sesiSaya()
      .then((a) => {
        if (!batal) setAkunNyata(a);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [nyata]);

  const mintaMasuk = useCallback((mode: ModeAuth = "masuk", lanjut?: () => void) => {
    lanjutRef.current = lanjut ?? null;
    setModeAuth(mode);
  }, []);

  const keluar = useCallback(() => {
    if (!nyata) return tulis(null);
    setAkunNyata(null);
    // Halaman yang datanya bergantung pada sesi (pesanan, panel mitra) ikut
    // dimuat ulang dari server.
    keluarSesi().then(() => router.refresh());
  }, [nyata, router]);

  const nilai: NilaiAkun = nyata
    ? { akun: akunNyata?.nama ?? null, peran: akunNyata?.peran ?? null, keluar, mintaMasuk }
    : { akun: akunSimulasi, peran: null, keluar, mintaMasuk };

  return (
    <KonteksAkun.Provider value={nilai}>
      {children}
      {modeAuth && (
        <AuthModal
          mode={modeAuth}
          nyata={nyata}
          adaDemo={adaDemo}
          onTutup={() => {
            lanjutRef.current = null;
            setModeAuth(null);
          }}
          onGantiMode={setModeAuth}
          onBerhasil={(hasil) => {
            if (typeof hasil === "string") tulis(hasil);
            else {
              setAkunNyata(hasil);
              router.refresh();
            }
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
