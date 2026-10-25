"use client";

// Peta OpenStreetMap lewat Leaflet. Jangan diimpor langsung: Leaflet butuh
// window, jadi file ini dimuat lewat next/dynamic tanpa SSR di PetaLokasi.
//
// Ubin peta dari tile.openstreetmap.org: gratis tanpa key, dengan aturan
// pemakaian wajar (operations.osmfoundation.org/policies/tiles). Atribusi
// "© OpenStreetMap" wajib tampil, dan memang tampil di pojok kanan bawah.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Koordinat } from "@/lib/geocode";

// Ikon bawaan Leaflet dimuat dari path gambar relatif yang rusak setelah
// dibundel. Pin SVG hijau brand dipakai sebagai gantinya.
const ikonPin = L.divIcon({
  className: "",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16 41s14-13.2 14-24.5C30 8.4 23.7 2 16 2S2 8.4 2 16.5C2 27.8 16 41 16 41z" fill="#0f6b4f" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="16" cy="16.5" r="5.5" fill="#ffffff"/>
  </svg>`,
});

/** Menggeser peta ke posisi baru kalau posisinya di luar area yang sedang
 *  terlihat, mis. setelah alamat yang diketik ketemu. Klik dan geser pin
 *  selalu di dalam area terlihat, jadi tidak menggeser atau men-zoom peta:
 *  pengguna yang sedang zoom out untuk mencari tidak dipaksa zoom in lagi. */
function IkutiPosisi({ posisi }: { posisi: Koordinat }) {
  const peta = useMap();
  useEffect(() => {
    if (peta.getBounds().contains(posisi)) return;
    peta.setView(posisi, Math.max(peta.getZoom(), 16), { animate: true });
  }, [peta, posisi]);
  return null;
}

function KlikPeta({ onPindah }: { onPindah: (titik: Koordinat) => void }) {
  useMapEvents({
    click: (e) => onPindah([e.latlng.lat, e.latlng.lng]),
  });
  return null;
}

export default function PetaLeaflet({
  posisi,
  interaktif,
  onPindah,
}: {
  posisi: Koordinat;
  /** true: klik peta atau geser pin untuk memindahkan titik. */
  interaktif: boolean;
  onPindah: (titik: Koordinat) => void;
}) {
  return (
    <MapContainer
      center={posisi}
      zoom={16}
      // Gulir halaman tidak boleh tersangkut jadi zoom peta.
      scrollWheelZoom={false}
      className="size-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <IkutiPosisi posisi={posisi} />
      {interaktif && <KlikPeta onPindah={onPindah} />}
      <Marker
        position={posisi}
        icon={ikonPin}
        draggable={interaktif}
        keyboard={false}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = (e.target as L.Marker).getLatLng();
            onPindah([lat, lng]);
          },
        }}
      />
    </MapContainer>
  );
}
