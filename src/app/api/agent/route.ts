/*
 * POST /api/agent — the web surface of the agentic layer.
 *
 * Speaks the AI SDK UI message stream protocol (consumed by useChat), but also
 * accepts plain { role, content } messages so it stays curl-testable. The same
 * agent serves Microsoft Teams via /api/messages.
 */
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { buildAgent } from "@/lib/agent/agent";

export const runtime = "nodejs";
export const maxDuration = 120;

type LooseMessage =
  | UIMessage
  | { role: "user" | "assistant" | "system"; content: string };

function toUIMessages(messages: LooseMessage[]): UIMessage[] {
  return messages.map((m, i) => {
    if ("parts" in m && Array.isArray(m.parts)) return m as UIMessage;
    const { role, content } = m as { role: UIMessage["role"]; content: string };
    return {
      id: `m-${i}`,
      role,
      parts: [{ type: "text", text: content }],
    } as UIMessage;
  });
}

export async function POST(req: Request) {
  let body: { messages?: LooseMessage[]; userId?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    /* handled below */
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'POST { messages: [{ role: "user", content: "..." }] }' },
      { status: 400 },
    );
  }

  return createAgentUIStreamResponse({
    agent: buildAgent("web", body.userId),
    uiMessages: toUIMessages(body.messages),
  });
}

export function GET() {
  return NextResponse.json({
    usage: 'POST { messages: [{ role: "user", content: "..." }], userId? } → AI SDK UI message stream',
    surfaces: { web: "/api/agent", teams: "/api/messages" },
    tools: [
      "list_surveys", "search_surveys", "get_survey", "get_facility", "survey_stats", "draft_poc",
      "get_portfolio_summary", "get_state_summary", "get_service_line_benchmarks",
      "get_citation_taxonomy", "get_location", "search_locations",
    ],
  });
}
