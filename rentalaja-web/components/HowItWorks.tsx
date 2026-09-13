// README section 4 — "Tiga langkah, tanpa chat"
//
// Hover (bukan bagian spec): kartu membesar 3% dan memudar ke hijau
// primary dengan kilau putih. Zoom dimatikan untuk pengguna yang memilih
// reduce motion; perubahan warnanya tetap jalan. Hover Tailwind v4 hanya
// aktif di perangkat ber-pointer, jadi tidak "nyangkut" setelah di-tap.

const langkah = [
  {
    no: "01",
    judul: "Isi tanggal",
    body: "Daftar unit langsung menyaring diri sendiri sesuai rentang sewamu.",
  },
  {
    no: "02",
    judul: "Bayar DP 30%",
    body: "Sisanya dibayar saat unit diantar. Nota digital langsung terbit.",
  },
  {
    no: "03",
    judul: "Unit diantar",
    body: "Serah terima berfoto di titik yang kamu pilih, dua arah.",
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-white pt-36 pb-34">
      <div className="container-page">
        <h2 className="text-section text-ink">Tiga langkah, tanpa chat</h2>
        <p className="mt-5 text-body text-muted">
          Semua konfirmasi terjadi di dalam aplikasi, bukan di WhatsApp.
        </p>

        <ul className="mt-18 grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {langkah.map((l) => (
            <li
              key={l.no}
              className="group relative overflow-hidden rounded-card border border-green-200 bg-green-25 p-18 transition duration-200 ease-base hover:border-green-700 hover:shadow-langkah motion-safe:hover:scale-[1.03]"
            >
              {/* Lapisan hijau + kilau putih, dipudarkan lewat opacity karena
                  background-image gradient tidak bisa ditransisikan langsung. */}
              <span
                aria-hidden
                className="bg-langkah-aktif absolute inset-0 opacity-0 transition-opacity duration-200 ease-base group-hover:opacity-100"
              />
              <span className="relative grid size-28 place-items-center rounded-input bg-green-100 text-badge text-green-700 transition-colors duration-200 ease-base group-hover:bg-white">
                {l.no}
              </span>
              <h3 className="relative mt-11 text-card-title text-ink transition-colors duration-200 ease-base group-hover:text-white">
                {l.judul}
              </h3>
              <p className="relative mt-5 text-body-sm text-muted transition-colors duration-200 ease-base group-hover:text-green-50">
                {l.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
