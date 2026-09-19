// Layar Unit kendaraan (#4b). Chip filter dan aksi Edit butuh keadaan client,
// jadi isinya ada di DaftarUnit.

import DaftarUnit from "@/components/mitra/DaftarUnit";
import { HeaderHalaman, TombolLink } from "@/components/mitra/ui";
import { ambilUnit } from "@/lib/mitra/data";
import { kunciFilterValid } from "@/lib/mitra/filter-unit";

export default async function UnitMitra({ searchParams }: PageProps<"/mitra/unit">) {
  const [{ status }, unit] = await Promise.all([searchParams, ambilUnit()]);

  return (
    <>
      <HeaderHalaman
        kicker={`${unit.length} unit terdaftar`}
        judul="Unit kendaraan"
        aksi={
          <>
            <TombolLink href="/mitra/kalender" varian="sekunder">
              Impor dari file
            </TombolLink>
            <TombolLink href="/mitra/unit" varian="primer">
              Tambah unit
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
