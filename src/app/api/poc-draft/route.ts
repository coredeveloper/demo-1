/*
 * POST /api/poc-draft — next-step Plan-of-Correction recommendations for a citation.
 *
 * The Teams Copilot agent (via a Power Automate flow tool) calls this to turn a
 * citation into concrete corrective actions — the "agent acts, not just answers"
 * moment. The drafting logic lives in src/lib/poc-draft.ts and is shared with the
 * conversational agent's draft_poc tool, so Teams and the dashboard tell one
 * story. Synthetic demo data; production would call the Foundry POC-drafting
 * agent behind the same contract.
 *
 * Body (any one of): { ftag } | { category } | { surveyId, ftag? } | { facility, ftag }
 */
import { NextResponse } from "next/server";
import { draftPoc, type PocDraftRequest } from "@/lib/poc-draft";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: PocDraftRequest = {};
  try {
    body = (await req.json()) as PocDraftRequest;
  } catch {
    /* empty/invalid body -> handled below */
  }

  const result = draftPoc(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.payload);
}

export function GET() {
  return NextResponse.json({
    usage:
      "POST JSON { ftag | category | surveyId (+ optional ftag) } → next-step POC recommendations",
    examples: [{ ftag: "F0880" }, { category: "Infection Prevention & Control" }],
  });
}
