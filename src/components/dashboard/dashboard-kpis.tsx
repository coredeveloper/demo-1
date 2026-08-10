"use client";

/*
 * Dashboard KPI row + the Immediate Jeopardy action panel (Aug 10 meeting ask):
 * clicking the IJ card answers "which facilities, what needs to be done, and by
 * when" in-page — facility blocks with the citation, POC due date, and the top
 * corrective actions with owners, plus the recurring-tag link into Trends.
 * The other three cards link where they obviously should.
 *
 * All data is computed server-side (page.tsx) and passed in as props.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { daysUntil, formatDate, cn } from "@/lib/utils";

export type IjItem = {
  surveyId: string;
  facility: string;
  state: string;
  ftag: string;
  title: string;
  grade: string;
  dueDate: string;
  actions: { text: string; owner: string }[];
};

export type IjRecurring = { ftag: string; title: string; facilities: number };

export function DashboardKpis({
  kpis,
  ijItems,
  recurring,
}: {
  kpis: { openSurveys: number; dueThisWeek: number; totalDeficiencies: number; immediateJeopardy: number };
  ijItems: IjItem[];
  recurring: IjRecurring[];
}) {
  const [showIj, setShowIj] = useState(false);

  return (
    <>
      <section className="grid grid-cols-12 gap-4 mb-4">
        <Link href="/surveys" className="col-span-12 md:col-span-5 block">
          <KpiCard
            eyebrow="Open surveys"
            value={kpis.openSurveys}
            caption={`${kpis.dueThisWeek} due within 7 days. Real-time across the division. Click for the list.`}
            emphasis="neutral"
            delay={0}
          />
        </Link>
        <Link href="/poc-review" className="col-span-12 md:col-span-3 block">
          <KpiCard
            eyebrow="POCs due ≤7d"
            value={kpis.dueThisWeek}
            caption="10-day regulatory window. Click to review."
            emphasis={kpis.dueThisWeek > 0 ? "warning" : "neutral"}
            delay={80}
          />
        </Link>
        <Link href="/trends" className="col-span-6 md:col-span-2 block">
          <KpiCard
            eyebrow="Total deficiencies"
            value={kpis.totalDeficiencies}
            caption="Trailing 12 months. Click for trends."
            delay={160}
          />
        </Link>
        <button
          type="button"
          onClick={() => setShowIj((s) => !s)}
          aria-expanded={showIj}
          className={cn("col-span-6 md:col-span-2 block text-left w-full", showIj && "[&>div]:ring-2 [&>div]:ring-ph-burgundy/40")}
        >
          <KpiCard
            eyebrow="Immediate jeopardy"
            value={kpis.immediateJeopardy}
            caption="Highest severity tier. Click for the action plan."
            emphasis={kpis.immediateJeopardy > 0 ? "critical" : "neutral"}
            delay={240}
          />
        </button>
      </section>

      {showIj && (
        <section className="ph-card border-l-4 border-l-ph-burgundy p-5 mb-10 ph-reveal">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-ph-ink">
                Immediate jeopardy — the action plan
              </div>
              <div className="text-xs text-ph-gray-500 mt-0.5">
                {ijItems.length} open IJ citation{ijItems.length === 1 ? "" : "s"} · which
                facilities, what to do, and by when
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIj(false)}
              aria-label="Close action plan"
              className="rounded p-1 text-ph-gray-400 hover:bg-ph-gray-100 hover:text-ph-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {ijItems.map((it) => {
              const dueIn = daysUntil(it.dueDate);
              const urgent = dueIn <= 4;
              return (
                <div
                  key={it.surveyId + it.ftag}
                  className="rounded-lg border border-ph-gray-200 bg-ph-gray-50 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/surveys/${it.surveyId}`}
                      className="font-display text-base text-ph-ink hover:text-ph-primary"
                    >
                      {it.facility}
                    </Link>
                    <span className="ph-eyebrow text-ph-gray-400">{it.state}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="rounded bg-ph-burgundy-soft px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-ph-burgundy">
                      {it.ftag} · {it.grade}
                    </span>
                    <span className="text-ph-gray-700">{it.title}</span>
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 text-[11.5px] font-medium",
                      urgent ? "text-ph-burgundy" : "text-ph-gray-500",
                    )}
                  >
                    POC due {formatDate(it.dueDate)}
                    {dueIn >= 0 ? ` — in ${dueIn} day${dueIn === 1 ? "" : "s"}` : ` — ${Math.abs(dueIn)}d overdue`}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {it.actions.map((a) => (
                      <li key={a.text} className="text-[11.5px] leading-snug text-ph-gray-700">
                        <span className="text-ph-burgundy">▸</span> {a.text}{" "}
                        <span className="text-ph-gray-400">— {a.owner}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 flex gap-3 text-[11px] font-medium">
                    <Link href={`/surveys/${it.surveyId}`} className="text-ph-primary hover:underline">
                      Open survey →
                    </Link>
                    <Link href="/poc-review" className="text-ph-primary hover:underline">
                      POC review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {recurring.length > 0 && (
            <p className="mt-4 border-t border-dotted border-ph-gray-200 pt-3 text-[12px] text-ph-gray-600">
              <strong className="text-ph-ink">Recurring driver:</strong>{" "}
              {recurring.map((r, i) => (
                <span key={r.ftag}>
                  {i > 0 && " · "}
                  {r.ftag} ({r.title}) cited at {r.facilities} facilities in 12m
                </span>
              ))}{" "}
              —{" "}
              <Link href="/trends" className="inline-flex items-center gap-1 font-medium text-ph-primary hover:underline">
                see the pattern in Trends <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          )}
        </section>
      )}
    </>
  );
}
