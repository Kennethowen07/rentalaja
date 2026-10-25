// Bahasa aktif untuk server component, dibaca dari segmen root [lang] lewat
// next/root-params, jadi tidak perlu dioper sebagai prop ke setiap komponen.
// Tidak bisa dipakai di client component; di sana pakai useBahasa().

import { lang } from "next/root-params";
import { adaBahasa, type Bahasa } from "@/lib/i18n";

export async function bahasaAktif(): Promise<Bahasa> {
  const nilai = await lang();
  return adaBahasa(nilai) ? nilai : "id";
}
