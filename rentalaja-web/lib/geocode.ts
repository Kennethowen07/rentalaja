// Mengubah alamat jadi koordinat dan sebaliknya lewat Nominatim, layanan
// geocoding gratis milik OpenStreetMap. Tanpa API key dan tanpa kartu.
//
// Aturan pemakaian Nominatim (operations.osmfoundation.org/policies/nominatim):
// maksimal 1 permintaan per detik dan tidak untuk autocomplete per huruf.
// Karena itu pemanggil wajib menunda permintaan (debounce) sampai pengguna
// berhenti mengetik, dan hasilnya disimpan di cache supaya alamat yang sama
// tidak ditanyakan dua kali. Untuk produk dengan banyak pengguna, ganti ke
// penyedia geocoding berbayar atau server Nominatim sendiri.
//
// Yang dikirim ke Nominatim: teks alamat yang diketik penyewa atau koordinat
// pin. Tidak ada data pribadi lain.

export type Koordinat = [lat: number, lng: number];

const DASAR = "https://nominatim.openstreetmap.org";

/** Jarak garis lurus dua titik dalam km (rumus haversine). */
export function jarakKm(a: Koordinat, b: Koordinat): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Kotak Bali (kiri, atas, kanan, bawah), supaya "Jl. Pantai" tidak
 *  mendarat di pantai provinsi lain. */
const KOTAK_BALI = "114.4,-8.0,115.8,-8.95";

const cacheCari = new Map<string, Koordinat | null>();
const cacheBalik = new Map<string, string | null>();

export async function cariAlamat(alamat: string, signal?: AbortSignal): Promise<Koordinat | null> {
  const kunci = alamat.trim().toLowerCase();
  if (cacheCari.has(kunci)) return cacheCari.get(kunci)!;

  const url =
    `${DASAR}/search?format=jsonv2&limit=1&countrycodes=id&bounded=1` +
    `&viewbox=${KOTAK_BALI}&accept-language=id&q=${encodeURIComponent(alamat)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [hasil] = (await res.json()) as { lat: string; lon: string }[];
  const titik: Koordinat | null = hasil ? [Number(hasil.lat), Number(hasil.lon)] : null;
  cacheCari.set(kunci, titik);
  return titik;
}

type AlamatNominatim = {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
};

/** Koordinat jadi alamat pendek, mis. "Jalan Pantai Batu Bolong, Canggu". */
export async function alamatDari(titik: Koordinat, signal?: AbortSignal): Promise<string | null> {
  const kunci = titik.map((n) => n.toFixed(5)).join(",");
  if (cacheBalik.has(kunci)) return cacheBalik.get(kunci)!;

  const url =
    `${DASAR}/reverse?format=jsonv2&zoom=18&accept-language=id` +
    `&lat=${titik[0]}&lon=${titik[1]}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as { display_name?: string; address?: AlamatNominatim };

  const a = data.address ?? {};
  const jalan = a.road ? (a.house_number ? `${a.road} No. ${a.house_number}` : a.road) : null;
  const daerah = a.village ?? a.suburb ?? a.neighbourhood ?? a.town ?? a.city_district ?? a.city;
  const pendek = [jalan, daerah].filter(Boolean).join(", ");
  const label = pendek || data.display_name?.split(", ").slice(0, 3).join(", ") || null;
  cacheBalik.set(kunci, label);
  return label;
}
