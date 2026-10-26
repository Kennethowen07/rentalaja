// Beranda panel mitra, layar acuan #3a di design_handoff_rentalaja_mitra.

import Link from "next/link";
import CalloutPesanan from "@/components/mitra/CalloutPesanan";
import { HeaderHalaman, ThumbnailUnit, TitikStatus, TombolLink } from "@/components/mitra/ui";
import { jalur, kamus } from "@/lib/i18n";
import { bahasaAktif } from "@/lib/i18n-server";
import { ambilBeranda } from "@/lib/mitra/data";
import {
  hariSingkat,
  hariTanggal,
  statusKembali,
  tanggalLengkap,
  tanggalPanjang,
} from "@/lib/mitra/waktu";

const TEKS = kamus({
  id: {
    lewat: ", lewat jadwal kembali",
    beranda: "Beranda",
    blokir: "Blokir tanggal",
    tambah: "Tambah unit",
    ringkasan: "Ringkasan hari ini",
    masukHariIni: "Pesanan Masuk Hari Ini",
    sedangKeluar: "Unit Sedang Keluar",
    pendapatan: (b: string) => `Pendapatan Bersih ${b}`,
    unitKeluar: "Unit yang lagi keluar",
    lihatSemua: "Lihat semua",
    mingguIni: "Minggu ini",
    perHari: "unit keluar per hari",
    srKeluar: " unit keluar",
    tertinggi: (hari: string, sisa: number) =>
      `Permintaan tertinggi ${hari}. Masih ada ${sisa} unit kosong di tanggal itu.`,
  },
  en: {
    lewat: ", past the return time",
    beranda: "Home",
    blokir: "Block dates",
    tambah: "Add vehicle",
    ringkasan: "Today at a glance",
    masukHariIni: "Bookings In Today",
    sedangKeluar: "Vehicles Out",
    pendapatan: (b: string) => `Net Earnings, ${b}`,
    unitKeluar: "Vehicles out right now",
    lihatSemua: "See all",
    mingguIni: "This week",
    perHari: "vehicles out per day",
    srKeluar: " vehicles out",
    tertinggi: (hari: string, sisa: number) =>
      `Busiest day is ${hari}. There are still ${sisa} vehicles free that day.`,
  },
});

// Kolom kanan "Unit yang lagi keluar" menampilkan tanggal kembali, bukan label
// status. Unit yang lewat jadwal tetap diberi titik dan warna plum, plus teks
// tersembunyi untuk pembaca layar, supaya tanda telatnya tidak hilang.
function TanggalKembali({ telat, label, srLewat }: { telat: boolean; label: string; srLewat: string }) {
  return (
    <>
      <TitikStatus label={label} telat={telat} />
      {telat && <span className="sr-only">{srLewat}</span>}
    </>
  );
}

function warnaBar(persen: number) {
  if (persen >= 75) return "bg-mitra-bar-pekat";
  if (persen >= 40) return "bg-mitra-bar-sedang";
  return "bg-mitra-bar-muda";
}

export default async function BerandaMitra() {
  const bahasa = await bahasaAktif();
  const t = TEKS[bahasa];
  const d = await ambilBeranda(bahasa);

  const unitKeluar = d.unitKeluar.daftar.map((u) => ({
    ...u,
    status: statusKembali(u.kembaliPada, d.sekarang, bahasa),
  }));

  const maks = Math.max(...d.mingguIni.map((h) => h.jumlah));
  const tersibuk = d.mingguIni.find((h) => h.jumlah === maks)!;

  return (
    <>
      <HeaderHalaman
        kicker={tanggalPanjang(d.sekarang, bahasa)}
        judul={t.beranda}
        aksi={
          <>
            <TombolLink href={jalur(bahasa, "/mitra/kalender")} varian="sekunder">
              {t.blokir}
            </TombolLink>
            <TombolLink href={jalur(bahasa, "/mitra/unit")} varian="primer">
              {t.tambah}
            </TombolLink>
          </>
        }
      />

      <CalloutPesanan />

      <section
        aria-label={t.ringkasan}
        className="mt-36 grid rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:grid-cols-3 min-[640px]:p-24"
      >
        <div className="border-b border-mitra-hairline pb-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:pb-0 min-[640px]:pr-30">
          <p className="text-m-judul-baris text-mitra-ink">{t.masukHariIni}</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{d.pesananHariIni.masuk}</p>
        </div>
        <div className="border-b border-mitra-hairline py-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:px-30 min-[640px]:py-0">
          <p className="text-m-judul-baris text-mitra-ink">{t.sedangKeluar}</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">
            {d.unitKeluar.jumlah}{" "}
            <span className="text-m-penyebut text-mitra-faint">/ {d.unitKeluar.totalUnit}</span>
          </p>
        </div>
        <div className="pt-20 min-[640px]:pt-0 min-[640px]:pl-30">
          <p className="text-m-judul-baris text-mitra-ink">{t.pendapatan(d.pendapatan.bulan)}</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{d.pendapatan.nilai}</p>
        </div>
      </section>

      <div className="mt-44 grid items-start gap-44 min-[1100px]:grid-cols-[1.55fr_1fr] min-[1100px]:gap-64">
        {/* Deviasi dari README ("pemisah adalah garis rambut, bukan box"):
            dua seksi ini dibungkus kotak bergaris rambut atas permintaan,
            karena berdampingan keduanya terbaca menyatu. Tetap tanpa shadow
            dan tanpa latar warna supaya tidak jadi kartu bertumpuk. */}
        <section
          aria-labelledby="judul-unit-keluar"
          className="rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24"
        >
          <div className="flex items-baseline justify-between gap-16">
            <h2 id="judul-unit-keluar" className="text-m-h2 text-mitra-ink">
              {t.unitKeluar}
            </h2>
            <Link
              href={jalur(bahasa, "/mitra/unit?status=keluar")}
              className="whitespace-nowrap text-m-tautan text-mitra-primer hover:underline"
            >
              {t.lihatSemua}
            </Link>
          </div>
          {/* Border per baris ada di <li>; tautan melebar 12px ke kiri-kanan
              supaya latar hover tidak menempel pada teks. */}
          <ul className="mt-14">
            {unitKeluar.map((u) => (
              <li key={u.id} className="border-t border-mitra-hairline">
                <Link
                  href={jalur(bahasa, "/mitra/pesanan?tab=berjalan")}
                  className="-mx-12 flex items-center gap-16 px-12 py-26 transition-colors duration-160 ease-base hover:bg-mitra-hover min-[640px]:gap-22"
                >
                  <ThumbnailUnit foto={u.foto} nama={u.nama} />
                  <div className="min-w-0 flex-1">
                    <p className="text-m-judul-baris text-mitra-ink">{u.nama}</p>
                    <p className="mt-5 text-m-meta text-mitra-muted">
                      {u.plat} · {u.penyewa}
                    </p>
                    <div className="mt-8 min-[640px]:hidden">
                      <TanggalKembali
                        telat={u.status.telat}
                        label={tanggalLengkap(u.kembaliPada, bahasa)}
                        srLewat={t.lewat}
                      />
                    </div>
                  </div>
                  <div className="hidden shrink-0 min-[640px]:block">
                    <TanggalKembali
                      telat={u.status.telat}
                      label={tanggalLengkap(u.kembaliPada, bahasa)}
                      srLewat={t.lewat}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="judul-minggu-ini"
          className="rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:p-24"
        >
          <div className="flex items-baseline justify-between gap-16">
            <h2 id="judul-minggu-ini" className="text-m-h2 text-mitra-ink">
              {t.mingguIni}
            </h2>
            <p className="text-m-body text-mitra-faint">{t.perHari}</p>
          </div>
          <ul className="mt-18">
            {d.mingguIni.map((h) => {
              const persen = Math.round((h.jumlah / maks) * 100);
              return (
                <li
                  key={h.tanggal}
                  className="flex items-center gap-18 border-t border-mitra-hairline py-13"
                >
                  <span className="w-70 shrink-0 text-m-status text-mitra-muted">
                    {hariSingkat(h.tanggal, bahasa)}
                  </span>
                  <span aria-hidden className="h-10 flex-1 rounded-pill bg-mitra-track">
                    <span
                      className={`block h-10 rounded-pill ${warnaBar(persen)}`}
                      style={{ width: `${persen}%` }}
                    />
                  </span>
                  <span className="w-22 shrink-0 text-right text-m-angka text-mitra-ink">
                    {h.jumlah}
                    <span className="sr-only">{t.srKeluar}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-20 border-t border-mitra-hairline pt-18 text-m-body text-mitra-muted">
            {t.tertinggi(hariTanggal(tersibuk.tanggal, bahasa), d.unitKeluar.totalUnit - maks)}
          </p>
        </section>
      </div>
    </>
  );
}
