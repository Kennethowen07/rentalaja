// Layar Pendapatan (#4e). Header ikut di komponen client karena kickernya
// berubah saat periode diganti.

import PendapatanPanel from "@/components/mitra/PendapatanPanel";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilPendapatan } from "@/lib/mitra/data";

export default async function PendapatanMitra() {
  const periode = await ambilPendapatan(await bahasaAktif());
  return <PendapatanPanel periode={periode} />;
}
