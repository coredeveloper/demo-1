"use client";

/*
 * /financial — Command Center. Persona-scoped executive briefing: AI narrative,
 * KPI tile grid (drill + glossary tooltips; the Operating Margin tile opens an
 * in-page breakdown — the CEO click), exception cards, revenue/margin trend,
 * persona-ranked suggested actions, service-line benchmarks, roster.
 */
import { useState } from "react";
import { useFinPersona } from "@/components/financial/persona-provider";
import { MarginBreakdown } from "@/components/financial/margin-breakdown";
import { NarrativeBanner } from "@/components/financial/narrative-banner";
import { KpiGrid } from "@/components/financial/kpi-tile";
import { ExceptionCard } from "@/components/financial/exception-card";
import { TrendCombo, CategoryBars } from "@/components/financial/charts";
import { Card, Pill, SectionLabel } from "@/components/financial/primitives";
import { fireToast } from "@/components/financial/chrome";
import { finVariant } from "@/lib/financial/story";
import {
  enterpriseTrend,
  rosterSample,
  serviceLineBenchmarks,
  stateRollup,
} from "@/lib/financial/selectors";

export default function CommandCenterPage() {
  const { persona } = useFinPersona();
  const cc = persona.command;
  const trend = finVariant(persona.finScope).trend;
  const labels = enterpriseTrend().labels;
  const [showMargin, setShowMargin] = useState(false);
  const hasMarginTile = cc.kpis.some((t) => t.label === "Operating Margin");

  return (
    <div className="flex flex-col gap-6">
      <NarrativeBanner title={cc.title} body={cc.body} stats={cc.stats} />

      <section className="flex flex-col gap-3">
        <SectionLabel hint="click a tile to drill · hover for plain-English definitions">
          {cc.kpiLabel}
        </SectionLabel>
        <KpiGrid
          tiles={cc.kpis}
          expand={
            hasMarginTile
              ? {
                  label: "Operating Margin",
                  open: showMargin,
                  onToggle: () => setShowMargin((s) => !s),
                }
              : undefined
          }
        />
        {showMargin && hasMarginTile && (
          <MarginBreakdown scope={persona.finScope} onClose={() => setShowMargin(false)} />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ExceptionCard data={cc.excFin} />
        <ExceptionCard data={cc.excComp} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card
          title="Revenue & operating-margin trend"
          sub={`Monthly · TTM through May 2026 · illustrative`}
          pill="period"
          pillTone="m"
        >
          <TrendCombo labels={labels} rev={trend.rev} margin={trend.margin} min={trend.min} max={trend.max} />
        </Card>
        <Card
          title="Suggested actions"
          sub="Ranked for your persona · each is explainable"
          pill={persona.mode}
          pillTone="s"
        >
          <ol className="flex flex-col gap-3">
            {cc.actions.map((a, i) => (
              <li key={a.action} className="flex gap-3">
                <span className="font-display text-lg text-ph-burgundy leading-none mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] text-ph-ink leading-snug">{a.action}</div>
                  <div className="text-[11px] text-ph-gray-500 mt-0.5">
                    <span className="font-semibold text-ph-gray-400 uppercase tracking-wide text-[9.5px] mr-1">
                      Signal
                    </span>
                    {a.signal}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section>
        <SectionLabel hint="derived from the illustrative dataset">
          Service-line benchmarks · operating margin
        </SectionLabel>
        <Card sub="Operating margin % by service line — revenue and occupancy in the tooltip via the assistant">
          <CategoryBars
            unit="%"
            data={serviceLineBenchmarks().map((b) => ({
              label: b.line,
              count: b.operating_margin_pct,
              tone: "#0E5752",
            }))}
          />
        </Card>
      </section>

      {persona.roster !== "none" && <Roster scope={persona.roster} />}
    </div>
  );
}

function Roster({ scope }: { scope: "all" | "MD" }) {
  const rows = rosterSample(scope);
  const states = stateRollup();
  return (
    <section>
      <SectionLabel hint="illustrative roster">
        {scope === "MD" ? "Maryland — all 6 locations" : "Portfolio — sample of 180 locations across 6 states"}
      </SectionLabel>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card title="Location sample" sub="Representative facilities across the portfolio">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                  <th className="py-1.5 pr-3 font-semibold">Location</th>
                  <th className="py-1.5 pr-3 font-semibold">St</th>
                  <th className="py-1.5 pr-3 font-semibold">Service line</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Occ</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Margin</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Cit.</th>
                  <th className="py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ph-gray-100">
                {rows.map((r, i) => (
                  <tr key={r.name + i}>
                    <td className="py-1.5 pr-3 font-medium text-ph-ink whitespace-nowrap">{r.name}</td>
                    <td className="py-1.5 pr-3 text-ph-gray-500">{r.state}</td>
                    <td className="py-1.5 pr-3 text-ph-gray-500 whitespace-nowrap">{r.line}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.occ}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.margin}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.cit}</td>
                    <td className="py-1.5">
                      <Pill tone={r.pill}>{r.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="By state" sub="Locations · occupancy · margin · open citations">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                  <th className="py-1.5 pr-3 font-semibold">State</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Loc.</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Occ</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Margin</th>
                  <th className="py-1.5 font-semibold text-right">Cit.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ph-gray-100">
                {states.map((s) => (
                  <tr key={s.code}>
                    <td className="py-1.5 pr-3 font-medium text-ph-ink">{s.state_name}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{s.locations}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{s.occupancy_pct}%</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{s.operating_margin_pct}%</td>
                    <td className="py-1.5 text-right tabular-nums">{s.citations_12m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => fireToast("Regenerating narrative… (demo)")}
            className="mt-3 text-[11px] text-ph-primary hover:underline"
          >
            ↻ Regenerate narrative
          </button>
        </Card>
      </div>
    </section>
  );
}
