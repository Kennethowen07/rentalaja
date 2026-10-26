// Layar 3 · Detail unit. Murni tampilan — seluruh datanya datang dari
// GET /api/units/:slug lewat halaman yang merender komponen ini.

import Image from "next/image";
import Link from "next/link";
import AvatarKosong from "@/components/ui/AvatarKosong";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { formatRupiah } from "@/lib/mock/units";
import { jalur, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import type { DetailUnit } from "@/lib/mock/unit-detail";
import { paramSewa } from "@/lib/sewa";

const TEKS = kamus({
  id: {
    mobil: "Mobil",
    motor: "Motor",
    foto: (nama: string) => `Foto ${nama}`,
    fotoUtama: "foto utama",
    fotoLainAlt: (nama: string) => `Foto lain ${nama}`,
    fotoLain: "foto lain",
    penyedia: "Penyedia",
    tanggalSewa: "Tanggal sewa",
    isiPaket: "Isi paket",
    tidakTermasuk: "Tidak termasuk",
    jaminan: "Jaminan dan syarat ketentuan",
    rincian: "Rincian pembayaran",
    kaliHari: (harga: string, hari: number) => `${harga} × ${hari} hari`,
    antar: (area: string) => `Antar jemput ${area}`,
    gratis: "Gratis",
    layanan: "Biaya layanan",
    total: "Total bayar",
    pesan: "Pesan unit ini",
    ganti: "Ganti tanggal",
  },
  en: {
    mobil: "Car",
    motor: "Scooter",
    foto: (nama: string) => `Photo of ${nama}`,
    fotoUtama: "main photo",
    fotoLainAlt: (nama: string) => `Another photo of ${nama}`,
    fotoLain: "more photos",
    penyedia: "Provider",
    tanggalSewa: "Rental dates",
    isiPaket: "What's included",
    tidakTermasuk: "Not included",
    jaminan: "Requirements and terms",
    rincian: "Payment details",
    kaliHari: (harga: string, hari: number) => `${harga} × ${hari} ${hari === 1 ? "day" : "days"}`,
    antar: (area: string) => `Delivery and pick-up, ${area}`,
    gratis: "Free",
    layanan: "Service fee",
    total: "Total",
    pesan: "Book this vehicle",
    ganti: "Change dates",
  },
});

function Seksi({
  judul,
  children,
}: {
  judul: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-18 border-t border-line pt-16">
      <h2 className="text-section-sm text-ink">{judul}</h2>
      {children}
    </section>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-12">
      <dt className="text-row text-muted">{label}</dt>
      <dd className="text-row-value text-ink">{nilai}</dd>
    </div>
  );
}

export default async function UnitDetail({ data }: { data: DetailUnit }) {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];
  const { unit, harga } = data;

  return (
    <div className="container-page pt-18 pb-28">
      <p className="mb-14 text-meta text-muted">
        {unit.kategori === "mobil" ? t.mobil : t.motor} · {unit.area} · {data.rentangLabel} &nbsp;›&nbsp;{" "}
        <span className="text-nav-strong text-ink">{unit.nama}</span>
      </p>

      <div className="grid items-start gap-24 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Galeri */}
          <div className="grid h-230 grid-cols-[2fr_1fr] gap-8">
            <div className="relative overflow-hidden rounded-result">
              {unit.foto ? (
                <Image
                  src={unit.foto}
                  alt={t.foto(unit.nama)}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder
                  label={t.fotoUtama}
                  className="absolute inset-0"
                />
              )}
            </div>
            <div className="grid grid-rows-2 gap-8">
              {[0, 1].map((i) =>
                data.fotoLain[i] ? (
                  <div key={i} className="relative overflow-hidden rounded-result">
                    <Image
                      src={data.fotoLain[i]}
                      alt={t.fotoLainAlt(unit.nama)}
                      fill
                      sizes="(min-width: 1024px) 25vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <ImagePlaceholder key={i} label={t.fotoLain} className="rounded-result" />
                ),
              )}
            </div>
          </div>

          <h1 className="mt-18 text-h-unit text-ink">{unit.nama}</h1>

          {/* Penyedia sengaja ditaruh di atas, sebelum detail unit:
              siapa yang menyewakan adalah pertanyaan pertama penyewa yang
              tidak kenal siapa pun di kota itu (design brief, bagian
              "Dua sisi pengguna"). Desain menaruhnya paling bawah. */}
          <Seksi judul={t.penyedia}>
            <div className="mt-10 flex items-center gap-12">
              <AvatarKosong className="size-44" />
              <div>
                <p className="text-section-sm text-ink">{data.penyedia.nama}</p>
                <p className="mt-2 whitespace-pre-line text-body text-muted">{data.penyedia.meta}</p>
              </div>
            </div>
          </Seksi>

          {/* Hanya hari-hari yang disewa. Unit yang dibuka dari pencarian
              sudah pasti kosong di rentang ini, jadi tanpa status per hari. */}
          <Seksi judul={t.tanggalSewa}>
            {/* Grid tetap, bukan flex-wrap: kotak terakhir tidak melebar
                sendirian di baris baru, dan sewa panjang terbaca per minggu. */}
            <ul className="mt-10 grid grid-cols-4 gap-6 sm:grid-cols-7">
              {data.hariSewa.map((h) => (
                <li
                  key={h.hari + h.tanggal}
                  className="rounded-input border border-chip-border bg-green-100 py-10 text-center text-green-700"
                >
                  <p className="text-cal-date">{h.tanggal}</p>
                  <p className="mt-2 text-cal-dow">{h.hari}</p>
                </li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul={t.isiPaket}>
            {/* list-inside, bukan pl-18: marker "outside" di dalam sel grid
                bisa meluber ke gap kolom sebelahnya. */}
            <ul className="mt-10 grid list-disc list-inside gap-9 text-item text-ink marker:text-green-700 sm:grid-cols-2">
              {data.paket.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul={t.tidakTermasuk}>
            <ul className="mt-6 grid list-disc gap-6 pl-18 text-prose text-ink marker:text-green-700">
              {data.tidakTermasuk.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Seksi>

          <Seksi judul={t.jaminan}>
            <ul className="mt-9 grid list-disc gap-8 rounded-result border border-line bg-surface-3 py-14 pr-14 pl-32 text-prose text-ink marker:text-green-700">
              {data.jaminan.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Seksi>

        </div>

        {/* Panel harga sticky */}
        <aside className="rounded-card border border-line p-18 lg:sticky lg:top-76">
          <h2 className="text-section-sm text-ink">{t.rincian}</h2>

          <dl className="mt-14 grid gap-8">
            <Baris
              label={t.kaliHari(formatRupiah(harga.perHari), data.hari)}
              nilai={formatRupiah(harga.subtotal)}
            />
            <Baris label={t.antar(unit.area)} nilai={t.gratis} />
            <Baris label={t.layanan} nilai={formatRupiah(harga.layanan)} />
          </dl>

          <div className="mt-12 flex items-baseline justify-between gap-12 border-t border-line pt-12">
            <p className="text-total-label text-ink">{t.total}</p>
            <p className="text-total text-ink">{formatRupiah(harga.total)}</p>
          </div>

          {/* Unit dan tanggal ikut dibawa, supaya halaman pemesanan memesan
              unit yang benar-benar diklik dengan rentang yang sama. */}
          <Link
            href={jalur(bahasa, `/pemesanan?unit=${unit.id}&${paramSewa(data.sewa)}`)}
            className="mt-14 block rounded-input bg-green-700 py-13 text-center text-btn text-white transition-colors duration-160 ease-base hover:bg-green-800"
          >
            {t.pesan}
          </Link>
          <Link
            href={jalur(bahasa, `/cari?${paramSewa(data.sewa)}`)}
            className="mt-8 block rounded-input border border-line py-11 text-center text-nav-strong text-ink transition-colors duration-160 ease-base hover:border-green-700 hover:text-green-700"
          >
            {t.ganti}
          </Link>
        </aside>
      </div>
    </div>
  );
}
