// Layar Unit kendaraan (#4b). Chip filter dan aksi Edit butuh keadaan client,
// jadi isinya ada di DaftarUnit.

import DaftarUnit from "@/components/mitra/DaftarUnit";
import { HeaderHalaman, TombolLink } from "@/components/mitra/ui";
import { jalur } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilUnit } from "@/lib/mitra/data";
import { kunciFilterValid } from "@/lib/mitra/filter-unit";

export default async function UnitMitra({ searchParams }: PageProps<"/[lang]/mitra/unit">) {
  const bahasa = await bahasaAktif();
  const en = bahasa === "en";
  const [{ status }, unit] = await Promise.all([searchParams, ambilUnit(bahasa)]);

  return (
    <>
      <HeaderHalaman
        kicker={en ? `${unit.length} vehicles listed` : `${unit.length} unit terdaftar`}
        judul={en ? "Vehicles" : "Unit kendaraan"}
        aksi={
          <>
            <TombolLink href={jalur(bahasa, "/mitra/kalender")} varian="sekunder">
              {en ? "Import from file" : "Impor dari file"}
            </TombolLink>
            <TombolLink href={jalur(bahasa, "/mitra/unit")} varian="primer">
              {en ? "Add vehicle" : "Tambah unit"}
            </TombolLink>
          </>
        }
      />
      <DaftarUnit
        unit={unit}
        filterAwal={kunciFilterValid(typeof status === "string" ? status : undefined)}
      />
    </>
  );
}
