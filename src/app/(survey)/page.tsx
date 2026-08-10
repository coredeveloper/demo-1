import Link from "next/link";
import { ArrowRight, Eye, ClipboardList, CheckCircle2 } from "lucide-react";
import { DashboardKpis, type IjItem, type IjRecurring } from "@/components/dashboard/dashboard-kpis";
import { RecentSurveys } from "@/components/dashboard/recent-surveys";
import { TrendSnapshot } from "@/components/dashboard/trend-snapshot";
import {
  SURVEYS,
  dashboardKpis,
  ftagCountsByFacility,
  getFacility,
  getFtag,
  FACILITIES,
} from "@/lib/mock-data";
import { pocStepsForFtag } from "@/lib/mock-poc";

/** Open IJ citations with their "do today, by when" payload (server-computed). */
function ijActionItems(): { items: IjItem[]; recurring: IjRecurring[] } {
  const items: IjItem[] = SURVEYS.filter((s) => s.pocStatus !== "POC submitted")
    .flatMap((s) =>
      s.deficiencies
        .filter((d) => d.severity === "Immediate jeopardy")
        .map((d) => {
          const f = getFacility(s.facilityId)!;
          return {
            surveyId: s.id,
            facility: f.name,
            state: f.state,
            ftag: d.ftag,
            title: getFtag(d.ftag)?.shortTitle ?? "",
            grade: d.scopeSeverity,
            dueDate: s.pocDueDate,
            actions: pocStepsForFtag(d.ftag)
              .slice(0, 3)
              .map((a) => ({ text: a.text, owner: a.owner })),
          };
        }),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const byFacility = ftagCountsByFacility();
  const recurring: IjRecurring[] = [...new Set(items.map((i) => i.ftag))].map((ftag) => ({
    ftag,
    title: getFtag(ftag)?.shortTitle ?? "",
    facilities: [...byFacility.values()].filter((m) => (m.get(ftag) ?? 0) > 0).length,
  }));
  return { items, recurring };
}

export default function Home() {
  const k = dashboardKpis();
  const { items: ijItems, recurring } = ijActionItems();

  return (
    <div className="px-10 pt-8 pb-16 max-w-[1500px]">
      {/* Editorial pull-quote / context strip — paper-grain texture for atmosphere */}
      <section className="mb-10 ph-reveal ph-grain rounded-lg p-1 -m-1">
        <div className="grid grid-cols-12 gap-8 items-end relative z-10">
          <div className="col-span-12 md:col-span-7">
            <div className="ph-eyebrow mb-3">Compliance suite · State Survey + POC</div>
            <h2 className="text-[28px] leading-[1.18] tracking-tight text-ph-ink font-display font-medium">
              Every CMS-2567 becomes a FHIR-native record on arrival,
              <span className="text-ph-burgundy"> drafts its own Plan of Correction</span>,
              and surfaces the trend before a region asks.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9">
            <hr className="ph-rule mb-4" />
            <div className="ph-eyebrow text-ph-gray-400 mb-1">In review</div>
            <div className="text-sm leading-relaxed text-ph-gray-500">
              {FACILITIES.length} facilities · 30 surveys ingested over the last 12 months.
              All Plans of Correction draft inside the 10-day regulatory window.
            </div>
            <Link
              href="/pipeline"
              className="mt-3 inline-flex items-center gap-1 text-xs text-ph-primary hover:text-ph-primary-dark"
            >
              Watch a survey ingest <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits strip — frame the value before the numbers (set up the demo). */}
      <section className="mb-8 ph-reveal flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ph-gray-600">
        <span className="ph-eyebrow text-ph-gray-400">What this does</span>
        <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-ph-primary" strokeWidth={1.6} /> Division-wide visibility</span>
        <span className="text-ph-gray-300">→</span>
        <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5 text-ph-primary" strokeWidth={1.6} /> Role-specific action plans</span>
        <span className="text-ph-gray-300">→</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-ph-primary" strokeWidth={1.6} /> Tracked to completion</span>
      </section>

      {/* KPIs — asymmetric grid; IJ card expands the in-page action plan. */}
      <div className="mb-6">
        <DashboardKpis kpis={k} ijItems={ijItems} recurring={recurring} />
      </div>

      {/* Body — asymmetric 8/4 split */}
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <RecentSurveys />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <TrendSnapshot />
          <MarqueePromo />
        </div>
      </section>

    </div>
  );
}

function MarqueePromo() {
  return (
    <div className="ph-card-marquee p-5">
      <div className="ph-eyebrow text-ph-burgundy mb-2">Marquee</div>
      <h3 className="text-lg leading-snug mb-2 tracking-tight">
        Each survey lands as FHIR R4
      </h3>
      <p className="text-xs text-ph-gray-500 leading-relaxed mb-4">
        Composition + MeasureReport per F-tag + CarePlan for the POC, persisted to Azure
        Health Data Services. Standards-aligned with HL7, CMS NHSN dQM, Da Vinci DEQM —
        every future clinical-AI use case reads from the same store.
      </p>
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ph-burgundy hover:underline"
      >
        See the bundle build <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
