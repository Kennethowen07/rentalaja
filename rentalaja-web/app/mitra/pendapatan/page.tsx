import { LayarBelumDibangun } from "@/components/mitra/ui";
import { ambilBeranda } from "@/lib/mitra/data";
import { tanggalPanjang } from "@/lib/mitra/waktu";

export default async function PendapatanMitra() {
  const { sekarang } = await ambilBeranda();
  return <LayarBelumDibangun kicker={tanggalPanjang(sekarang)} judul="Pendapatan" />;
}
