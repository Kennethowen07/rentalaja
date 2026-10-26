"use client";

// Chat penyedia dengan penyewa (/mitra/chat). Daftar percakapan diturunkan
// dari pesanan yang masih berjalan atau menunggu, jadi tombol "Hubungi" di
// Pesanan dan Serah terima cukup membawa ?dengan=<id pesanan>.
//
// Sama seperti chat penyewa: pesan baru hanya ditambahkan ke state halaman,
// tidak disimpan dan tidak dikirim ke mana pun.

import { useEffect, useRef, useState } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import AvatarKosong from "@/components/ui/AvatarKosong";
import { kamus, type Bahasa } from "@/lib/i18n";
import type { Pesanan } from "@/lib/mitra/tipe";
import { MENIT, hariSama, jamSaja, tanggalSingkat } from "@/lib/mitra/waktu";
import { usePesanan } from "./PesananProvider";

const TEKS = kamus({
  id: {
    daftarChat: "Daftar chat",
    kamu: "Kamu: ",
    belumAdaPesan: "Belum ada pesan",
    mulai: (nama: string) => `Belum ada pesan dengan ${nama}. Tulis pesan pertama di bawah.`,
    chatDengan: (nama: string) => `Chat dengan ${nama}`,
    kembali: "Kembali ke daftar chat",
    tulisUntuk: (nama: string) => `Tulis pesan untuk ${nama}`,
    tulis: "Tulis pesan",
    kirim: "Kirim",
  },
  en: {
    daftarChat: "Chat list",
    kamu: "You: ",
    belumAdaPesan: "No messages yet",
    mulai: (nama: string) => `No messages with ${nama} yet. Write the first one below.`,
    chatDengan: (nama: string) => `Chat with ${nama}`,
    kembali: "Back to chat list",
    tulisUntuk: (nama: string) => `Write a message to ${nama}`,
    tulis: "Write a message",
    kirim: "Send",
  },
});

type Pesan = { dari: "saya" | "penyewa"; teks: string; waktu: number };

/** Pesan contoh per pesanan; waktunya menit sebelum jam server. */
const CONTOH: Record<string, { dari: Pesan["dari"]; teks: { id: string; en: string }; menitLalu: number }[]> = {
  "RA-283998": [
    {
      dari: "saya",
      teks: {
        id: "Halo Kak Kevin, PCX-nya dijadwalkan kembali kemarin jam 09.00. Bisa dikembalikan hari ini?",
        en: "Hi Kevin, the PCX was due back yesterday at 09:00. Can you return it today?",
      },
      menitLalu: 26 * 60,
    },
    {
      dari: "penyewa",
      teks: {
        id: "Maaf Pak, saya masih di Ubud. Sore ini saya antar ke kantor.",
        en: "Sorry, I'm still in Ubud. I'll bring it to the office this afternoon.",
      },
      menitLalu: 25 * 60,
    },
  ],
  "RA-284077": [
    {
      dari: "penyewa",
      teks: {
        id: "Halo, NMAX-nya saya kembalikan jam 17.00 di Villa Berawa ya.",
        en: "Hi, I'll return the NMAX at 17:00 at Villa Berawa.",
      },
      menitLalu: 95,
    },
  ],
  "RA-284207": [
    {
      dari: "penyewa",
      teks: {
        id: "Halo, Vario-nya bisa diantar jam 13.00 ke Villa Canggu?",
        en: "Hi, could the Vario be delivered at 13:00 to Villa Canggu?",
      },
      menitLalu: 17,
    },
  ],
};

function waktuPesan(w: number, sekarang: number, bahasa: Bahasa) {
  return hariSama(w, sekarang) ? jamSaja(w, bahasa) : `${tanggalSingkat(w, bahasa)}, ${jamSaja(w, bahasa)}`;
}

export default function ChatMitra({ dengan }: { dengan?: string }) {
  const { pesanan, sekarang } = usePesanan();
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];

  // Percakapan: pesanan berjalan dan menunggu, plus pesanan tujuan ?dengan
  // walau statusnya sudah lain.
  const lawan = pesanan.filter(
    (p) => p.status === "active" || p.status === "pending" || p.id === dengan,
  );
  const [pesan, setPesan] = useState<Record<string, Pesan[]>>(() =>
    Object.fromEntries(
      Object.entries(CONTOH).map(([id, isi]) => [
        id,
        isi.map((m) => ({ dari: m.dari, teks: m.teks[bahasa], waktu: sekarang - m.menitLalu * MENIT })),
      ]),
    ),
  );
  const [aktifId, setAktifId] = useState<string | null>(
    lawan.some((p) => p.id === dengan) ? dengan! : null,
  );
  const [draf, setDraf] = useState("");
  const isiRef = useRef<HTMLDivElement>(null);

  const terakhir = (p: Pesanan) => pesan[p.id]?.at(-1)?.waktu ?? 0;
  // Percakapan dengan pesan terbaru di atas, yang belum ada pesan di bawah.
  const urut = [...lawan].sort((a, b) => terakhir(b) - terakhir(a));
  const aktif = lawan.find((p) => p.id === aktifId) ?? null;
  const isiAktif = aktif ? (pesan[aktif.id] ?? []) : [];

  // Selalu tampilkan pesan terbaru di bawah.
  useEffect(() => {
    const el = isiRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [aktifId, isiAktif.length]);

  function kirim() {
    const teks = draf.trim();
    if (!teks || !aktif) return;
    setPesan((semua) => ({
      ...semua,
      [aktif.id]: [...(semua[aktif.id] ?? []), { dari: "saya", teks, waktu: Date.now() }],
    }));
    setDraf("");
  }

  return (
    // Tinggi tetap 600px, sama dengan chat penyewa. Belum ada chat yang
    // dibuka: daftar saja, selebar penuh, tanpa panel kosong di kanan.
    <div
      className={`mt-30 grid h-600 overflow-hidden rounded-m-callout border border-mitra-border shadow-m-panel ${
        aktif ? "min-[1100px]:grid-cols-[320px_1fr]" : ""
      }`}
    >
      <section
        aria-label={t.daftarChat}
        className={`min-h-0 flex-col border-mitra-hairline min-[1100px]:flex ${
          aktif ? "hidden min-[1100px]:border-r" : "flex"
        }`}
      >
        <ul className="flex-1 overflow-y-auto">
          {urut.map((p) => {
            const akhir = pesan[p.id]?.at(-1);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setAktifId(p.id)}
                  aria-current={p.id === aktifId ? "true" : undefined}
                  className={`flex w-full gap-11 border-b border-mitra-hairline px-16 py-13 text-left transition-colors duration-160 ease-base hover:bg-mitra-hover ${
                    p.id === aktifId ? "bg-mitra-tint" : ""
                  }`}
                >
                  <AvatarKosong className="size-40" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-8">
                      <span className="truncate text-m-status text-mitra-ink">{p.penyewa}</span>
                      {akhir && (
                        <span className="shrink-0 text-m-label text-mitra-faint">
                          {waktuPesan(akhir.waktu, sekarang, bahasa)}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block truncate text-m-label text-mitra-muted">
                      {akhir ? `${akhir.dari === "saya" ? t.kamu : ""}${akhir.teks}` : t.belumAdaPesan}
                    </span>
                    <span className="mt-2 block truncate text-m-label text-mitra-faint">
                      {p.unit} | {p.plat}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {aktif && (
        <section aria-label={t.chatDengan(aktif.penyewa)} className="flex min-h-0 flex-col">
          <div className="flex items-center gap-11 border-b border-mitra-hairline px-16 py-11">
            <button
              type="button"
              onClick={() => setAktifId(null)}
              aria-label={t.kembali}
              className="-ml-8 grid size-36 place-items-center rounded-pill text-mitra-ink hover:bg-mitra-hover min-[1100px]:hidden"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <AvatarKosong className="size-36" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-m-status text-mitra-ink">{aktif.penyewa}</h2>
              <p className="truncate text-m-label text-mitra-muted">
                #{aktif.id} | {aktif.unit} | {aktif.plat}
              </p>
            </div>
            {/* Nomor contoh untuk prototype, bukan nomor asli siapa pun. */}
            <p className="hidden shrink-0 text-m-label text-mitra-faint min-[640px]:block">{aktif.telepon}</p>
          </div>

          <div ref={isiRef} className="flex flex-1 flex-col gap-10 overflow-y-auto bg-mitra-hover px-16 py-16">
            {isiAktif.length === 0 && (
              <p className="m-auto max-w-280 text-center text-m-body text-mitra-faint">{t.mulai(aktif.penyewa)}</p>
            )}
            {isiAktif.map((m, i) => (
              <div
                key={i}
                className={`flex max-w-[78%] flex-col ${m.dari === "saya" ? "items-end self-end" : "items-start self-start"}`}
              >
                <p
                  className={`rounded-[14px] px-12 py-9 text-m-body ${
                    m.dari === "saya"
                      ? "rounded-br-[4px] bg-mitra-primer text-white"
                      : "rounded-bl-[4px] border border-mitra-border bg-white text-mitra-ink"
                  }`}
                >
                  {m.teks}
                </p>
                <span className="mt-3 text-m-label text-mitra-faint">{waktuPesan(m.waktu, sekarang, bahasa)}</span>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              kirim();
            }}
            className="flex gap-8 border-t border-mitra-hairline p-12"
          >
            <label htmlFor="pesan-mitra" className="sr-only">
              {t.tulisUntuk(aktif.penyewa)}
            </label>
            <input
              id="pesan-mitra"
              value={draf}
              onChange={(e) => setDraf(e.target.value)}
              placeholder={t.tulis}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-m-thumb border border-mitra-border px-14 py-10 text-m-body text-mitra-ink focus:border-mitra-primer focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draf.trim()}
              className="rounded-m-thumb bg-mitra-primer px-18 text-m-btn-baris text-white transition-colors duration-160 ease-base hover:bg-mitra-primer-hover disabled:bg-mitra-panel disabled:text-mitra-faint"
            >
              {t.kirim}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
