// Pre-canned NLQ Q&A pairs for the trends-page chat widget.
// Each answer cites 1–3 mock surveys by id. The widget renders citations
// as clickable chips that open /surveys/{id}.
//
// In production: a Foundry agent grounds answers in the FHIR Bundle +
// Lakehouse SQL + AI Search, with cite-or-refuse enforcement. This map
// models that shape (every answer carries citations) without the real LLM.

import { SURVEYS, FACILITIES, getFacility, getFtag, categoryFor, facilitySeverityWeight } from "./mock-data";

export type NlqCitation = {
  surveyId: string;
  label: string; // human-readable, e.g. "Fleming Island · F0677 · 2024-10-08"
};

export type NlqAnswer = {
  text: string;
  citations: NlqCitation[];
};

function citationFor(surveyId: string): NlqCitation | null {
  const s = SURVEYS.find((x) => x.id === surveyId);
  if (!s) return null;
  const f = getFacility(s.facilityId);
  if (!f) return null;
  const lead = s.deficiencies[0]?.ftag ?? "";
  return {
    surveyId,
    label: `${f.name.replace("Pruitthealth ", "")} · ${lead} · ${s.surveyDate.slice(0, 10)}`,
  };
}

// Pull a few deterministic surveys for citations
const f0677Surveys = SURVEYS.filter((s) => s.deficiencies.some((d) => d.ftag === "F0677")).slice(0, 3);
const ijSurveys = SURVEYS.filter((s) => s.worstSeverity === "Immediate jeopardy").slice(0, 2);
const f0686Surveys = SURVEYS.filter((s) => s.deficiencies.some((d) => d.ftag === "F0686")).slice(0, 2);
const flemingSurveys = SURVEYS.filter((s) => s.facilityId === "fleming-island").slice(0, 1);

// Canned questions — keyword-matched. First match wins.
export const CANNED: { keywords: string[]; suggest: string; build: () => NlqAnswer }[] = [
  {
    keywords: ["f0677", "adl", "activities of daily living", "fingernails", "ada"],
    suggest: "Which facilities had F0677 deficiencies in the last 90 days?",
    build: () => {
      const facs = new Map<string, number>();
      for (const s of f0677Surveys) {
        const f = getFacility(s.facilityId);
        if (f) facs.set(f.name, (facs.get(f.name) ?? 0) + 1);
      }
      const list = Array.from(facs.entries())
        .map(([n, c]) => `${n.replace("Pruitthealth ", "")} (${c})`)
        .join(", ");
      return {
        text: `${f0677Surveys.length} surveys cited F0677 (${getFtag("F0677")?.shortTitle}) across ${facs.size} facility(ies) in the trailing 90 days: ${list}. Severity is concentrated in the "Minimal harm" tier; one Actual-harm finding flagged for re-audit.`,
        citations: f0677Surveys
          .map((s) => citationFor(s.id))
          .filter((c): c is NlqCitation => c !== null),
      };
    },
  },
  {
    keywords: ["immediate jeopardy", "ij", "jeopardy", "highest severity", "critical"],
    suggest: "Show me Immediate Jeopardy surveys.",
    build: () => {
      const facs = new Set<string>();
      for (const s of ijSurveys) {
        const f = getFacility(s.facilityId);
        if (f) facs.add(f.name);
      }
      return {
        text: `${ijSurveys.length} survey(s) in the trailing 12 months carry an Immediate-Jeopardy citation (grade J–L), across ${facs.size} facility(ies): ${Array.from(facs).map((n) => n.replace("Pruitthealth ", "")).join(", ")}. Each triggered the cross-facility escalation pathway and is referenced in the corresponding MeasureReport.`,
        citations: ijSurveys.map((s) => citationFor(s.id)).filter((c): c is NlqCitation => c !== null),
      };
    },
  },
  {
    keywords: ["facilities", "which facilities", "facility ranking", "heaviest", "worst facilities", "highest risk", "priorit"],
    suggest: "Which facilities carry the heaviest citations?",
    build: () => {
      const ranked = [...FACILITIES]
        .map((f) => ({ f, w: facilitySeverityWeight(f.id) }))
        .sort((a, b) => b.w - a.w);
      const top = ranked.slice(0, 3).map(({ f }) => f.name.replace("Pruitthealth ", "")).join(", ");
      const worst = ranked[0]?.f;
      const worstSurvey = worst
        ? SURVEYS.filter((s) => s.facilityId === worst.id).sort(
            (a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime(),
          )[0]
        : undefined;
      return {
        text: `Ranked by scope-severity weight, the heaviest-cited facilities are: ${top}. ${worst ? worst.name.replace("Pruitthealth ", "") : ""} leads on enforcement risk and should be prioritized for Plan-of-Correction review.`,
        citations: worstSurvey
          ? [citationFor(worstSurvey.id)].filter((c): c is NlqCitation => c !== null)
          : [],
      };
    },
  },
  {
    keywords: ["f0686", "pressure ulcer", "ulcer", "bedsore"],
    suggest: "Where are pressure-ulcer issues concentrated?",
    build: () => {
      const facs = new Map<string, number>();
      for (const s of f0686Surveys) {
        const f = getFacility(s.facilityId);
        if (f) facs.set(f.name, (facs.get(f.name) ?? 0) + 1);
      }
      const list = Array.from(facs.entries())
        .map(([n, c]) => `${n.replace("Pruitthealth ", "")} (${c})`)
        .join(", ");
      return {
        text: `Pressure-ulcer (F0686) citations are concentrated at: ${list}. Wound-rounds frequency was increased to twice-weekly at the higher-incidence facility; corrective-action review pending in 30 days.`,
        citations: f0686Surveys.map((s) => citationFor(s.id)).filter((c): c is NlqCitation => c !== null),
      };
    },
  },
  {
    keywords: ["fleming island", "fleming", "my facility", "top deficiencies", "my citations"],
    suggest: "What are the top citations at Fleming Island?",
    build: () => {
      const flem = SURVEYS.filter((s) => s.facilityId === "fleming-island");
      const open = flem.filter((s) => s.pocStatus !== "POC submitted");
      const cats = Array.from(
        new Set(open.flatMap((s) => s.deficiencies.map((d) => categoryFor(d.ftag)))),
      );
      return {
        text: `Fleming Island has ${open.length} open survey(s). The active citations span ${cats.join(", ")} — led by Infection Prevention & Control at Immediate Jeopardy (grade L), which requires a Plan of Correction immediately. Staffing and Comprehensive Care Planning are at actual-harm grade.`,
        citations: flemingSurveys.map((s) => citationFor(s.id)).filter((c): c is NlqCitation => c !== null),
      };
    },
  },
  {
    keywords: ["severity", "distribution", "harm tier"],
    suggest: "What's the severity distribution this quarter?",
    build: () => {
      const counts: Record<string, number> = {};
      for (const s of SURVEYS) for (const d of s.deficiencies) counts[d.severity] = (counts[d.severity] ?? 0) + 1;
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const lines = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([sev, n]) => `${sev}: ${n} (${((n / total) * 100).toFixed(0)}%)`)
        .join(" · ");
      return {
        text: `Across ${total} citations: ${lines}. Distribution mirrors published LTC patterns; "Minimal harm" remains the modal tier.`,
        citations: f0677Surveys.slice(0, 1).map((s) => citationFor(s.id)).filter((c): c is NlqCitation => c !== null),
      };
    },
  },
];

export const REFUSAL =
  "I can answer questions about F-tag distribution, severity trends, cross-facility comparisons, and Immediate Jeopardy cases. Try one of the suggestions above.";

export function answerFor(query: string): NlqAnswer | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  for (const c of CANNED) {
    if (c.keywords.some((k) => q.includes(k))) return c.build();
  }
  return null;
}

export const SUGGESTIONS = CANNED.map((c) => c.suggest);
