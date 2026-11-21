"use client";

// Pengganti layar Pesanan aktif saat tidak ada pesanan untuk ditampilkan:
// belum masuk, belum pernah memesan, atau kode di URL bukan milik akun ini.
// Hanya muncul di mode API; tanpa API layar memakai pesanan contoh.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import { kamus } from "@/lib/i18n";

export type JenisKosong = "perlu-masuk" | "kosong" | "tidak-ada";

const TEKS = kamus({
  id: {
    judul: {
      "perlu-masuk": "Masuk untuk melihat pesananmu",
      kosong: "Belum ada pesanan",
      "tidak-ada": "Pesanan tidak ditemukan",
    } as Record<JenisKosong, string>,
    isi: {
      "perlu-masuk": "Pesanan tersimpan di akunmu. Masuk dulu, lalu pesanannya tampil di sini.",
      kosong: "Pilih tanggal dan unit, pesananmu akan tampil di sini setelah dibayar.",
      "tidak-ada": "Kode pesanan ini tidak ada, atau bukan milik akun yang sedang masuk.",
    } as Record<JenisKosong, string>,
    masuk: "Masuk",
    cari: "Cari unit",
  },
  en: {
    judul: {
      "perlu-masuk": "Log in to see your booking",
      kosong: "No bookings yet",
      "tidak-ada": "Booking not found",
    },
    isi: {
      "perlu-masuk": "Bookings are saved to your account. Log in and it shows up here.",
      kosong: "Pick your dates and a vehicle. Your booking shows up here once paid.",
      "tidak-ada": "This booking code doesn't exist, or it belongs to a different account.",
    },
    masuk: "Log in",
    cari: "Find a vehicle",
  },
});

export default function PesananKosong({ jenis }: { jenis: JenisKosong }) {
  const { mintaMasuk } = useAkun();
  const { bahasa, jalur } = useBahasa();
  const router = useRouter();
  const t = TEKS[bahasa];

  return (
    <div className="container-page grid place-items-center pt-48 pb-64 text-center">
      <h1 className="text-tab text-ink">{t.judul[jenis]}</h1>
      <p className="mt-8 max-w-[420px] text-body text-muted">{t.isi[jenis]}</p>
      {jenis === "perlu-masuk" ? (
        <button
          type="button"
          // Setelah masuk, halaman dimuat ulang dari server dengan sesi baru.
          onClick={() => mintaMasuk("masuk", () => router.refresh())}
          className="mt-20 rounded-input bg-green-700 px-24 py-12 text-btn text-white hover:bg-green-800"
        >
          {t.masuk}
        </button>
      ) : (
        <Link
          href={jalur("/cari")}
          className="mt-20 rounded-input bg-green-700 px-24 py-12 text-btn text-white hover:bg-green-800"
        >
          {t.cari}
        </Link>
      )}
    </div>
  );
}
