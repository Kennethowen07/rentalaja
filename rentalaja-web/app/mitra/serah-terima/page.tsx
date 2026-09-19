// Layar Serah terima (#4d). Tab, pilihan baris, dan form catatan kondisi
// butuh keadaan client, jadi isinya ada di SerahTerimaPanel.

import SerahTerimaPanel from "@/components/mitra/SerahTerimaPanel";
import { ambilSerahTerima, ambilWaktuServer } from "@/lib/mitra/data";
import { kunciTabSerahValid } from "@/lib/mitra/tab-serah";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function SerahTerimaMitra({
  searchParams,
}: PageProps<"/mitra/serah-terima">) {
  const [{ tab }, daftar, sekarang] = await Promise.all([
    searchParams,
    ambilSerahTerima(),
    ambilWaktuServer(),
  ]);

  // Header ikut di komponen client karena tombolnya mengubah keadaan layar.
  return (
    <SerahTerimaPanel
      daftar={daftar}
      sekarang={sekarang}
      kicker={tanggalPanjang(sekarang)}
      tabAwal={kunciTabSerahValid(typeof tab === "string" ? tab : undefined)}
    />
  );
}
