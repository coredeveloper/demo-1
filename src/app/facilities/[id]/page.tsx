import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FACILITIES, surveysByFacility, getFtag } from "@/lib/mock-data";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { formatDate } from "@/lib/utils";

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = FACILITIES.find((f) => f.id === id);
  if (!facility) return notFound();
  const surveys = surveysByFacility(id).sort(
    (a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime(),
  );
  const ftagFreq = new Map<string, number>();
  for (const s of surveys) for (const d of s.deficiencies) ftagFreq.set(d.ftag, (ftagFreq.get(d.ftag) ?? 0) + 1);
  const topFtags = Array.from(ftagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
              <dt className="ph-eyebrow text-ph-gray-400">Surveys</dt>
              <dd className="text-ph-ink">{surveys.length} (12 mo)</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Top F-tags */}
      <section className="mb-10">
        <h3 className="text-xl tracking-tight mb-4">Most-cited F-tags</h3>
        <div className="ph-card p-6">
          <ul className="space-y-3">
            {topFtags.map(([code, count]) => {
              const t = getFtag(code);
              const max = topFtags[0]![1];
              const pct = (count / max) * 100;
              return (
                <li key={code} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-ph-burgundy w-12 shrink-0">{code}</span>
                  <span className="text-ph-gray-700 w-48 truncate shrink-0">{t?.shortTitle}</span>
                  <div className="flex-1 h-1.5 bg-ph-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-ph-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-ph-gray-500 w-8 text-right">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Survey list */}
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
                    {s.deficiencies.map((d) => (
                      <span key={d.ftag} className="inline-flex items-center rounded bg-ph-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-ph-gray-700">
                        {d.ftag}
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
