// README section 4 — "Tiga langkah, tanpa chat"

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
              className="rounded-card border border-green-200 bg-green-25 p-18"
            >
              <span className="grid size-28 place-items-center rounded-input bg-green-100 text-badge text-green-700">
                {l.no}
              </span>
              <h3 className="mt-11 text-card-title text-ink">{l.judul}</h3>
              <p className="mt-5 text-body-sm text-muted">{l.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
