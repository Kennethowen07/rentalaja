// README section 7 — band hijau tua #093628.

import { testimoni } from "@/lib/mock/testimonials";

export default function Testimonials() {
  return (
    <section className="bg-green-900 py-38">
      <div className="container-page">
        <h2 className="text-eyebrow text-green-400 uppercase">Kata penyewa</h2>

        <ul className="mt-16 grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {testimoni.map((t) => (
            <li
              key={t.id}
              className="rounded-card border border-white/14 bg-white/7 p-18"
            >
              <blockquote className="text-testimoni text-quote">
                {t.kutipan}
              </blockquote>
              <div className="mt-14 flex items-center gap-9">
                <span
                  aria-hidden
                  className="size-28 shrink-0 rounded-pill bg-white/18"
                />
                <div>
                  <p className="text-footer-title text-white">{t.nama}</p>
                  <p className="text-testimonial-meta text-green-400">
                    {t.meta}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
