// Layar Pendapatan (#4e). Header ikut di komponen client karena kickernya
// berubah saat periode diganti.

import PendapatanPanel from "@/components/mitra/PendapatanPanel";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilDompet, ambilPendapatan } from "@/lib/mitra/data";

export default async function PendapatanMitra() {
  const bahasa = await bahasaAktif();
  const [periode, dompet] = await Promise.all([ambilPendapatan(bahasa), ambilDompet()]);
  return <PendapatanPanel periode={periode} dompet={dompet} />;
}
