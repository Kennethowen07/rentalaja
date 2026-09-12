// README section 8 — chip row area yang dilayani.

import { areaChipSisa, areaChips } from "@/lib/mock/areas";

export default function ServiceAreas() {
  return (
    <section className="bg-white py-34">
      <div className="container-page">
        <h2 className="text-section text-ink">Area yang dilayani</h2>

        <ul className="mt-14 flex flex-wrap gap-8">
          {areaChips.map((area) => (
            <li
              key={area}
              className="rounded-pill bg-green-100 px-14 py-8 text-link-sm text-green-700"
            >
              {area}
            </li>
          ))}
          <li className="rounded-pill border border-line px-14 py-8 text-link-sm text-muted">
            {areaChipSisa}
          </li>
        </ul>
      </div>
    </section>
  );
}
