// Format angka rupiah panel mitra. Dipisah dari waktu.ts supaya jelas
// tempatnya, dan tetap bisa dipakai komponen server maupun client.

export function rupiah(nilai: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

/** "Rp 24,8jt" untuk angka besar di kartu metrik. Di bawah satu juta tetap
 *  ditulis utuh supaya tidak muncul "Rp 0,1jt". */
export function rupiahSingkat(nilai: number) {
  if (nilai < 1_000_000) return rupiah(nilai);
  const juta = nilai / 1_000_000;
  const angka = juta >= 100 ? Math.round(juta).toString() : juta.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `Rp ${angka.replace(".", ",")}jt`;
}
