import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// README/Assets: Plus Jakarta Sans 400-800. Variable font, jadi satu
// deklarasi sudah mencakup seluruh rentang weight yang dipakai desain.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "rentalaja — Sewa motor dan mobil di Bali",
  description:
    "Sewa kendaraan tanpa ribet. Pilih tanggal, lihat unit yang kosong, langsung pesan. Motor dan mobil di Bali, diantar ke tempatmu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
