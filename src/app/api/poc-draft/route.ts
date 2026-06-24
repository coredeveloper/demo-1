/*
 * POST /api/poc-draft — next-step Plan-of-Correction recommendations for a citation.
 *
 * The Teams Copilot agent (via a Power Automate flow tool) calls this to turn a
 * citation into concrete corrective actions — the "agent acts, not just answers"
 * moment. Grounded in the same per-F-tag POC templates the web app uses, so Teams
 * and the dashboard tell one story. Synthetic demo data; production would call the
 * Foundry POC-drafting agent behind the same contract.
 *
 * Body (any one of): { ftag } | { category } | { surveyId, ftag? } | { facility, ftag }
 */
import { NextResponse } from "next/server";
import {
  getFtag,
  getSurvey,
  getFacility,
  scopeSeverityBand,
  FTAGS,
} from "@/lib/mock-data";
import { pocStepsForFtag } from "@/lib/mock-poc";

export const runtime = "nodejs";

function ftagForCategory(category: string): string | undefined {
  const c = category.trim().toLowerCase();
  return FTAGS.find((f) => f.category.toLowerCase() === c)?.code;
}

type Body = {
  ftag?: string;
  category?: string;
  surveyId?: string;
  facility?: string;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty/invalid body -> handled below */
  }

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
    return NextResponse.json(
      { error: "Provide one of: ftag, category, or surveyId." },
      { status: 400 },
    );
  }
  const ft = getFtag(ftag);
  if (!ft) {
    return NextResponse.json({ error: `Unknown F-tag: ${ftag}` }, { status: 404 });
  }

  const band = grade ? scopeSeverityBand(grade) : null;
  const steps = pocStepsForFtag(ftag);

  return NextResponse.json({
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
  });
}

export function GET() {
  return NextResponse.json({
    usage: "POST JSON { ftag | category | surveyId (+ optional ftag) } → next-step POC recommendations",
    examples: [{ ftag: "F0880" }, { category: "Infection Prevention & Control" }],
  });
}
