// Format angka rupiah panel mitra. Dipisah dari waktu.ts supaya jelas
// tempatnya, dan tetap bisa dipakai komponen server maupun client.

import type { Bahasa } from "@/lib/i18n";

export function rupiah(nilai: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

/** "Rp 24,8jt" (id) atau "Rp 24.8M" (en) untuk angka besar di kartu metrik.
 *  Di bawah satu juta tetap ditulis utuh supaya tidak muncul "Rp 0,1jt". */
export function rupiahSingkat(nilai: number, bahasa: Bahasa = "id") {
  if (nilai < 1_000_000) return rupiah(nilai);
  const juta = nilai / 1_000_000;
  const angka = juta >= 100 ? Math.round(juta).toString() : juta.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return bahasa === "en" ? `Rp ${angka}M` : `Rp ${angka.replace(".", ",")}jt`;
}
