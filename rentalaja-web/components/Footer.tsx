// Beranda v3, footer (design-lab/approved/round-1.html). Dipakai di semua
// halaman sisi penyewa. Logo kini gambar (versi putih lewat filter),
// bukan teks "rentalaja".

import Image from "next/image";
import Link from "next/link";
import { jalur, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";

const TEKS = kamus({
  id: {
    tagline: "Sewa motor dan mobil di Bali dengan ketersediaan yang bisa dipercaya.",
    kolom: [
      {
        judul: "Penyewa",
        items: [
          { label: "Cari unit", href: "/cari" },
          { label: "Cara kerja", href: "/#cara-kerja" },
          { label: "Bantuan", href: "/#faq" },
        ],
      },
      {
        judul: "Penyedia",
        items: [
          { label: "Daftarkan rental", href: "/jadi-penyedia" },
          { label: "Dashboard", href: "/mitra" },
          { label: "Biaya layanan", href: "#" },
        ],
      },
      {
        judul: "Perusahaan",
        items: [
          { label: "Tentang", href: "#" },
          { label: "Kebijakan privasi", href: "#" },
          { label: "Syarat dan ketentuan", href: "#" },
        ],
      },
    ],
    fotoBebas: "Foto kendaraan berlisensi bebas dari Wikimedia Commons —",
    kredit: "kredit dan lisensi",
  },
  en: {
    tagline: "Scooter and car rental in Bali with availability you can trust.",
    kolom: [
      {
        judul: "Renters",
        items: [
          { label: "Find a vehicle", href: "/cari" },
          { label: "How it works", href: "/#cara-kerja" },
          { label: "Help", href: "/#faq" },
        ],
      },
      {
        judul: "Providers",
        items: [
          { label: "List your rental", href: "/jadi-penyedia" },
          { label: "Dashboard", href: "/mitra" },
          { label: "Service fee", href: "#" },
        ],
      },
      {
        judul: "Company",
        items: [
          { label: "About", href: "#" },
          { label: "Privacy policy", href: "#" },
          { label: "Terms and conditions", href: "#" },
        ],
      },
    ],
    fotoBebas: "Vehicle photos are freely licensed from Wikimedia Commons —",
    kredit: "credits and licenses",
  },
});

export default async function Footer() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];

  return (
    <footer className="skala-beranda mt-auto bg-green-950 pt-56 pb-24 text-white md:pt-72 md:pb-32">
      <div className="container-beranda">
        <div className="grid grid-cols-2 gap-x-16 gap-y-32 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-24 min-[75rem]:grid-cols-[4fr_1fr_2fr_2fr_2fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/logo-rentalaja.png"
              alt="rentalaja"
              width={402}
              height={240}
              className="h-40 w-auto brightness-0 invert"
            />
            <p className="mt-16 max-w-340 text-b5-sm text-green-350 md:text-b5">{t.tagline}</p>
          </div>
          <div aria-hidden className="hidden min-[75rem]:block" />
          {t.kolom.map((kolom) => (
            <div key={kolom.judul}>
              <h2 className="text-b6-sm font-bold md:text-b6">{kolom.judul}</h2>
              <ul className="mt-4 md:mt-16 md:grid md:gap-12">
                {kolom.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href === "#" ? "#" : jalur(bahasa, item.href)}
                      className="flex min-h-44 items-center text-b6-sm font-medium text-green-350 underline-offset-3 transition-colors duration-160 ease-beranda hover:text-white hover:underline md:inline md:min-h-0 md:text-b6"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-32 flex flex-col gap-8 border-t border-white/12 pt-24 text-b6-sm text-green-350 md:mt-48 md:flex-row md:flex-wrap md:justify-between md:gap-16 md:text-b6">
          <p>© 2026 rentalaja</p>
          {/* Wajib ada: foto unit berlisensi CC BY-SA mensyaratkan atribusi
              tampil di tempat fotonya dipakai. Daftarnya terlalu panjang untuk
              footer, jadi isinya di /kredit. Jangan hapus tautan ini selama
              foto-foto itu masih dipakai. */}
          <p>
            {t.fotoBebas}{" "}
            <Link
              href={jalur(bahasa, "/kredit")}
              className="underline underline-offset-3 transition-colors duration-160 ease-beranda hover:text-white"
            >
              {t.kredit}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
