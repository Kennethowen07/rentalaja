// Layar Serah terima (#4d). Jadwalnya diturunkan dari pesanan di
// SerahTerimaPanel, jadi halaman ini hanya mengirim catatan yang sudah ada.

import SerahTerimaPanel from "@/components/mitra/SerahTerimaPanel";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilCatatanSerah, ambilWaktuServer } from "@/lib/mitra/data";
import { kunciTabSerahValid } from "@/lib/mitra/tab-serah";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function SerahTerimaMitra({
  searchParams,
}: PageProps<"/[lang]/mitra/serah-terima">) {
  const bahasa = await bahasaAktif();
  const [{ tab }, catatan, sekarang] = await Promise.all([
    searchParams,
    ambilCatatanSerah(bahasa),
    ambilWaktuServer(),
  ]);

  return (
    <SerahTerimaPanel
      catatanAwal={catatan}
      kicker={tanggalPanjang(sekarang, bahasa)}
      tabAwal={kunciTabSerahValid(typeof tab === "string" ? tab : undefined)}
    />
  );
}
