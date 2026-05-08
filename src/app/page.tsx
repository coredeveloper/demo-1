import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentSurveys } from "@/components/dashboard/recent-surveys";
import { TrendSnapshot } from "@/components/dashboard/trend-snapshot";
import { dashboardKpis, FACILITIES } from "@/lib/mock-data";

export default function Home() {
  const k = dashboardKpis();

  return (
    <div className="px-10 pt-8 pb-16 max-w-[1500px]">
      {/* Editorial pull-quote / context strip */}
      <section className="mb-10 ph-reveal">
        <div className="grid grid-cols-12 gap-8 items-end">
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

      {/* KPIs — asymmetric grid: 5-3-2-2 instead of 4 equal */}
      <section className="grid grid-cols-12 gap-4 mb-10">
        <div className="col-span-12 md:col-span-5">
          <KpiCard
            eyebrow="Open surveys"
            value={k.openSurveys}
            caption={`${k.dueThisWeek} due within 7 days. Real-time across the division.`}
            emphasis="neutral"
            delay={0}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <KpiCard
            eyebrow="POCs due ≤7d"
            value={k.dueThisWeek}
            caption="10-day regulatory window."
            emphasis={k.dueThisWeek > 0 ? "warning" : "neutral"}
            delay={80}
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <KpiCard
            eyebrow="Total deficiencies"
            value={k.totalDeficiencies}
            caption="Trailing 12 months."
            delay={160}
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <KpiCard
            eyebrow="Immediate jeopardy"
            value={k.immediateJeopardy}
            caption="Highest severity tier."
            emphasis={k.immediateJeopardy > 0 ? "critical" : "neutral"}
            delay={240}
          />
        </div>
      </section>

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

      <p className="mt-12 text-[11px] text-ph-gray-400 italic max-w-2xl leading-relaxed">
        Local prototype — mock data, no Azure. Modeled after the production architecture in
        <code className="not-italic font-mono text-[10px] mx-1 px-1 py-0.5 rounded bg-ph-gray-100">
          architecture/proposed/02-state-survey-poc.md
        </code>
        and rendered in the Next.js shell that the Azure-wired implementation will inherit.
      </p>
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
