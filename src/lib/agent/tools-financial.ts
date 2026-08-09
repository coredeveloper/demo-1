/*
 * Financial toolset — a direct port of the vendor package's six tools
 * (lib/tools.js executeTool) to AI SDK tool() definitions, unchanged behavior.
 * Reads the illustrative 180-location dataset bundled at build time.
 */
import { tool } from "ai";
import { z } from "zod";
import raw from "@/lib/financial-data.json";

type FacilityRow = {
  name: string;
  city: string;
  state: string;
  service_line: string;
  [metric: string]: string | number | null;
};

const DATA = raw as unknown as {
  _meta: { label: string; location_count: number; [k: string]: unknown };
  portfolio_summary: Record<string, unknown>;
  state_summary: Record<string, unknown>;
  service_line_benchmarks: Record<string, Record<string, unknown>>;
  facilities: Record<string, FacilityRow>;
  citation_taxonomy: unknown;
  citation_trend_monthly: unknown;
  severity_scale: unknown;
};

const NOTE = DATA._meta.label;

export const financialTools = {
  get_portfolio_summary: tool({
    description:
      "PruittHealth portfolio summary: locations, TTM revenue, blended operating margin, occupancy, labor %, agency hours, PDPM case-mix, open surveys, open POCs, and recent revenue/margin trend. Illustrative demo data.",
    inputSchema: z.object({}),
    execute: async () => ({ _note: NOTE, ...DATA.portfolio_summary }),
  }),

  get_state_summary: tool({
    description:
      "By-state rollup across the 6 states (FL, GA, NC, SC, TN, MD): locations, operating margin, occupancy, labor %, agency %, 12-month citations, and POC on-time rate. The natural cut for state-level survey-risk questions and state comparisons. Illustrative demo data.",
    inputSchema: z.object({}),
    execute: async () => ({ _note: NOTE, state_summary: DATA.state_summary }),
  }),

  get_service_line_benchmarks: tool({
    description:
      "Benchmark metrics by service line (locations, revenue, operating margin, occupancy, labor %, agency %). Omit service_line for all five.",
    inputSchema: z.object({
      service_line: z
        .string()
        .optional()
        .describe('"Skilled Nursing", "Assisted Living", "Home Health", "Hospice", or "Rehabilitation"'),
    }),
    execute: async ({ service_line }) => {
      if (service_line) {
        const b = DATA.service_line_benchmarks[service_line];
        if (!b)
          return {
            error: `No benchmarks for "${service_line}". Available: ${Object.keys(DATA.service_line_benchmarks).join(", ")}`,
          };
        return { _note: NOTE, service_line, ...b };
      }
      return { _note: NOTE, benchmarks: DATA.service_line_benchmarks };
    },
  }),

  get_citation_taxonomy: tool({
    description:
      "Portfolio-wide state-survey citations: 12-month counts by category (Clinical/Quality of Care, Infection Control, Resident Rights, Dietary, Environment/Safety, Administration) with top F-tags, PLUS a 6-month monthly trend for the three most-moving categories, PLUS the CMS severity scale (A–L) with plain-language meaning.",
    inputSchema: z.object({}),
    execute: async () => ({
      _note: NOTE,
      taxonomy: DATA.citation_taxonomy,
      monthly_trend: DATA.citation_trend_monthly,
      severity_scale: DATA.severity_scale,
    }),
  }),

  get_location: tool({
    description:
      "All illustrative metrics for one PruittHealth location. Search by location ID (e.g. PH-0042), name, or city.",
    inputSchema: z.object({
      query: z.string().describe("Location ID, name, or city"),
    }),
    execute: async ({ query }) => {
      const q = query.toLowerCase().trim();
      const matches = Object.entries(DATA.facilities).filter(
        ([id, f]) =>
          id.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          (f.city || "").toLowerCase().includes(q),
      );
      if (matches.length === 0)
        return {
          error: `No location found matching "${query}". This is an illustrative demo subset of ${DATA._meta.location_count} locations.`,
        };
      if (matches.length === 1) {
        const [id, f] = matches[0];
        return { _note: NOTE, location_id: id, ...f };
      }
      return {
        _note: NOTE,
        multiple_matches: matches.slice(0, 12).map(([id, f]) => ({
          location_id: id,
          name: f.name,
          city: f.city,
          state: f.state,
          service_line: f.service_line,
        })),
      };
    },
  }),

  search_locations: tool({
    description:
      "Find and rank PruittHealth locations by service line, state, or a metric. Metrics: occupancy_pct, operating_margin_pct, revenue_ttm_M, labor_pct, agency_pct, agency_hours_pct, survey_citations_12m, open_pocs, pdpm_cmi.",
    inputSchema: z.object({
      service_line: z.string().optional(),
      state: z.string().optional().describe("FL, GA, NC, SC, TN, MD"),
      metric: z.string().optional(),
      comparator: z.enum(["above", "below", "top", "bottom"]).optional(),
      value: z.number().optional(),
      limit: z.number().int().optional().describe("Max results (default 12)"),
    }),
    execute: async (input) => {
      let results = Object.entries(DATA.facilities);
      if (input.service_line)
        results = results.filter(([, f]) => f.service_line === input.service_line);
      if (input.state) results = results.filter(([, f]) => f.state === input.state);

      const metric = input.metric || "operating_margin_pct";
      const val = input.value;
      const limit = input.limit || 12;
      const num = (f: FacilityRow) => f[metric] as number | null | undefined;

      // Matches the original vendor semantics: 'above'/'below' without a
      // value filters everything out (comparison with undefined is false),
      // rather than silently returning unfiltered rows.
      if (input.comparator === "above")
        results = results.filter(([, f]) => num(f) != null && (num(f) as number) > (val as number));
      if (input.comparator === "below")
        results = results.filter(([, f]) => num(f) != null && (num(f) as number) < (val as number));
      if (input.comparator === "top")
        results = [...results]
          .filter(([, f]) => num(f) != null)
          .sort((a, b) => (num(b[1]) as number) - (num(a[1]) as number))
          .slice(0, val || limit);
      if (input.comparator === "bottom")
        results = [...results]
          .filter(([, f]) => num(f) != null)
          .sort((a, b) => (num(a[1]) as number) - (num(b[1]) as number))
          .slice(0, val || limit);

      const output = results.slice(0, limit).map(([id, f]) => ({
        location_id: id,
        name: f.name,
        service_line: f.service_line,
        state: f.state,
        city: f.city,
        [metric]: f[metric],
        operating_margin_pct: f.operating_margin_pct,
        occupancy_pct: f.occupancy_pct,
        survey_citations_12m: f.survey_citations_12m,
        open_pocs: f.open_pocs,
      }));
      return { _note: NOTE, query: input, result_count: output.length, results: output };
    },
  }),
};
