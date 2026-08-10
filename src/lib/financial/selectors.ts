/*
 * Selectors — every number the Financial section renders from the dataset
 * comes through here. This is the structural fix over the vendor demo, which
 * hard-coded every figure in HTML and never read its own JSON.
 *
 * `scripts/verify-financial-tieout.ts` asserts these stay consistent with the
 * dataset's own aggregates.
 */
import raw from "@/lib/financial-data.json";
import type { FinScope, RosterRow } from "./types";

type FacilityRow = {
  name: string;
  city: string;
  state: string;
  service_line: string;
  beds: number | null;
  occupancy_pct: number | null;
  operating_margin_pct: number;
  revenue_ttm_M: number;
  labor_pct: number;
  agency_pct: number;
  pdpm_cmi: number | null;
  survey_citations_12m: number;
  highest_severity: string | null;
  open_pocs: number;
  status: "risk" | "warn" | "out" | "ok";
};

type StateRow = {
  state_name: string;
  locations: number;
  operating_margin_pct: number;
  occupancy_pct: number;
  labor_pct_of_revenue: number;
  agency_pct: number;
  citations_12m: number;
  poc_on_time_pct: number;
};

export const DATA = raw as unknown as {
  _meta: { label: string; as_of: string; location_count: number; footprint_note: string };
  portfolio_summary: {
    locations: number;
    states: number;
    ttm_revenue_M: number;
    ttm_revenue_yoy_pct: number;
    blended_operating_margin_pct: number;
    blended_margin_delta_bps: number;
    avg_occupancy_pct: number;
    avg_occupancy_delta_pts: number;
    labor_pct_of_revenue: number;
    labor_delta_bps: number;
    agency_hours_pct: number;
    agency_delta_pts: number;
    pdpm_case_mix_index: number;
    open_surveys_90d: number;
    open_pocs: number;
    poc_on_time_pct: number;
    revenue_trend_M: Record<string, number>;
    margin_trend_pct: Record<string, number>;
  };
  state_summary: Record<string, StateRow | string>;
  service_line_benchmarks: Record<
    string,
    { locations: number; revenue_M: number; operating_margin_pct: number; occupancy_pct: number | null; labor_pct: number; agency_pct: number }
  >;
  facilities: Record<string, FacilityRow>;
  citation_taxonomy: Record<string, { count_12m: number; trend: string; top_ftags: string[] }>;
  citation_trend_monthly: { _note: string; months: string[]; series: Record<string, number[]> };
  severity_scale: Record<string, string>;
};

export const ILLUSTRATIVE = DATA._meta.label;
export const AS_OF = DATA._meta.as_of;

const MONTH_LABEL = (iso: string) =>
  new Date(iso + "-15").toLocaleString("en-US", { month: "short" });

export function portfolio() {
  return DATA.portfolio_summary;
}

/** Enterprise revenue/margin monthly trend, straight from the dataset. */
export function enterpriseTrend() {
  const p = DATA.portfolio_summary;
  const months = Object.keys(p.revenue_trend_M);
  return {
    labels: months.map(MONTH_LABEL),
    rev: months.map((m) => p.revenue_trend_M[m]),
    margin: months.map((m) => p.margin_trend_pct[m]),
    min: 6,
    max: 10,
  };
}

/** Latest month's figures (the "May 2026" income-statement view). */
export function latestMonth() {
  const p = DATA.portfolio_summary;
  const months = Object.keys(p.revenue_trend_M);
  const last = months[months.length - 1];
  const prev = months[months.length - 2];
  return {
    month: last,
    revenueM: p.revenue_trend_M[last],
    revenuePrevM: p.revenue_trend_M[prev],
    marginPct: p.margin_trend_pct[last],
  };
}

export function stateRollup() {
  return Object.entries(DATA.state_summary)
    .filter((e): e is [string, StateRow] => typeof e[1] !== "string")
    .map(([code, s]) => ({ code, ...s }))
    .sort((a, b) => b.locations - a.locations);
}

export function serviceLineBenchmarks() {
  return Object.entries(DATA.service_line_benchmarks).map(([line, b]) => ({ line, ...b }));
}

export function citationTaxonomy() {
  return Object.entries(DATA.citation_taxonomy)
    .map(([label, c]) => ({ label, count: c.count_12m, trend: c.trend, topTags: c.top_ftags }))
    .sort((a, b) => b.count - a.count);
}

export function citationTrendMonthly() {
  const t = DATA.citation_trend_monthly;
  return {
    labels: t.months.map(MONTH_LABEL),
    series: Object.entries(t.series).map(([name, values]) => ({ name, values })),
  };
}

export function severityScale() {
  return Object.entries(DATA.severity_scale).filter(([k]) => k !== "_note");
}

const STATUS_PILL: Record<FacilityRow["status"], { label: string; pill: RosterRow["pill"] }> = {
  risk: { label: "critical", pill: "r" },
  warn: { label: "watch", pill: "a" },
  out: { label: "strong", pill: "g" },
  ok: { label: "on track", pill: "s" },
};

/** Story-anchor facilities shown in the roster sample (the recurring cast). */
const ANCHOR_NAMES = [
  "Coastal Pines", "Magnolia Grove", "Peachtree Crossing", "Piedmont Manor",
  "Durham", "Triangle Home Health", "Cumberland", "Chattanooga",
  "Anderson", "Rock Hill", "Lowcountry", "Sunset Bay", "Gulf Coast",
];

function shortName(f: FacilityRow) {
  return f.name.replace(/^PruittHealth( Home Health| Hospice| Therapy)? — /, "");
}

function toRosterRow(f: FacilityRow): RosterRow {
  const st = STATUS_PILL[f.status];
  return {
    name: shortName(f),
    state: f.state,
    line: f.service_line === "Skilled Nursing" ? "Skilled nursing"
      : f.service_line === "Assisted Living" ? "Assisted living"
      : f.service_line === "Home Health" ? "Home health"
      : f.service_line,
    occ: f.occupancy_pct == null ? "—" : `${f.occupancy_pct}%`,
    margin: `${f.operating_margin_pct}%`,
    cit: f.survey_citations_12m,
    status: st.label,
    pill: st.pill,
  };
}

/** Worst operating margins in scope — the "facilities to tackle today" list. */
export function worstByMargin(scope: FinScope, n = 5) {
  let rows = Object.values(DATA.facilities);
  if (scope === "md") rows = rows.filter((f) => f.state === "MD");
  if (scope === "chesapeake") rows = rows.filter((f) => f.name.includes("Chesapeake"));
  return [...rows]
    .sort((a, b) => a.operating_margin_pct - b.operating_margin_pct)
    .slice(0, n)
    .map((f) => ({
      name: shortName(f),
      city: f.city,
      state: f.state,
      margin: f.operating_margin_pct,
      labor: f.labor_pct,
      agency: f.agency_pct,
      occ: f.occupancy_pct,
    }));
}

/** Roster sample: all Maryland locations + the story anchors, from the dataset. */
export function rosterSample(scope: "all" | "MD"): RosterRow[] {
  const rows = Object.values(DATA.facilities);
  const md = rows.filter((f) => f.state === "MD");
  if (scope === "MD") return md.map(toRosterRow);
  const anchors = ANCHOR_NAMES.map((n) => rows.find((f) => f.name.includes(n))).filter(
    (f): f is FacilityRow => Boolean(f),
  );
  return [...md, ...anchors].map(toRosterRow);
}
