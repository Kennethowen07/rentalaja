import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import AkunProvider from "@/components/auth/AkunProvider";
import { BahasaProvider } from "@/components/BahasaProvider";
import { BAHASA, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";

// README/Assets: Plus Jakarta Sans 400-800. Variable font, jadi satu
// deklarasi sudah mencakup seluruh rentang weight yang dipakai desain.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const TEKS = kamus({
  id: {
    judul: "rentalaja — Sewa motor dan mobil di Bali",
    deskripsi:
      "Sewa kendaraan tanpa ribet. Pilih tanggal, lihat unit yang kosong, langsung pesan. Motor dan mobil di Bali, diantar ke tempatmu.",
  },
  en: {
    judul: "rentalaja — Scooter and car rental in Bali",
    deskripsi:
      "Rent a vehicle without the hassle. Pick your dates, see what's available, book right away. Scooters and cars in Bali, delivered to you.",
  },
});

// Hanya /id dan /en; segmen lain jadi 404. URL tanpa awalan sudah ditulis
// ulang ke /id oleh proxy.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return BAHASA.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];
  return {
    title: t.judul,
    description: t.deskripsi,
    alternates: { languages: { id: "/", en: "/en" } },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const bahasa = await bahasaAktif();
  return (
    <html lang={bahasa} className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">
        <BahasaProvider bahasa={bahasa}>
          <AkunProvider>{children}</AkunProvider>
        </BahasaProvider>
      </body>
    </html>
  );
}
