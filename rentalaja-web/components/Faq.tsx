"use client";

// README section 10 + Interactions. Accordion, satu item terbuka sekaligus,
// ikon + / −, animasi height 180ms ease.
//
// Animasi dikerjakan dengan transisi grid-template-rows 0fr -> 1fr supaya
// tidak perlu mengukur tinggi konten lewat JS. Panel yang tertutup diberi
// `inert` agar isinya tidak bisa difokus atau dibaca screen reader.

import { useState } from "react";
import { faqItems } from "@/lib/mock/faq";

export default function Faq() {
  const [terbuka, setTerbuka] = useState<string | null>(null);

  return (
    <section id="faq" className="border-t border-green-200 bg-green-50 py-32">
      <div className="container-page">
        <h2 className="text-section text-ink">Pertanyaan yang sering muncul</h2>

        <ul className="mt-16 flex flex-col gap-9">
          {faqItems.map((item) => {
            const aktif = terbuka === item.id;
            return (
              <li
                key={item.id}
                className="rounded-faq border border-green-200 bg-white"
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-btn-${item.id}`}
                    aria-expanded={aktif}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setTerbuka(aktif ? null : item.id)}
                    className="flex w-full items-center justify-between gap-16 px-16 py-14 text-left"
                  >
                    <span className="text-nav-strong text-ink">
                      {item.pertanyaan}
                    </span>
                    <span aria-hidden className="text-nav-strong text-green-700">
                      {aktif ? "−" : "+"}
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.id}`}
                  inert={!aktif}
                  className={`grid transition-[grid-template-rows] duration-180 ease-base ${
                    aktif ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-16 pb-14 text-body text-muted">
                      {item.jawaban}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
