"use client";

// Beranda v3, FAQ (design-lab/approved/round-1.html). Accordion satu item
// terbuka sekaligus, item pertama terbuka sejak awal seperti di design.
//
// Animasi dikerjakan dengan transisi grid-template-rows 0fr ke 1fr supaya
// tidak perlu mengukur tinggi konten lewat JS. Panel yang tertutup diberi
// atribut inert agar isinya tidak bisa difokus atau dibaca screen reader.

import { useState } from "react";
import { useBahasa } from "@/components/BahasaProvider";
import { faqItems as semuaFaq } from "@/lib/mock/faq";

export default function Faq() {
  const { bahasa } = useBahasa();
  const faqItems = semuaFaq[bahasa];
  const [terbuka, setTerbuka] = useState<string | null>(faqItems[0]?.id ?? null);

  return (
    <section id="faq" aria-labelledby="judul-faq" className="bg-green-50 py-64 md:py-96">
      <div className="container-beranda grid items-start gap-24 md:grid-cols-[4fr_8fr]">
        <h2 id="judul-faq" className="max-w-360 text-b2-sm text-balance md:text-b2">
          {bahasa === "en" ? "Frequently asked questions" : "Pertanyaan yang sering muncul"}
        </h2>

        <ul className="grid gap-12">
          {faqItems.map((item) => {
            const aktif = terbuka === item.id;
            return (
              <li
                key={item.id}
                className={
                  "rounded-b-md border bg-white transition-shadow duration-240 ease-beranda " +
                  (aktif ? "border-green-350 shadow-b-1" : "border-green-200")
                }
              >
                <h3>
                  <button
                    type="button"
                    id={"faq-btn-" + item.id}
                    aria-expanded={aktif}
                    aria-controls={"faq-panel-" + item.id}
                    onClick={() => setTerbuka(aktif ? null : item.id)}
                    className="flex min-h-56 w-full items-center justify-between gap-16 rounded-b-md px-20 py-16 text-left text-b4-sm font-semibold transition-colors duration-160 ease-beranda hover:text-green-700 md:min-h-64 md:px-24 md:py-20 md:text-b4"
                  >
                    {item.pertanyaan}
                    <span
                      aria-hidden
                      className={
                        "grid size-32 shrink-0 place-items-center rounded-full transition-colors duration-240 ease-beranda " +
                        (aktif ? "bg-green-700 text-white" : "bg-green-100 text-green-700")
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        className={
                          "size-16 transition-transform duration-240 ease-beranda " +
                          (aktif ? "rotate-45" : "")
                        }
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  id={"faq-panel-" + item.id}
                  role="region"
                  aria-labelledby={"faq-btn-" + item.id}
                  inert={!aktif}
                  className={
                    "grid transition-[grid-template-rows] duration-240 ease-beranda " +
                    (aktif ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
                  }
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[68ch] px-20 pb-20 text-b5-sm leading-[1.65] text-muted-kuat md:px-24 md:pb-24 md:text-b5">
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
