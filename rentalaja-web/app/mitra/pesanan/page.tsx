// Layar Pesanan (#4a). Tab, baris pesanan, serta aksi Terima dan Tolak ada di
// DaftarPesanan karena butuh keadaan client; halaman ini hanya kerangkanya.

import DaftarPesanan from "@/components/mitra/DaftarPesanan";
import { HeaderHalaman, TombolLink } from "@/components/mitra/ui";
import { ambilWaktuServer } from "@/lib/mitra/data";
import { kunciTabValid } from "@/lib/mitra/tab-pesanan";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function PesananMitra({ searchParams }: PageProps<"/mitra/pesanan">) {
  const [{ tab }, sekarang] = await Promise.all([searchParams, ambilWaktuServer()]);

  return (
    <>
      <HeaderHalaman
        kicker={tanggalPanjang(sekarang)}
        judul="Pesanan"
        aksi={
          <>
            <TombolLink href="/mitra/pendapatan" varian="sekunder">
              Ekspor
            </TombolLink>
            <TombolLink href="/mitra/unit" varian="primer">
              Tambah unit
            </TombolLink>
          </>
        }
      />
      <DaftarPesanan tabAwal={kunciTabValid(typeof tab === "string" ? tab : undefined)} />
    </>
  );
}
