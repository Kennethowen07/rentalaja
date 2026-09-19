// Layar Serah terima (#4d). Jadwalnya diturunkan dari pesanan di
// SerahTerimaPanel, jadi halaman ini hanya mengirim catatan yang sudah ada.

import SerahTerimaPanel from "@/components/mitra/SerahTerimaPanel";
import { ambilCatatanSerah, ambilWaktuServer } from "@/lib/mitra/data";
import { kunciTabSerahValid } from "@/lib/mitra/tab-serah";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function SerahTerimaMitra({
  searchParams,
}: PageProps<"/mitra/serah-terima">) {
  const [{ tab }, catatan, sekarang] = await Promise.all([
    searchParams,
    ambilCatatanSerah(),
    ambilWaktuServer(),
  ]);

  return (
    <SerahTerimaPanel
      catatanAwal={catatan}
      kicker={tanggalPanjang(sekarang)}
      tabAwal={kunciTabSerahValid(typeof tab === "string" ? tab : undefined)}
    />
  );
}
