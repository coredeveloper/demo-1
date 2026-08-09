"use client";

/*
 * /financial/insights — Financial Insights. Ingestion status, income-statement
 * KPIs, the variance tree with AI root-cause (cite-or-refuse), anomaly table.
 * Scope (enterprise / Maryland / Chesapeake) follows the persona.
 */
import { useFinPersona } from "@/components/financial/persona-provider";
import { KpiGrid } from "@/components/financial/kpi-tile";
import { VarianceTree } from "@/components/financial/variance-tree";
import {
  Card,
  IngestionStrip,
  Pill,
  ScopeBanner,
  SectionLabel,
  TheaterNote,
} from "@/components/financial/primitives";
import { fireToast, openDock } from "@/components/financial/chrome";
import { FIN_INGESTION, finVariant } from "@/lib/financial/story";
import { Sparkles } from "lucide-react";

export default function InsightsPage() {
  const { persona } = useFinPersona();
  const v = finVariant(persona.finScope);

  return (
    <div className="flex flex-col gap-6">
      <IngestionStrip chips={FIN_INGESTION} />
      <ScopeBanner scope={v.banner} sub={v.bannerSub} />

      <section>
        <SectionLabel hint="hover for plain-English definitions">
          Income-statement KPIs · May 2026
        </SectionLabel>
        <KpiGrid tiles={v.kpis} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card
          title={v.vTitle}
          sub={`Click a branch to expand drivers · ${v.vSub}`}
          pill="period vs budget"
          pillTone="m"
        >
          <VarianceTree nodes={v.vTree} />
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ph-primary text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <span className="ph-eyebrow text-ph-primary">AI root-cause · cite-or-refuse</span>
          </div>
          <p
            className="text-[13px] leading-relaxed text-ph-gray-700"
            dangerouslySetInnerHTML={{ __html: v.ai }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-ph-gray-400 mr-1">
              Sources
            </span>
            {v.aiSources.map((s) => (
              <Pill key={s} tone="s">
                {s}
              </Pill>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openDock}
              className="rounded-md bg-ph-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-ph-primary-dark"
            >
              Ask in Finance mode
            </button>
            <button
              type="button"
              onClick={() => fireToast("Variance memo exported to Word (demo)")}
              className="rounded-md border border-ph-gray-200 px-3 py-1.5 text-xs font-medium text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
            >
              Export to memo (Word)
            </button>
          </div>
        </Card>
      </section>

      <Card
        title="Anomaly detection"
        sub={`KPIs flagged by the anomaly model · ${v.banner}`}
        pill={`${v.anomalies.length} flagged`}
        pillTone="v"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                <th className="py-1.5 pr-3 font-semibold">KPI / location</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Value</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Expected</th>
                <th className="py-1.5 pr-3 font-semibold text-right">Anomaly score</th>
                <th className="py-1.5 pr-3 font-semibold">Top driver</th>
                <th className="py-1.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ph-gray-100">
              {v.anomalies.map((a) => (
                <tr key={a.kpi}>
                  <td className="py-2 pr-3 font-medium text-ph-ink whitespace-nowrap">{a.kpi}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{a.val}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ph-gray-500">{a.exp}</td>
                  <td className="py-2 pr-3 text-right">
                    <Pill tone={a.scoreTone}>{a.score}</Pill>
                  </td>
                  <td className="py-2 pr-3 text-ph-gray-500">{a.driver}</td>
                  <td className="py-2">
                    <Pill tone="m">{a.action}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TheaterNote>
        NLQ ready — ask the assistant: <em>&ldquo;What is driving labor variance in {v.banner} this
        month?&rdquo;</em> · responses cite the semantic-model entity, table, and period (SLA ≤3–5 s).
      </TheaterNote>
    </div>
  );
}
