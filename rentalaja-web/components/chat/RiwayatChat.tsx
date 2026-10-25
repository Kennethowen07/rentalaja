"use client";

// Halaman /chat: daftar percakapan di kiri, isi percakapan di kanan. Di HP
// hanya satu yang tampil: daftar, atau percakapan yang sedang dibuka.
//
// Pesan baru hanya ditambahkan ke state halaman ini (lihat lib/mock/chat.ts).

import { useEffect, useRef, useState } from "react";
import { useAkun } from "@/components/auth/AkunProvider";
import { useBahasa } from "@/components/BahasaProvider";
import AvatarKosong from "@/components/ui/AvatarKosong";
import { kamus, lokal, type Bahasa } from "@/lib/i18n";
import { daftarPercakapan, type Percakapan } from "@/lib/mock/chat";

const TEKS = kamus({
  id: {
    belumMasuk: "Masuk untuk melihat chat",
    belumMasukSub: "Riwayat chat dengan penyedia tersimpan di akunmu.",
    masuk: "Masuk",
    daftarChat: "Daftar chat",
    chat: "Chat",
    kamu: "Kamu: ",
    belumDibaca: "Belum dibaca",
    chatDengan: (nama: string) => `Chat dengan ${nama}`,
    kembali: "Kembali ke daftar chat",
    tulisUntuk: (nama: string) => `Tulis pesan untuk ${nama}`,
    tulis: "Tulis pesan",
    kirim: "Kirim",
  },
  en: {
    belumMasuk: "Log in to see your chats",
    belumMasukSub: "Your chat history with providers is saved to your account.",
    masuk: "Log in",
    daftarChat: "Chat list",
    chat: "Chat",
    kamu: "You: ",
    belumDibaca: "Unread",
    chatDengan: (nama: string) => `Chat with ${nama}`,
    kembali: "Back to chat list",
    tulisUntuk: (nama: string) => `Write a message to ${nama}`,
    tulis: "Write a message",
    kirim: "Send",
  },
});

/** "25 Okt, 17.43" (id) atau "25 Oct, 17:43" (en), sama dengan data mock. */
function waktuSekarang(bahasa: Bahasa): string {
  const format = new Intl.DateTimeFormat(lokal(bahasa), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Makassar",
  });
  const b = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${b.day} ${b.month}, ${b.hour}${bahasa === "id" ? "." : ":"}${b.minute}`;
}

function BelumMasuk({ t }: { t: (typeof TEKS)["id"] }) {
  const { mintaMasuk } = useAkun();
  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-line p-24 text-center">
      <h1 className="text-section-sm text-ink">{t.belumMasuk}</h1>
      <p className="mt-6 text-body text-muted">{t.belumMasukSub}</p>
      <button
        type="button"
        onClick={() => mintaMasuk("masuk")}
        className="mt-16 w-full rounded-input bg-green-700 py-11 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800"
      >
        {t.masuk}
      </button>
    </div>
  );
}

export default function RiwayatChat({ dengan }: { dengan?: string }) {
  const { akun } = useAkun();
  const { bahasa } = useBahasa();
  const t = TEKS[bahasa];
  const [percakapan, setPercakapan] = useState<Percakapan[]>(() =>
    daftarPercakapan(bahasa).map((p) => (p.id === dengan ? { ...p, belumDibaca: false } : p)),
  );
  const [aktifId, setAktifId] = useState<string | null>(
    daftarPercakapan(bahasa).some((p) => p.id === dengan) ? dengan! : null,
  );
  const [draf, setDraf] = useState("");
  const isiRef = useRef<HTMLDivElement>(null);

  const aktif = percakapan.find((p) => p.id === aktifId) ?? null;

  // Selalu tampilkan pesan terbaru di bawah.
  useEffect(() => {
    const el = isiRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [aktifId, aktif?.pesan.length]);

  if (!akun) return <BelumMasuk t={t} />;

  function buka(id: string) {
    setAktifId(id);
    setPercakapan((semua) => semua.map((p) => (p.id === id ? { ...p, belumDibaca: false } : p)));
  }

  function kirim() {
    const teks = draf.trim();
    if (!teks || !aktifId) return;
    setPercakapan((semua) =>
      semua.map((p) =>
        p.id === aktifId ? { ...p, pesan: [...p.pesan, { dari: "saya", teks, waktu: waktuSekarang(bahasa) }] } : p,
      ),
    );
    setDraf("");
  }

  return (
    // Tinggi tetap 600px di semua layar (permintaan pemilik proyek), bukan
    // mengikuti tinggi jendela browser.
    // Belum ada chat yang dibuka: daftar saja, selebar penuh, tanpa panel
    // kosong di kanan.
    <div className={`grid h-600 overflow-hidden rounded-card border border-line ${aktif ? "lg:grid-cols-[300px_1fr]" : ""}`}>
      {/* Daftar percakapan */}
      <section aria-label={t.daftarChat} className={`min-h-0 flex-col border-line lg:flex ${aktif ? "hidden lg:border-r" : "flex"}`}>
        <h1 className="border-b border-line px-16 py-14 text-section-sm text-ink">{t.chat}</h1>
        <ul className="flex-1 overflow-y-auto">
          {percakapan.map((p) => {
            const terakhir = p.pesan[p.pesan.length - 1];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => buka(p.id)}
                  aria-current={p.id === aktifId ? "true" : undefined}
                  className={`flex w-full gap-11 border-b border-line px-16 py-12 text-left transition-colors duration-160 ease-base hover:bg-surface-2 ${
                    p.id === aktifId ? "bg-green-100" : ""
                  }`}
                >
                  <AvatarKosong className="size-40" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-8">
                      <span className={`truncate text-panel text-ink ${p.belumDibaca ? "font-bold" : ""}`}>{p.penyedia}</span>
                      <span className="shrink-0 text-micro text-muted">{terakhir.waktu}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-8">
                      <span className={`truncate text-body-sm ${p.belumDibaca ? "text-ink" : "text-muted"}`}>
                        {terakhir.dari === "saya" ? t.kamu : ""}
                        {terakhir.teks}
                      </span>
                      {p.belumDibaca && (
                        <span className="ml-auto size-8 shrink-0 rounded-pill bg-green-700">
                          <span className="sr-only">{t.belumDibaca}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Isi percakapan */}
      {aktif ? (
        <section aria-label={t.chatDengan(aktif.penyedia)} className="flex min-h-0 flex-col">
          <div className="flex items-center gap-11 border-b border-line px-16 py-11">
            <button
              type="button"
              onClick={() => setAktifId(null)}
              aria-label={t.kembali}
              className="-ml-8 grid size-36 place-items-center rounded-pill text-ink hover:bg-surface-2 lg:hidden"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <AvatarKosong className="size-36" />
            <div className="min-w-0">
              <h2 className="truncate text-panel text-ink">{aktif.penyedia}</h2>
              <p className="truncate text-micro text-muted">{aktif.pesanan}</p>
            </div>
          </div>

          <div ref={isiRef} className="flex flex-1 flex-col gap-10 overflow-y-auto bg-surface-3 px-16 py-16">
            {aktif.pesan.map((m, i) => (
              <div key={i} className={`flex max-w-[78%] flex-col ${m.dari === "saya" ? "items-end self-end" : "items-start self-start"}`}>
                <p
                  className={`rounded-[14px] px-12 py-9 text-body ${
                    m.dari === "saya" ? "rounded-br-[4px] bg-green-700 text-white" : "rounded-bl-[4px] border border-line bg-white text-ink"
                  }`}
                >
                  {m.teks}
                </p>
                <span className="mt-3 text-micro text-muted">{m.waktu}</span>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              kirim();
            }}
            className="flex gap-8 border-t border-line p-12"
          >
            <label htmlFor="pesan-baru" className="sr-only">
              {t.tulisUntuk(aktif.penyedia)}
            </label>
            <input
              id="pesan-baru"
              value={draf}
              onChange={(e) => setDraf(e.target.value)}
              placeholder={t.tulis}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-input border border-line px-14 py-11 text-body text-ink placeholder:text-placeholder focus:border-green-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draf.trim()}
              className="rounded-input bg-green-700 px-18 text-panel text-white transition-colors duration-160 ease-base hover:bg-green-800 disabled:bg-surface-2 disabled:text-muted"
            >
              {t.kirim}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
