// Layar Ulasan (#4f). Chip saring, balasan, dan urutan butuh keadaan client,
// jadi seluruh isinya ada di UlasanPanel.

import UlasanPanel from "@/components/mitra/UlasanPanel";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilUlasan } from "@/lib/mitra/data";
import { kunciFilterUlasanValid } from "@/lib/mitra/filter-ulasan";

export default async function UlasanMitra({ searchParams }: PageProps<"/[lang]/mitra/ulasan">) {
  const bahasa = await bahasaAktif();
  const [{ saring }, { daftar, ringkasan }] = await Promise.all([searchParams, ambilUlasan(bahasa)]);

  return (
    <UlasanPanel
      daftar={daftar}
      ringkasan={ringkasan}
      filterAwal={kunciFilterUlasanValid(typeof saring === "string" ? saring : undefined)}
    />
  );
}
