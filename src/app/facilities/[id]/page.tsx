import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import {
  FACILITIES,
  surveysByFacility,
  getFtag,
  categoryFor,
  scopeSeverityBand,
  citationGroupsForFacility,
} from "@/lib/mock-data";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { ScopeSeverityLegend } from "@/components/dashboard/scope-severity-legend";
import { CitationActionGroup } from "@/components/poc/citation-action-group";
import { formatDate, cn } from "@/lib/utils";

const GRADE_PILL: Record<string, string> = {
  "immediate-jeopardy": "bg-ph-burgundy text-white",
  "actual-harm": "bg-[var(--sev-actual)] text-white",
  minimal: "bg-ph-amber text-white",
  "self-correct": "bg-ph-primary-soft text-ph-primary",
};

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = FACILITIES.find((f) => f.id === id);
  if (!facility) return notFound();
  const surveys = surveysByFacility(id).sort(
    (a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime(),
  );

  // Most-cited by CLINICAL CATEGORY (Minesh: "people don't remember F-tags").
  // Ranked by worst grade, then count — the regional triage signal.
  const catMap = new Map<string, { count: number; worst: string }>();
  for (const s of surveys) {
    for (const d of s.deficiencies) {
      const c = categoryFor(d.ftag);
      const cur = catMap.get(c) ?? { count: 0, worst: "A" };
      cur.count += 1;
      if (d.scopeSeverity > cur.worst) cur.worst = d.scopeSeverity;
      catMap.set(c, cur);
    }
  }
  const topCats = Array.from(catMap.entries())
    .sort((a, b) => b[1].worst.localeCompare(a[1].worst) || b[1].count - a[1].count)
    .slice(0, 6);
  // Scale bars to the true max count (rows are ordered by grade, not count).
  const maxCatCount = Math.max(...topCats.map(([, info]) => info.count), 1);

  // Open citation roadmap (what the DON works now), grouped by citation.
  const openGroups = citationGroupsForFacility(id, true);
  const anchorByCategory = new Map<string, string>();
  openGroups.forEach((g, i) => {
    const anchor = `cite-${g.ftag}-${i}`;
    if (!anchorByCategory.has(g.category)) anchorByCategory.set(g.category, anchor);
  });

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <Link
        href="/facilities"
        className="inline-flex items-center gap-1.5 text-xs text-ph-gray-500 hover:text-ph-primary mb-6"
      >
        <ArrowLeft className="h-3 w-3" /> All facilities
      </Link>

      <header className="mb-10 ph-reveal grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-7">
          <div className="ph-eyebrow mb-2">
            {facility.state} · {facility.region} · {facility.bu}
          </div>
          <h2 className="text-3xl tracking-tight font-display leading-tight">{facility.name}</h2>
          <p className="text-sm text-ph-gray-500 mt-2">{facility.address}</p>
        </div>
        <div className="col-span-12 md:col-span-5">
          <hr className="ph-rule mb-3" />
          <dl className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="ph-eyebrow text-ph-gray-400">FHIR id</dt>
              <dd className="font-mono text-[11px] text-ph-ink">{facility.fhirId}</dd>
            </div>
            <div>
              <dt className="ph-eyebrow text-ph-gray-400">Beds</dt>
              <dd className="text-ph-ink">{facility.censusBeds}</dd>
            </div>
            <div>
              <dt className="ph-eyebrow text-ph-gray-400">Open citations</dt>
              <dd className="text-ph-ink">{openGroups.length}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Most-cited by clinical category — clickable into the roadmap */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-xl tracking-tight">Most-cited by clinical area</h3>
          <ScopeSeverityLegend />
        </div>
        <div className="ph-card p-6">
          <ul className="space-y-2.5">
            {topCats.map(([cat, info]) => {
              const pct = (info.count / maxCatCount) * 100;
              const band = scopeSeverityBand(info.worst);
              const anchor = anchorByCategory.get(cat);
              return (
                <li key={cat}>
                  <a
                    href={anchor ? `#${anchor}` : "#correction-roadmap"}
                    className="flex items-center gap-3 text-sm rounded-md -mx-2 px-2 py-1.5 hover:bg-ph-gray-50 transition-colors group"
                  >
                    <span className={cn("inline-block rounded px-1.5 py-0.5 font-display text-xs shrink-0 w-7 text-center", GRADE_PILL[band.band])} title={`Worst grade ${info.worst} · ${band.action}`}>
                      {info.worst}
                    </span>
                    <span className="text-ph-ink w-56 shrink-0 truncate font-medium">{cat}</span>
                    <div className="flex-1 h-1.5 bg-ph-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-ph-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-ph-gray-500 w-6 text-right">{info.count}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ph-gray-300 group-hover:text-ph-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Correction Roadmap — the DON's execution surface */}
      <section id="correction-roadmap" className="mb-10 scroll-mt-24">
        <div className="flex items-baseline gap-2 mb-1">
          <ListChecks className="h-4 w-4 text-ph-burgundy" strokeWidth={1.6} />
          <h3 className="text-xl tracking-tight">Correction roadmap</h3>
        </div>
        <p className="text-xs text-ph-gray-500 mb-4 max-w-2xl">
          Every open citation at this facility, grouped by clinical area with an owner and a
          completion trail. This is what the Director of Nursing works against this month.
        </p>
        {openGroups.length === 0 ? (
          <div className="ph-card p-8 text-center text-sm text-ph-gray-500">
            No open citations — all Plans of Correction are submitted.
          </div>
        ) : (
          <div className="space-y-5">
            {openGroups.map((g, i) => (
              <CitationActionGroup key={`${g.ftag}-${i}`} group={g} anchorId={`cite-${g.ftag}-${i}`} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Survey history */}
      <section>
        <h3 className="text-xl tracking-tight mb-4">Survey history</h3>
        <div className="ph-card overflow-hidden">
          <ul className="divide-y divide-ph-gray-200">
            {surveys.map((s, i) => (
              <li key={s.id} className="ph-reveal" style={{ animationDelay: `${i * 50}ms` }}>
                <Link
                  href={`/surveys/${s.id}`}
                  className="flex items-center gap-6 px-6 py-3 hover:bg-ph-gray-50"
                >
                  <div className="text-xs text-ph-gray-500 w-24 shrink-0">{formatDate(s.surveyDate)}</div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {Array.from(new Set(s.deficiencies.map((d) => categoryFor(d.ftag)))).map((c) => (
                      <span key={c} className="inline-flex items-center rounded bg-ph-gray-100 px-1.5 py-0.5 text-[10px] text-ph-gray-700">
                        {c}
                      </span>
                    ))}
                  </div>
                  <SeverityBadge severity={s.worstSeverity} compact />
                  <ArrowRight className="h-3.5 w-3.5 text-ph-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
