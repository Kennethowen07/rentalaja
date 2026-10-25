import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { PesananProvider } from "@/components/mitra/PesananProvider";
import Sidebar from "@/components/mitra/Sidebar";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilMitra, ambilPesanan } from "@/lib/mitra/data";

// README mitra: Instrument Sans, bukan Plus Jakarta Sans seperti sisi
// penyewa, karena panel dipakai berjam-jam di desktop. Variable font, jadi
// weight 400/500/600/700 tercakup satu deklarasi.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const bahasa = await bahasaAktif();
  return { title: bahasa === "en" ? "Partner panel · rentalaja" : "Panel mitra · rentalaja" };
}

export default async function LayoutMitra({ children }: LayoutProps<"/[lang]/mitra">) {
  const bahasa = await bahasaAktif();
  const [mitra, { sekarangServer, pesanan }] = await Promise.all([
    ambilMitra(),
    ambilPesanan(bahasa),
  ]);

  return (
    <div
      className={`${instrument.variable} panel-mitra flex flex-1 flex-col bg-white font-mitra text-mitra-ink min-[900px]:flex-row`}
    >
      <PesananProvider sekarangServer={sekarangServer} pesanan={pesanan}>
        <Sidebar mitra={mitra} />
        <main className="min-w-0 flex-1 px-20 pt-28 pb-40 min-[640px]:px-32 min-[900px]:pt-40 min-[900px]:pb-44 min-[1100px]:px-48">
          {children}
        </main>
      </PesananProvider>
    </div>
  );
}
