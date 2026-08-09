/*
 * Financial Insights content per scope. The enterprise variant computes its
 * KPI values from the dataset (selectors); the MD / Chesapeake variants and
 * every variance tree are authored data — they encode the demo storyline
 * (Chesapeake + Coastal Pines), which is not derivable from the JSON.
 */
import type { FinScope, FinVariant, IngestionChip } from "./types";
import { enterpriseTrend, latestMonth, portfolio } from "./selectors";

export const FIN_INGESTION: IngestionChip[] = [
  { label: "Monthly income statement", sub: "Ingested 05-31 · 180 cost centers · validated", tone: "green" },
  { label: "PeopleSoft 9.2 (labor)", sub: "Last refresh 06:10 ET · 100% complete", tone: "green" },
  { label: "Census / occupancy (EMR)", sub: "Last refresh 02:40 ET · 2 sites pending", tone: "amber" },
  { label: "ODS general ledger", sub: "Ingested 05-31 · reconciled", tone: "green" },
];

function enterpriseVariant(): FinVariant {
  const p = portfolio();
  const m = latestMonth();
  return {
    banner: "Portfolio · 180 locations · 6 states",
    bannerSub: "enterprise finance · all cost centers",
    kpis: [
      { accent: "teal", label: "Revenue (month)", value: `$${m.revenueM.toFixed(1)}M`, delta: "▲ +2.1% MoM", deltaTone: "good", sub: `vs $${m.revenuePrevM.toFixed(1)}M Apr` },
      { accent: "burgundy", status: "red", label: "Operating Margin", value: `${m.marginPct}%`, delta: "▼ –30bps MoM", deltaTone: "bad", sub: "May exit · 9.0% target" },
      { accent: "amber", status: "amber", label: "Labor % of Revenue", value: `${p.labor_pct_of_revenue}%`, delta: "▲ +90bps YoY", deltaTone: "bad", sub: "SNF 60.3%" },
      { accent: "green", label: "Occupancy / Census", value: `${p.avg_occupancy_pct}%`, delta: "▲ +1.4pts", deltaTone: "good", sub: "blended" },
      { accent: "sage", label: "PDPM Case-Mix Index", value: `${p.pdpm_case_mix_index}`, delta: "flat QoQ", deltaTone: "neutral", sub: "skilled nursing" },
      { accent: "amber", status: "amber", label: "Agency Cost", value: `${p.agency_hours_pct}%`, delta: "▼ –1.9pts", deltaTone: "good", sub: "of nursing hours" },
    ],
    vTitle: "Variance tree — May margin vs budget",
    vSub: "–110bps total",
    vTree: [
      {
        name: "Labor & agency", w: 78, tone: "r", variance: "–86bps",
        kids: [
          { name: "Agency premium — Chesapeake, Coastal Pines", v: "–41bps" },
          { name: "Overtime — skilled nursing (6 sites)", v: "–28bps" },
          { name: "Merit / wage inflation", v: "–17bps" },
        ],
      },
      {
        name: "Revenue / payer mix", w: 31, tone: "g", variance: "+34bps",
        kids: [
          { name: "Medicare Advantage rate uplift", v: "+22bps" },
          { name: "Occupancy recovery (AL)", v: "+12bps" },
        ],
      },
      {
        name: "Non-labor opex", w: 53, tone: "r", variance: "–58bps",
        kids: [
          { name: "Supplies & pharmacy", v: "–34bps" },
          { name: "Utilities / facilities", v: "–24bps" },
        ],
      },
    ],
    ai: `May margin landed <strong>–110bps vs budget</strong>; roughly <strong>78% of the miss is labor & agency</strong> (–86bps), concentrated in agency premium at <strong>Chesapeake</strong> and <strong>Coastal Pines</strong> (–41bps) plus skilled-nursing overtime across 6 sites (–28bps). Revenue and payer mix added <strong class="text-[#2E7D5B]">+34bps</strong> on the Medicare Advantage uplift; non-labor opex slipped –58bps on supplies & pharmacy. The two worst-margin SNFs also carry the highest open-citation counts — staffing instability is compounding compliance risk.`,
    aiSources: ["GL variance · ODS", "PeopleSoft labor", "semantic model · May 2026"],
    anomalies: [
      { kpi: "Agency % — Chesapeake", val: "14.2%", exp: "7.5%", score: "0.94", scoreTone: "r", driver: "RN vacancy + overtime", action: "investigate" },
      { kpi: "Operating margin — Coastal Pines", val: "3.1%", exp: "7.0%", score: "0.89", scoreTone: "r", driver: "occupancy + agency", action: "investigate" },
      { kpi: "Supplies / pharmacy — SNF portfolio", val: "+34bps", exp: "+5bps", score: "0.71", scoreTone: "a", driver: "pharmacy unit cost", action: "acknowledge" },
    ],
    trend: (() => {
      const t = enterpriseTrend();
      return { rev: t.rev, margin: t.margin, min: t.min, max: t.max };
    })(),
  };
}

const MD: FinVariant = {
  banner: "Maryland · 6 locations",
  bannerSub: "Baltimore corridor · region-scoped (Entra: PH-Finance-MD)",
  kpis: [
    { accent: "teal", label: "Region Revenue (month)", value: "$8.2M", delta: "Maryland · 6 locations", deltaTone: "neutral", sub: "TTM $98.5M" },
    { accent: "burgundy", status: "red", label: "Operating Margin", value: "5.5%", delta: "▼ –340bps vs portfolio", deltaTone: "bad", sub: "9.0% target" },
    { accent: "amber", status: "amber", label: "Labor % of Revenue", value: "63.4%", delta: "▲ vs 57.7% portfolio", deltaTone: "bad", sub: "SNF-weighted" },
    { accent: "green", status: "red", label: "Occupancy / Census", value: "78.8%", delta: "▼ vs 84.8% portfolio", deltaTone: "bad", sub: "SNF-weighted" },
    { accent: "sage", label: "PDPM Case-Mix Index", value: "1.09", delta: "higher acuity", deltaTone: "neutral", sub: "skilled nursing" },
    { accent: "amber", status: "red", label: "Agency Cost", value: "12.9%", delta: "▲ vs 6.5% portfolio", deltaTone: "bad", sub: "of nursing hours" },
  ],
  vTitle: "Variance tree — May margin vs budget",
  vSub: "Maryland · –180bps total",
  vTree: [
    {
      name: "Labor & agency", w: 88, tone: "r", variance: "–140bps",
      kids: [
        { name: "Agency premium — Chesapeake, Annapolis", v: "–78bps" },
        { name: "Overtime — skilled nursing (RN vacancies)", v: "–42bps" },
        { name: "Merit / wage inflation", v: "–20bps" },
      ],
    },
    { name: "Occupancy / revenue", w: 38, tone: "r", variance: "–30bps", kids: [{ name: "Census below plan — Baltimore corridor", v: "–30bps" }] },
    { name: "Non-labor opex", w: 16, tone: "r", variance: "–10bps", kids: [{ name: "Supplies & pharmacy", v: "–10bps" }] },
  ],
  ai: `The Maryland margin gap is <strong>~85% labor-driven</strong>. Agency premium at <strong>Chesapeake</strong> and <strong>Annapolis</strong> (–78bps) dominates, compounded by RN-vacancy overtime. Occupancy at <strong>78.8%</strong> (vs 84.8% portfolio) adds a revenue drag. Both worst-margin SNFs also carry the region's highest open-citation counts — staffing instability is compounding compliance risk.`,
  aiSources: ["GL variance · ODS", "PeopleSoft labor", "semantic model · May 2026"],
  anomalies: [
    { kpi: "Agency % — Chesapeake", val: "14.2%", exp: "7.5%", score: "0.94", scoreTone: "r", driver: "RN vacancy + overtime", action: "investigate" },
    { kpi: "Agency % — Annapolis", val: "14.8%", exp: "7.5%", score: "0.92", scoreTone: "r", driver: "RN vacancy", action: "investigate" },
    { kpi: "Operating margin — Annapolis", val: "2.3%", exp: "7.0%", score: "0.90", scoreTone: "r", driver: "agency + occupancy", action: "investigate" },
    { kpi: "Occupancy — Silver Spring", val: "76.0%", exp: "84.0%", score: "0.74", scoreTone: "a", driver: "census decline", action: "acknowledge" },
  ],
  trend: { rev: [8.0, 7.9, 8.3, 8.1, 8.2], margin: [6.2, 6.0, 5.9, 5.6, 5.5], min: 4, max: 8 },
};

const CHESAPEAKE: FinVariant = {
  banner: "Chesapeake [Illustrative] · Baltimore, MD",
  bannerSub: "1 location · facility-scoped",
  kpis: [
    { accent: "teal", label: "Facility Revenue (month)", value: "$2.0M", delta: "Baltimore, MD", deltaTone: "neutral", sub: "TTM $23.8M" },
    { accent: "burgundy", status: "red", label: "Operating Margin", value: "2.4%", delta: "▼ lowest in portfolio", deltaTone: "bad", sub: "9.0% target" },
    { accent: "amber", status: "red", label: "Labor % of Revenue", value: "66.1%", delta: "▲ highest in portfolio", deltaTone: "bad", sub: "skilled nursing" },
    { accent: "green", status: "red", label: "Occupancy / Census", value: "76.9%", delta: "▼ vs 84.8% portfolio", deltaTone: "bad", sub: "skilled nursing" },
    { accent: "sage", label: "PDPM Case-Mix Index", value: "1.08", delta: "flat", deltaTone: "neutral", sub: "skilled nursing" },
    { accent: "amber", status: "red", label: "Agency Cost", value: "14.2%", delta: "▲ vs 6.5% portfolio", deltaTone: "bad", sub: "RN vacancies" },
  ],
  vTitle: "Variance tree — May margin vs budget",
  vSub: "Chesapeake · –410bps total",
  vTree: [
    {
      name: "Labor & agency", w: 92, tone: "r", variance: "–320bps",
      kids: [
        { name: "Agency premium — RN vacancies", v: "–180bps" },
        { name: "Overtime — skilled nursing", v: "–100bps" },
        { name: "Merit / wage inflation", v: "–40bps" },
      ],
    },
    { name: "Occupancy / revenue", w: 46, tone: "r", variance: "–70bps", kids: [{ name: "Census 76.9% vs 84.8% plan", v: "–70bps" }] },
    { name: "Non-labor opex", w: 14, tone: "r", variance: "–20bps", kids: [{ name: "Supplies & pharmacy", v: "–20bps" }] },
  ],
  ai: `Chesapeake's margin breach is <strong>~80% staffing-driven</strong>: agency premium and RN-vacancy overtime (–280bps combined). Occupancy at <strong>76.9%</strong> adds a –70bps revenue drag. The open <strong>F689 immediate-jeopardy</strong> citation correlates directly with the staffing instability — the same RN vacancies driving cost are driving the accident-hazard risk.`,
  aiSources: ["GL variance · ODS", "PeopleSoft labor", "CMS-2567 · F689"],
  anomalies: [
    { kpi: "Agency % — Chesapeake", val: "14.2%", exp: "7.5%", score: "0.94", scoreTone: "r", driver: "RN vacancy + overtime", action: "investigate" },
    { kpi: "Operating margin — Chesapeake", val: "2.4%", exp: "7.0%", score: "0.91", scoreTone: "r", driver: "agency + occupancy", action: "investigate" },
    { kpi: "Occupancy — Chesapeake", val: "76.9%", exp: "84.0%", score: "0.81", scoreTone: "a", driver: "census decline", action: "acknowledge" },
  ],
  trend: { rev: [2.05, 1.98, 2.02, 2.0, 2.01], margin: [3.4, 3.1, 2.9, 2.6, 2.4], min: 1, max: 6 },
};

export function finVariant(scope: FinScope): FinVariant {
  if (scope === "md") return MD;
  if (scope === "chesapeake") return CHESAPEAKE;
  return enterpriseVariant();
}
