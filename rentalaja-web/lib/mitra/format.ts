// Format angka rupiah panel mitra. Dipisah dari waktu.ts supaya jelas
// tempatnya, dan tetap bisa dipakai komponen server maupun client.

export function rupiah(nilai: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(nilai)}`;
}
