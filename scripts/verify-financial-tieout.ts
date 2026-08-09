/*
 * Tie-out check — asserts the financial dataset is self-consistent and that
 * the selectors' derivations match the dataset's own aggregates. Run with:
 *   node_modules/.bin/tsx scripts/verify-financial-tieout.ts
 * Exits 1 on any mismatch.
 */
import data from "../src/lib/financial-data.json";

type Row = Record<string, unknown>;
const d = data as unknown as {
  _meta: { location_count: number };
  portfolio_summary: Record<string, number | Record<string, number>>;
  state_summary: Record<string, Row | string>;
  service_line_benchmarks: Record<string, Row>;
  facilities: Record<string, Row>;
  citation_taxonomy: Record<string, { count_12m: number }>;
};

let failures = 0;
function check(name: string, ok: boolean, detail: string) {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} — ${detail}`);
  }
}
function approx(a: number, b: number, tolPct = 1.5) {
  return Math.abs(a - b) <= Math.abs(b) * (tolPct / 100);
}

const rows = Object.values(d.facilities);
console.log(`Tie-out over ${rows.length} facility rows\n`);

// 1. Location count
check(
  "location count",
  rows.length === d._meta.location_count &&
    rows.length === (d.portfolio_summary.locations as number),
  `${rows.length} vs meta ${d._meta.location_count} / portfolio ${d.portfolio_summary.locations}`,
);

// 2. TTM revenue = sum of facility revenue
const revSum = rows.reduce((acc, f) => acc + (f.revenue_ttm_M as number), 0);
check(
  "TTM revenue ties to roster",
  approx(revSum, d.portfolio_summary.ttm_revenue_M as number),
  `sum ${revSum.toFixed(1)} vs portfolio ${d.portfolio_summary.ttm_revenue_M}`,
);

// 3. Blended margin = revenue-weighted mean
const wMargin =
  rows.reduce((acc, f) => acc + (f.operating_margin_pct as number) * (f.revenue_ttm_M as number), 0) /
  revSum;
check(
  "blended operating margin ties (revenue-weighted)",
  approx(wMargin, d.portfolio_summary.blended_operating_margin_pct as number, 2.5),
  `${wMargin.toFixed(2)} vs ${d.portfolio_summary.blended_operating_margin_pct}`,
);

// 4. State rollup: per-state location counts + citations
for (const [code, s] of Object.entries(d.state_summary)) {
  if (typeof s === "string") continue;
  const inState = rows.filter((f) => f.state === code);
  check(
    `state ${code} location count`,
    inState.length === (s.locations as number),
    `${inState.length} vs ${s.locations}`,
  );
  const cit = inState.reduce((acc, f) => acc + (f.survey_citations_12m as number), 0);
  check(`state ${code} citations`, cit === (s.citations_12m as number), `${cit} vs ${s.citations_12m}`);
}

// 5. Service-line benchmark location counts
for (const [line, b] of Object.entries(d.service_line_benchmarks)) {
  const n = rows.filter((f) => f.service_line === line).length;
  check(`service line "${line}" count`, n === (b.locations as number), `${n} vs ${b.locations}`);
}

// 6. Citation taxonomy total is within range of roster total
const rosterCit = rows.reduce((acc, f) => acc + (f.survey_citations_12m as number), 0);
const taxCit = Object.values(d.citation_taxonomy).reduce((acc, c) => acc + c.count_12m, 0);
check(
  "taxonomy total ≈ roster citations",
  approx(taxCit, rosterCit, 5),
  `taxonomy ${taxCit} vs roster ${rosterCit}`,
);

console.log(failures === 0 ? "\nAll tie-out checks passed." : `\n${failures} check(s) FAILED`);
process.exit(failures === 0 ? 0 : 1);
