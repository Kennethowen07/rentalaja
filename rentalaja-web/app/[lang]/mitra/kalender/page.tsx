// Layar Kalender unit (#4c). Seluruh isinya butuh keadaan client (pindah
// minggu, blokir tanggal), jadi header pun dirender di KalenderUnit supaya
// kicker ikut berubah saat minggunya digeser.

import KalenderUnit from "@/components/mitra/KalenderUnit";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilUnit, ambilWaktuServer } from "@/lib/mitra/data";

export default async function KalenderMitra() {
  const bahasa = await bahasaAktif();
  const [unit, sekarang] = await Promise.all([ambilUnit(bahasa), ambilWaktuServer()]);
  return <KalenderUnit unit={unit} sekarang={sekarang} />;
}
