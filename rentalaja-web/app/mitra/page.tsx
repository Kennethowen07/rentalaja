// Beranda panel mitra, layar acuan #3a di design_handoff_rentalaja_mitra.

import Link from "next/link";
import CalloutPesanan from "@/components/mitra/CalloutPesanan";
import KeteranganPesananHariIni from "@/components/mitra/KeteranganPesananHariIni";
import { HeaderHalaman, ThumbnailUnit, TitikStatus, TombolLink } from "@/components/mitra/ui";
import { ambilBeranda } from "@/lib/mitra/data";
import {
  hariSingkat,
  hariTanggal,
  statusKembali,
  tanggalJam,
  tanggalPanjang,
} from "@/lib/mitra/waktu";

function warnaBar(persen: number) {
  if (persen >= 75) return "bg-mitra-bar-pekat";
  if (persen >= 40) return "bg-mitra-bar-sedang";
  return "bg-mitra-bar-muda";
}

export default async function BerandaMitra() {
  const d = await ambilBeranda();

  const unitKeluar = d.unitKeluar.daftar.map((u) => ({
    ...u,
    status: statusKembali(u.kembaliPada, d.sekarang),
  }));
  const jumlahTelat = unitKeluar.filter((u) => u.status.telat).length;

  const maks = Math.max(...d.mingguIni.map((h) => h.jumlah));
  const tersibuk = d.mingguIni.find((h) => h.jumlah === maks)!;

  return (
    <>
      <HeaderHalaman
        kicker={tanggalPanjang(d.sekarang)}
        judul="Beranda"
        aksi={
          <>
            <TombolLink href="/mitra/kalender" varian="sekunder">
              Blokir tanggal
            </TombolLink>
            <TombolLink href="/mitra/unit" varian="primer">
              Tambah unit
            </TombolLink>
          </>
        }
      />

      <CalloutPesanan />

      <section
        aria-label="Ringkasan hari ini"
        className="mt-36 grid rounded-m-callout border border-mitra-border p-20 shadow-m-panel min-[640px]:grid-cols-3 min-[640px]:p-24"
      >
        <div className="border-b border-mitra-hairline pb-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:pb-0 min-[640px]:pr-30">
          <p className="text-m-label text-mitra-faint">Pesanan masuk hari ini</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{d.pesananHariIni.masuk}</p>
          <p className="mt-2 text-m-label text-mitra-muted">
            <KeteranganPesananHariIni dikonfirmasi={d.pesananHariIni.dikonfirmasi} />
          </p>
        </div>
        <div className="border-b border-mitra-hairline py-20 min-[640px]:border-r min-[640px]:border-b-0 min-[640px]:px-30 min-[640px]:py-0">
          <p className="text-m-label text-mitra-faint">Unit sedang keluar</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">
            {d.unitKeluar.jumlah}{" "}
            <span className="text-m-penyebut text-mitra-faint">/ {d.unitKeluar.totalUnit}</span>
          </p>
          <p className="mt-2 text-m-label text-mitra-muted">
            {jumlahTelat > 0
              ? `${jumlahTelat} lewat jadwal kembali`
              : "Semua sesuai jadwal kembali"}
          </p>
        </div>
        <div className="pt-20 min-[640px]:pt-0 min-[640px]:pl-30">
          <p className="text-m-label text-mitra-faint">Pendapatan {d.pendapatan.bulan}</p>
          <p className="mt-6 text-m-metrik text-mitra-ink">{d.pendapatan.nilai}</p>
          <p className="mt-2 text-m-label text-mitra-muted">{d.pendapatan.keterangan}</p>
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
              Unit yang lagi keluar
            </h2>
            <Link
              href="/mitra/unit?status=keluar"
              className="whitespace-nowrap text-m-tautan text-mitra-primer hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          {/* Border per baris ada di <li>; tautan melebar 12px ke kiri-kanan
              supaya latar hover tidak menempel pada teks. */}
          <ul className="mt-14">
            {unitKeluar.map((u) => (
              <li key={u.id} className="border-t border-mitra-hairline">
                <Link
                  href="/mitra/pesanan"
                  className="-mx-12 flex items-center gap-16 px-12 py-26 transition-colors duration-160 ease-base hover:bg-mitra-hover min-[640px]:gap-22"
                >
                  <ThumbnailUnit foto={u.foto} nama={u.nama} />
                  <div className="min-w-0 flex-1">
                    <p className="text-m-judul-baris text-mitra-ink">{u.nama}</p>
                    <p className="mt-5 text-m-meta text-mitra-muted">
                      {u.plat} · {u.penyewa} ·{" "}
                      {u.status.telat ? "jatuh tempo" : "kembali"} {tanggalJam(u.kembaliPada)}
                    </p>
                    <div className="mt-8 min-[640px]:hidden">
                      <TitikStatus {...u.status} />
                    </div>
                  </div>
                  <div className="hidden shrink-0 min-[640px]:block">
                    <TitikStatus {...u.status} />
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
              Minggu ini
            </h2>
            <p className="text-m-body text-mitra-faint">unit keluar per hari</p>
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
                    {hariSingkat(h.tanggal)}
                  </span>
                  <span aria-hidden className="h-10 flex-1 rounded-pill bg-mitra-track">
                    <span
                      className={`block h-10 rounded-pill ${warnaBar(persen)}`}
                      style={{ width: `${persen}%` }}
                    />
                  </span>
                  <span className="w-22 shrink-0 text-right text-m-angka text-mitra-ink">
                    {h.jumlah}
                    <span className="sr-only"> unit keluar</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-20 border-t border-mitra-hairline pt-18 text-m-body text-mitra-muted">
            Permintaan tertinggi {hariTanggal(tersibuk.tanggal)}. Masih ada{" "}
            {d.unitKeluar.totalUnit - maks} unit kosong di tanggal itu.
          </p>
        </section>
      </div>
    </>
  );
}
