"use client";

// Pengganti panel mitra saat API aktif tapi belum ada sesi mitra: belum
// masuk, atau yang masuk akun penyewa. Panel sungguhan berisi data pelanggan
// (nama, nomor telepon, alamat), jadi tidak boleh terbuka tanpa akun mitra.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";

const TEKS = kamus({
  id: {
    judul: "Panel mitra",
    belumMasuk: "Masuk dengan akun mitra untuk membuka panel ini.",
    bukanMitra: "Akun yang sedang masuk adalah akun penyewa. Keluar, lalu masuk dengan akun mitra.",
    masuk: "Masuk sebagai mitra",
    keluar: "Keluar",
    beranda: "Kembali ke beranda",
    membuka: "Membuka panel…",
  },
  en: {
    judul: "Provider dashboard",
    belumMasuk: "Log in with a provider account to open this dashboard.",
    bukanMitra: "You're logged in as a renter. Log out, then log in with a provider account.",
    masuk: "Log in as a provider",
    keluar: "Log out",
    beranda: "Back to home",
    membuka: "Opening the dashboard…",
  },
});

export default function GerbangMitra() {
  const { peran, keluar, mintaMasuk } = useAkun();
  // Tepat setelah masuk sebagai mitra, gerbang masih tampil sampai halaman
  // dimuat ulang dari server; selama itu jangan menyebutnya akun penyewa.
  const penyewa = peran === "PENYEWA";
  const membuka = peran === "MITRA";
  const { bahasa, jalur } = useBahasa();
  const router = useRouter();
  const t = TEKS[bahasa];

  return (
    <div className="grid flex-1 place-items-center px-20 py-64 text-center">
      <div className="max-w-[420px]">
        <h1 className="text-m-judul-baris text-mitra-ink">{t.judul}</h1>
        <p className="mt-8 text-m-meta text-mitra-ink-2">{membuka ? t.membuka : penyewa ? t.bukanMitra : t.belumMasuk}</p>
        {!membuka && (
        <div className="mt-20 flex flex-wrap justify-center gap-12">
          <button
            type="button"
            onClick={() => (penyewa ? keluar() : mintaMasuk("masuk", () => router.refresh()))}
            className="rounded-input bg-green-700 px-20 py-11 text-btn text-white hover:bg-green-800"
          >
            {penyewa ? t.keluar : t.masuk}
          </button>
          <Link href={jalur("/")} className="rounded-input border border-line px-20 py-11 text-btn text-ink">
            {t.beranda}
          </Link>
        </div>
        )}
      </div>
    </div>
  );
}
