// README section 11 — footer #062A1F.
// Responsive: 640-1023px jadi 2 kolom, <640px jadi 1 kolom.

const kolomLink = [
  {
    judul: "Penyewa",
    items: ["Cari unit", "Cara kerja", "Bantuan"],
  },
  {
    judul: "Penyedia",
    items: ["Daftarkan rental", "Dashboard", "Biaya layanan"],
  },
  {
    judul: "Perusahaan",
    items: ["Tentang", "Kebijakan privasi", "Syarat dan ketentuan"],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-green-950 pt-34 pb-26">
      <div className="container-page">
        <div className="grid gap-24 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-wordmark text-white">rentalaja</p>
            <p className="mt-9 text-footer-desc text-green-400">
              Sewa motor dan mobil di Bali dengan ketersediaan yang bisa
              dipercaya.
            </p>
          </div>

          {kolomLink.map((kolom) => (
            <div key={kolom.judul}>
              <h2 className="text-footer-title text-white">{kolom.judul}</h2>
              <ul className="mt-7">
                {kolom.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-footer-link text-green-400 transition-colors duration-160 ease-base hover:text-green-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-22 border-t border-white/14 pt-14">
          <p className="text-micro text-footer-bottom">© 2026 rentalaja</p>
        </div>
      </div>
    </footer>
  );
}
