/*
 * Survey toolset — the State Survey prototype's functions exposed to the agent.
 *
 * Every tool is a pure read over the deterministic mock dataset in
 * src/lib/mock-data.ts (plus the shared POC drafting logic), so the agent's
 * answers always match what the dashboard pages render.
 */
import { tool } from "ai";
import { z } from "zod";
import {
  FACILITIES,
  FTAGS,
  SURVEYS_BY_DATE_DESC,
  categoryFor,
  dashboardKpis,
  ftagFrequency,
  getFacility,
  getFtag,
  getSurvey,
  scopeSeverityBand,
  severityCounts,
  surveysByFacility,
} from "@/lib/mock-data";
import type { Survey } from "@/lib/types";
import { draftPoc } from "@/lib/poc-draft";

const SOURCE = "Survey dataset · illustrative (5 facilities, 30 surveys)";

function findFacility(query: string) {
  const q = query.trim().toLowerCase();
  return (
    FACILITIES.find((f) => f.id.toLowerCase() === q) ??
    FACILITIES.find(
      (f) => f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q),
    )
  );
}

function surveySummary(s: Survey) {
  const f = getFacility(s.facilityId);
  return {
    surveyId: s.id,
    facility: f?.name ?? s.facilityId,
    state: f?.state,
    surveyDate: s.surveyDate,
    surveyType: s.surveyType,
    worstSeverity: s.worstSeverity,
    pocStatus: s.pocStatus,
    pocDueDate: s.pocDueDate,
    deficiencies: s.deficiencies.map((d) => ({
      ftag: d.ftag,
      category: categoryFor(d.ftag),
      grade: d.scopeSeverity,
      severity: d.severity,
    })),
  };
}

export const surveyTools = {
  list_surveys: tool({
    description:
      "List CMS-2567 surveys from the survey dataset, newest first. status='open' (default) lists surveys whose Plan of Correction is not yet submitted; 'submitted' the rest; 'all' both. Optionally filter to one facility by name, city, or id.",
    inputSchema: z.object({
      status: z.enum(["open", "submitted", "all"]).optional(),
      facility: z.string().optional().describe("Facility name, city, or id"),
      limit: z.number().int().min(1).max(30).optional(),
    }),
    execute: async ({ status = "open", facility, limit = 15 }) => {
      let rows = SURVEYS_BY_DATE_DESC;
      if (facility) {
        const f = findFacility(facility);
        if (!f) return { error: `No facility matching "${facility}". Facilities: ${FACILITIES.map((x) => x.name).join(", ")}` };
        rows = rows.filter((s) => s.facilityId === f.id);
      }
      if (status !== "all") {
        rows = rows.filter((s) =>
          status === "open" ? s.pocStatus !== "POC submitted" : s.pocStatus === "POC submitted",
        );
      }
      return {
        _source: SOURCE,
        count: rows.length,
        surveys: rows.slice(0, limit).map(surveySummary),
      };
    },
  }),

  search_surveys: tool({
    description:
      "Search surveys by F-tag (e.g. F0880), state (FL/GA), severity phrase (e.g. 'Immediate jeopardy'), or POC due date window. Combine filters freely.",
    inputSchema: z.object({
      ftag: z.string().optional().describe("F-tag code, e.g. F0689"),
      state: z.string().optional().describe("Two-letter state, e.g. FL"),
      severity: z.string().optional().describe("Severity phrase to match, e.g. 'Immediate jeopardy'"),
      dueWithinDays: z.number().int().optional().describe("Only surveys whose POC is due within N days"),
      limit: z.number().int().min(1).max(30).optional(),
    }),
    execute: async ({ ftag, state, severity, dueWithinDays, limit = 15 }) => {
      let rows = SURVEYS_BY_DATE_DESC;
      if (ftag) {
        const code = ftag.trim().toUpperCase();
        rows = rows.filter((s) => s.deficiencies.some((d) => d.ftag === code));
      }
      if (state) {
        const st = state.trim().toUpperCase();
        rows = rows.filter((s) => getFacility(s.facilityId)?.state === st);
      }
      if (severity) {
        const sev = severity.trim().toLowerCase();
        rows = rows.filter((s) =>
          s.deficiencies.some((d) => d.severity.toLowerCase().includes(sev)),
        );
      }
      if (dueWithinDays != null) {
        const cutoff = Date.now() + dueWithinDays * 86_400_000;
        rows = rows.filter(
          (s) => s.pocStatus !== "POC submitted" && new Date(s.pocDueDate).getTime() <= cutoff,
        );
      }
      return {
        _source: SOURCE,
        count: rows.length,
        surveys: rows.slice(0, limit).map(surveySummary),
      };
    },
  }),

  get_survey: tool({
    description:
      "Full detail for one survey: every cited deficiency with F-tag, clinical category, scope-severity grade + CMS enforcement band, residents affected, plus POC status and drafted corrective actions. Set includeNarratives=true to get the full surveyor narrative per deficiency.",
    inputSchema: z.object({
      surveyId: z.string(),
      includeNarratives: z.boolean().optional(),
    }),
    execute: async ({ surveyId, includeNarratives = false }) => {
      const s = getSurvey(surveyId.trim());
      if (!s) return { error: `Unknown survey id: ${surveyId}` };
      const f = getFacility(s.facilityId);
      return {
        _source: SOURCE,
        surveyId: s.id,
        facility: f?.name,
        state: f?.state,
        region: f?.region,
        surveyDate: s.surveyDate,
        surveyorOrg: s.surveyorOrg,
        surveyType: s.surveyType,
        pocStatus: s.pocStatus,
        pocDueDate: s.pocDueDate,
        worstSeverity: s.worstSeverity,
        deficiencies: s.deficiencies.map((d) => {
          const band = scopeSeverityBand(d.scopeSeverity);
          return {
            ftag: d.ftag,
            title: getFtag(d.ftag)?.shortTitle,
            category: categoryFor(d.ftag),
            severity: d.severity,
            residentsAffected: d.residentsAffected,
            grade: d.scopeSeverity,
            enforcementBand: band.label,
            enforcementAction: band.action,
            narrative: includeNarratives
              ? d.narrative
              : d.narrative.slice(0, 160) + (d.narrative.length > 160 ? "…" : ""),
          };
        }),
        draftedPocActivities: s.pocActivities.map((a) => ({
          id: a.id,
          action: a.text,
          owner: a.owner,
          cadence: a.cadence,
          status: a.status,
          targetCompletionDate: a.targetCompletionDate,
          citesExemplar: a.citation.exemplarId,
        })),
      };
    },
  }),

  get_facility: tool({
    description:
      "Profile + survey history for one facility (by name, city, or id): org hierarchy, beds, all surveys with status, and its most-cited F-tags.",
    inputSchema: z.object({
      query: z.string().describe("Facility name, city, or id"),
    }),
    execute: async ({ query }) => {
      const f = findFacility(query);
      if (!f) return { error: `No facility matching "${query}". Facilities: ${FACILITIES.map((x) => x.name).join(", ")}` };
      const history = surveysByFacility(f.id);
      const tagCounts = new Map<string, number>();
      for (const s of history)
        for (const d of s.deficiencies)
          tagCounts.set(d.ftag, (tagCounts.get(d.ftag) ?? 0) + 1);
      return {
        _source: SOURCE,
        facility: {
          id: f.id,
          name: f.name,
          city: f.city,
          state: f.state,
          bu: f.bu,
          region: f.region,
          division: f.division,
          censusBeds: f.censusBeds,
        },
        openSurveys: history.filter((s) => s.pocStatus !== "POC submitted").length,
        totalSurveys: history.length,
        topFtags: [...tagCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([code, count]) => ({
            ftag: code,
            category: categoryFor(code),
            citations: count,
          })),
        surveys: history.map(surveySummary),
      };
    },
  }),

  survey_stats: tool({
    description:
      "Portfolio-level survey KPIs from the survey dataset: open surveys, POCs due within 7 days, total deficiencies, Immediate Jeopardy count, most-cited F-tags, and the severity distribution. Use for 'how are we doing on surveys overall' questions.",
    inputSchema: z.object({}),
    execute: async () => {
      const freq = [...ftagFrequency().entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, count]) => ({
          ftag: code,
          title: getFtag(code)?.shortTitle,
          category: categoryFor(code),
          citations: count,
        }));
      return {
        _source: SOURCE,
        kpis: dashboardKpis(),
        mostCitedFtags: freq,
        severityDistribution: Object.fromEntries(severityCounts()),
        facilities: FACILITIES.map((f) => ({ id: f.id, name: f.name, state: f.state })),
      };
    },
  }),

  draft_poc: tool({
    description:
      "Draft Plan-of-Correction corrective actions for a citation, grounded in historical accepted POCs for the same F-tag. Provide an F-tag (e.g. F0880), a clinical category (e.g. 'Infection Prevention & Control'), or a surveyId. ALWAYS present the result as a DRAFT requiring compliance review.",
    inputSchema: z.object({
      ftag: z.string().optional(),
      category: z
        .string()
        .optional()
        .describe(`One of: ${[...new Set(FTAGS.map((f) => f.category))].join(", ")}`),
      surveyId: z.string().optional(),
      facility: z.string().optional(),
    }),
    execute: async (input) => {
      const result = draftPoc(input);
      if (!result.ok) return { error: result.error };
      return { _source: SOURCE, ...result.payload };
    },
  }),
};
