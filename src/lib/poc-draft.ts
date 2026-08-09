/*
 * Shared Plan-of-Correction drafting logic.
 *
 * One implementation behind two callers: the public POST /api/poc-draft
 * endpoint (used by the Copilot Studio HTTP tool) and the agent's draft_poc
 * tool — so Teams, the web agent, and the REST endpoint tell one story.
 * Grounded in the same per-F-tag POC templates the web app renders.
 */
import {
  getFtag,
  getSurvey,
  getFacility,
  scopeSeverityBand,
  FTAGS,
} from "@/lib/mock-data";
import { pocStepsForFtag } from "@/lib/mock-poc";

export type PocDraftRequest = {
  ftag?: string;
  category?: string;
  surveyId?: string;
  facility?: string;
};

export type PocDraftPayload = {
  ftag: string;
  title: string;
  clinicalCategory: string;
  facility: string | null;
  severity: string | null;
  scopeSeverityGrade: string | null;
  enforcement: string | null;
  enforcementAction: string | null;
  recommendedActions: {
    step: number;
    action: string;
    owner: string;
    cadence: string;
    citesExemplar: string;
  }[];
  note: string;
  disclaimer: string;
};

export type PocDraftResult =
  | { ok: true; payload: PocDraftPayload }
  | { ok: false; status: 400 | 404; error: string };

function ftagForCategory(category: string): string | undefined {
  const c = category.trim().toLowerCase();
  return FTAGS.find((f) => f.category.toLowerCase() === c)?.code;
}

export function draftPoc(body: PocDraftRequest): PocDraftResult {
  let ftag = body.ftag?.trim().toUpperCase();
  if (!ftag && body.category) ftag = ftagForCategory(body.category);

  // Enrich from a real survey when an id is supplied (facility + grade + severity).
  let facility = body.facility ?? null;
  let severity: string | null = null;
  let grade: string | null = null;
  if (body.surveyId) {
    const survey = getSurvey(body.surveyId);
    if (survey) {
      facility = getFacility(survey.facilityId)?.name ?? facility;
      const d = ftag
        ? survey.deficiencies.find((x) => x.ftag === ftag)
        : survey.deficiencies[0];
      if (d) {
        ftag = ftag ?? d.ftag;
        severity = d.severity;
        grade = d.scopeSeverity;
      }
    }
  }

  if (!ftag) {
    return {
      ok: false,
      status: 400,
      error: "Provide one of: ftag, category, or surveyId.",
    };
  }
  const ft = getFtag(ftag);
  if (!ft) {
    return { ok: false, status: 404, error: `Unknown F-tag: ${ftag}` };
  }

  const band = grade ? scopeSeverityBand(grade) : null;
  const steps = pocStepsForFtag(ftag);

  return {
    ok: true,
    payload: {
      ftag,
      title: ft.shortTitle,
      clinicalCategory: ft.category,
      facility,
      severity,
      scopeSeverityGrade: grade,
      enforcement: band ? band.label : null,
      enforcementAction: band ? band.action : null,
      recommendedActions: steps.map((s, i) => ({
        step: i + 1,
        action: s.text,
        owner: s.owner,
        cadence: s.cadence,
        citesExemplar: s.exemplarId,
      })),
      note: "Grounded in historical accepted POCs for the same F-tag. Synthetic demonstration data.",
      disclaimer: "Plan-of-Correction guidance only — not medical advice.",
    },
  };
}
