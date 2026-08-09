"use client";

/*
 * /financial/survey-risk — portfolio-level Survey Intelligence from the
 * FINANCIAL dataset (taxonomy, monthly trend, state rollup). The deep survey
 * work (real narratives, POC drafting) lives in the survey app — repository
 * rows deep-link there. The two datasets join at state level only.
 */
import Link from "next/link";
import { useFinPersona } from "@/components/financial/persona-provider";
import { CategoryBars, TrendLines } from "@/components/financial/charts";
import {
  Card,
  IngestionStrip,
  Pill,
  ScopeBanner,
  SectionLabel,
  TheaterNote,
} from "@/components/financial/primitives";
import { fireToast } from "@/components/financial/chrome";
import { SURVEY_INGESTION, surveyVariant } from "@/lib/financial/survey-risk";
import { citationTrendMonthly, stateRollup } from "@/lib/financial/selectors";
import { cn } from "@/lib/utils";

const SEV_RAIL: Record<string, string> = {
  crit: "bg-ph-burgundy",
  warn: "bg-ph-amber",
  info: "bg-ph-sage",
};
const VAL_TONE: Record<string, string> = {
  r: "text-ph-burgundy",
  a: "text-ph-amber",
  g: "text-[#2E7D5B]",
};

export default function SurveyRiskPage() {
  const { persona } = useFinPersona();
  const scope = persona.surveyScope;
  const v = surveyVariant(scope);
  const trend = citationTrendMonthly();

  return (
    <div className="flex flex-col gap-6">
      <IngestionStrip chips={SURVEY_INGESTION} />
      <ScopeBanner scope={v.banner} sub={v.bannerSub} />

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card
          title="Citation frequency by category"
          sub={`Trailing 12 months · ${scope === "all" ? "all locations" : v.banner} · illustrative`}
        >
          <CategoryBars data={v.categories} />
        </Card>
        <Card title="High-risk areas" sub="Rising or recurring · explainable signals">
          <div className="flex flex-col divide-y divide-ph-gray-100">
            {v.highRisk.map((h) => (
              <div key={h.title} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={cn("mt-1 h-8 w-1 shrink-0 rounded-full", SEV_RAIL[h.sev])} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-ph-ink leading-snug">{h.title}</div>
                  <div className="text-[11.5px] text-ph-gray-500 mt-0.5">{h.meta}</div>
                </div>
                <span className={cn("text-[13px] font-semibold whitespace-nowrap", VAL_TONE[h.tone])}>
                  {h.val}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {scope === "all" && (
        <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card
            title="Citation trend by category"
            sub="New citations per month · three most-moving categories · portfolio-wide"
          >
            <TrendLines labels={trend.labels} series={trend.series} />
          </Card>
          <Card title="By state" sub="Citations (12m) · POC on-time rate">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                    <th className="py-1.5 pr-3 font-semibold">State</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Loc.</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Cit. (12m)</th>
                    <th className="py-1.5 font-semibold text-right">POC on-time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ph-gray-100">
                  {stateRollup().map((s) => (
                    <tr key={s.code}>
                      <td className="py-1.5 pr-3 font-medium text-ph-ink">{s.state_name}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{s.locations}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{s.citations_12m}</td>
                      <td
                        className={cn(
                          "py-1.5 text-right tabular-nums font-medium",
                          s.poc_on_time_pct < 85 ? "text-ph-burgundy" : "text-ph-ink",
                        )}
                      >
                        {s.poc_on_time_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <Card
        title="CMS-2567 document repository"
        sub={`Ingested survey statements of deficiency · ${v.banner}`}
        headerRight={
          <button
            type="button"
            onClick={() => fireToast("Trend report exported (demo)")}
            className="rounded-md border border-ph-gray-200 px-2.5 py-1 text-[11px] font-medium text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
          >
            Export trend report
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                <th className="py-1.5 pr-3 font-semibold">Location</th>
                <th className="py-1.5 pr-3 font-semibold">State</th>
                <th className="py-1.5 pr-3 font-semibold">Survey date</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Cites</th>
                <th className="py-1.5 pr-3 font-semibold">Top F-tag</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Confidence</th>
                <th className="py-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ph-gray-100">
              {v.repo.map((r, i) => (
                <tr key={r.name + r.date + i} className={cn(r.href && "hover:bg-ph-gray-100/60")}>
                  <td className="py-2 pr-3 font-medium text-ph-ink whitespace-nowrap">
                    {r.href ? (
                      <Link href={r.href} className="hover:text-ph-primary hover:underline">
                        {r.name}
                      </Link>
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="py-2 pr-3 text-ph-gray-500">{r.state}</td>
                  <td className="py-2 pr-3 tabular-nums text-ph-gray-500">{r.date}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.cites}</td>
                  <td className="py-2 pr-3">{r.topTag}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.confidence}</td>
                  <td className="py-2">
                    <Pill tone={r.pill}>{r.pillLabel}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-ph-gray-400">
          Rows with a link open the survey app&apos;s POC workspace. Note: this portfolio view and
          the survey app run on <strong>separate illustrative datasets</strong> — they join at
          state level only.{" "}
          <Link href="/surveys" className="text-ph-primary hover:underline">
            Open the survey app →
          </Link>
        </p>
      </Card>

      <TheaterNote>
        Source-grounded NLQ scoped to {v.banner} — answers cite document IDs, facility, survey date,
        and page anchors; refuses on low-confidence-only sources.
      </TheaterNote>
    </div>
  );
}
