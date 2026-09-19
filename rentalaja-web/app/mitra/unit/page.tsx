import { LayarBelumDibangun } from "@/components/mitra/ui";
import { ambilBeranda } from "@/lib/mitra/data";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function UnitMitra() {
  const { sekarang } = await ambilBeranda();
  return <LayarBelumDibangun kicker={tanggalPanjang(sekarang)} judul="Unit kendaraan" />;
}
