/*
 * POST /api/agent — the web surface of the agentic layer.
 *
 * Speaks the AI SDK UI message stream protocol (consumed by useChat), but also
 * accepts plain { role, content } messages so it stays curl-testable. The same
 * agent serves Microsoft Teams via /api/messages.
 *
 * Abuse guards (this is a public endpoint driving a paid model):
 * - client-supplied system messages are dropped (the system prompt is ours);
 * - gateway user attribution derives from the caller's IP, not the body;
 * - a small per-IP, per-instance rate limit caps drive-by spend;
 * - if AGENT_API_KEY is set, a matching bearer token is required (off by
 *   default so the open demo keeps working). The Gateway spend cap is the
 *   backstop for everything else.
 */
import { createHash } from "node:crypto";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { buildAgent } from "@/lib/agent/agent";

export const runtime = "nodejs";
export const maxDuration = 120;

const RATE_LIMIT = { windowMs: 10 * 60_000, max: 30 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

type LooseMessage =
  | UIMessage
  | { role: "user" | "assistant"; content: string };

function toUIMessages(messages: LooseMessage[]): UIMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => {
      if ("parts" in m && Array.isArray(m.parts)) return m as UIMessage;
      const { role, content } = m as { role: UIMessage["role"]; content: string };
      return {
        id: `m-${i}`,
        role,
        parts: [{ type: "text", text: String(content ?? "") }],
      } as UIMessage;
    });
}

export async function POST(req: Request) {
  if (process.env.AGENT_API_KEY) {
    if (req.headers.get("authorization") !== `Bearer ${process.env.AGENT_API_KEY}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded — try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: { messages?: LooseMessage[] } | null = null;
  try {
    body = await req.json();
  } catch {
    /* handled below */
  }
  const uiMessages = body && Array.isArray(body.messages) ? toUIMessages(body.messages) : [];
  if (uiMessages.length === 0) {
    return NextResponse.json(
      { error: 'POST { messages: [{ role: "user", content: "..." }] }' },
      { status: 400 },
    );
  }

  // Attribution key the client can't spoof by rotating a body field.
  const userKey = "web-" + createHash("sha256").update(ip).digest("hex").slice(0, 16);

  return createAgentUIStreamResponse({
    agent: buildAgent("web", userKey),
    uiMessages,
  });
}

export function GET() {
  return NextResponse.json({
    usage: 'POST { messages: [{ role: "user", content: "..." }] } → AI SDK UI message stream',
    surfaces: { web: "/api/agent", teams: "/api/messages" },
    tools: [
      "list_surveys", "search_surveys", "get_survey", "get_facility", "survey_stats", "draft_poc",
      "get_portfolio_summary", "get_state_summary", "get_service_line_benchmarks",
      "get_citation_taxonomy", "get_location", "search_locations",
    ],
  });
}
