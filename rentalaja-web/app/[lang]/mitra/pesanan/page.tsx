// Layar Pesanan (#4a). Tab, baris pesanan, serta aksi Terima dan Tolak ada di
// DaftarPesanan karena butuh keadaan client; halaman ini hanya kerangkanya.

import DaftarPesanan from "@/components/mitra/DaftarPesanan";
import { HeaderHalaman, TombolLink } from "@/components/mitra/ui";
import { jalur } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilWaktuServer } from "@/lib/mitra/data";
import { kunciTabValid } from "@/lib/mitra/tab-pesanan";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function PesananMitra({ searchParams }: PageProps<"/[lang]/mitra/pesanan">) {
  const [{ tab }, sekarang, bahasa] = await Promise.all([searchParams, ambilWaktuServer(), bahasaAktif()]);
  const en = bahasa === "en";

  return (
    <>
      <HeaderHalaman
        kicker={tanggalPanjang(sekarang, bahasa)}
        judul={en ? "Bookings" : "Pesanan"}
        aksi={
          <>
            <TombolLink href={jalur(bahasa, "/mitra/pendapatan")} varian="sekunder">
              {en ? "Export" : "Ekspor"}
            </TombolLink>
            <TombolLink href={jalur(bahasa, "/mitra/unit")} varian="primer">
              {en ? "Add vehicle" : "Tambah unit"}
            </TombolLink>
          </>
        }
      />
      <DaftarPesanan tabAwal={kunciTabValid(typeof tab === "string" ? tab : undefined)} />
    </>
  );
}
