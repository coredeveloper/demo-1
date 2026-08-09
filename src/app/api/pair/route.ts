/*
 * /api/pair — links a browser (web id) to a Teams user.
 *
 * POST { webId } → { code, ttlSeconds }   The dock shows the code; the user
 *                                          sends `pair <code>` to the Teams bot.
 * GET  ?webId=…  → { paired, teamsName? }  The dock polls this while waiting.
 */
import { NextResponse } from "next/server";
import { createPairCode, getPairInfoForWeb } from "@/lib/agent/memory";

export const runtime = "nodejs";

const WEB_ID = /^[a-zA-Z0-9-]{8,64}$/;

export async function POST(req: Request) {
  let body: { webId?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    /* handled below */
  }
  if (!body?.webId || !WEB_ID.test(body.webId)) {
    return NextResponse.json({ error: "POST { webId }" }, { status: 400 });
  }
  const { code, ttlSeconds } = await createPairCode(body.webId);
  return NextResponse.json({
    code,
    ttlSeconds,
    instruction: `In Microsoft Teams, send the bot: pair ${code}`,
  });
}

export async function GET(req: Request) {
  const webId = new URL(req.url).searchParams.get("webId") ?? "";
  if (!WEB_ID.test(webId)) {
    return NextResponse.json({ error: "GET ?webId=…" }, { status: 400 });
  }
  const info = await getPairInfoForWeb(webId);
  return NextResponse.json(
    info ? { paired: true, teamsName: info.teamsName } : { paired: false },
  );
}
