// Teks status dana yang dipakai data mock (server) dan PesananProvider
// (client) saat pesanan ditolak atau batal otomatis. Dipisah dari data.ts
// karena data.ts memakai next/server dan tidak boleh masuk bundel client.

import type { Bahasa } from "@/lib/i18n";

export function teksStatusBayar(bahasa: Bahasa) {
  const en = bahasa === "en";
  return {
    escrow: en ? "Paid in full · in escrow" : "Dibayar penuh · di escrow",
    ditahan: en ? "Held in escrow" : "Ditahan escrow",
    dilepas: en ? "Funds released" : "Dana dilepas",
    dikembalikan: en ? "Funds refunded" : "Dana dikembalikan",
  };
}
