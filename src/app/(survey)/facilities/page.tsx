"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import {
  FACILITIES,
  surveysByFacility,
  facilitySeverityWeight,
  scopeSeverityBand,
  categoryFor,
} from "@/lib/mock-data";
import { ScopeSeverityLegend } from "@/components/dashboard/scope-severity-legend";
import { usePersona } from "@/components/layout/persona-context";
import { cn } from "@/lib/utils";

const GRADE_PILL: Record<string, string> = {
  "immediate-jeopardy": "bg-ph-burgundy text-white",
  "actual-harm": "bg-[var(--sev-actual)] text-white",
  minimal: "bg-ph-amber text-white",
  "self-correct": "bg-ph-primary-soft text-ph-primary",
};

function facilityStats(id: string) {
  const surveys = surveysByFacility(id);
  const defs = surveys.flatMap((s) => s.deficiencies);
  const open = surveys.filter((s) => s.pocStatus !== "POC submitted").length;
  const worstGrade = defs.reduce((w, d) => (d.scopeSeverity > w ? d.scopeSeverity : w), "A");
  const catCount = new Map<string, number>();
  for (const d of defs) catCount.set(categoryFor(d.ftag), (catCount.get(categoryFor(d.ftag)) ?? 0) + 1);
  const topCategory = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return { surveys: surveys.length, open, totalDef: defs.length, worstGrade, topCategory };
}

export default function FacilitiesPage() {
  const { persona } = usePersona();
  const scope = persona.facilityId;

  // Severity-weighted ranking — heaviest-cited facilities first (regional triage).
  const ranked = [...FACILITIES].sort((a, b) => facilitySeverityWeight(b.id) - facilitySeverityWeight(a.id));
  const visible = scope ? ranked.filter((f) => f.id === scope) : ranked;
  const hidden = ranked.length - visible.length;

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-8 ph-reveal grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="text-[20px] leading-[1.3] tracking-tight font-display text-ph-ink">
            Facilities ranked by <span className="text-ph-burgundy">enforcement risk</span> —
            heaviest scope-severity first, so the worst rises to the top.
          </p>
        </div>
        <div className="col-span-12 md:col-span-5">
          <hr className="ph-rule mb-3" />
          <ScopeSeverityLegend />
        </div>
      </div>

      {scope && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-ph-primary-soft text-ph-primary px-3 py-2 text-xs">
          <Lock className="h-3.5 w-3.5" />
          Role-scoped view — you see only {persona.facilityLabel}.
          {hidden > 0 && <span className="text-ph-gray-500">{hidden} other facilities hidden.</span>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((f, i) => {
          const st = facilityStats(f.id);
          const band = scopeSeverityBand(st.worstGrade);
          return (
            <Link
              key={f.id}
              href={`/facilities/${f.id}`}
              className="ph-card p-6 hover:shadow-lg transition-shadow ph-reveal group"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="ph-eyebrow text-ph-gray-400">{f.state} · {f.bu}</div>
                <span
                  className={cn("inline-flex flex-col items-center rounded px-1.5 py-0.5 leading-none", GRADE_PILL[band.band])}
                  title={`Worst grade ${st.worstGrade} · ${band.action}`}
                >
                  <span className="font-display text-sm">{st.worstGrade}</span>
                </span>
              </div>
              <h3 className="text-lg tracking-tight font-display mb-1 leading-snug">
                {f.name.replace("Pruitthealth ", "")}
              </h3>
              <p className="text-[11px] text-ph-gray-500 mb-1 leading-relaxed">{f.address}</p>
              <p className="text-[11px] text-ph-gray-600 mb-5">
                Top area: <span className="font-medium">{st.topCategory}</span>
              </p>
              <hr className="ph-rule mb-4" />
              <dl className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <dd className="font-display text-2xl text-ph-primary leading-none">{st.surveys}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Surveys</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl text-ph-amber leading-none">{st.open}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Open</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl text-ph-burgundy leading-none">{st.totalDef}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Citations</dt>
                </div>
              </dl>
              <div className="mt-5 inline-flex items-center gap-1 text-[11px] text-ph-primary group-hover:translate-x-0.5 transition-transform">
                Drill in <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
