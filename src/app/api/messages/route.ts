/*
 * POST /api/messages — the Microsoft Teams bridge.
 *
 * Registered as the bot's messaging endpoint. Teams delivers activities here;
 * we validate the Bot Framework JWT, ack with 200 immediately (Teams times out
 * at ~10–15 s), and run the agent in the background via waitUntil(), replying
 * through the Bot Connector REST API — streamed in 1:1 chats.
 *
 * Config: BOT_CLIENT_ID / BOT_CLIENT_SECRET / BOT_TENANT_ID (from
 * `teams app create`). Until they're set, the route answers 200/not-configured
 * so bot registration against this URL succeeds before the env is wired.
 * TEAMS_SKIP_AUTH=1 = local Agents Playground mode (no JWT, no outbound auth);
 * refused on deployed environments — see src/lib/teams/skip-auth.ts.
 */
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { buildAgent } from "@/lib/agent/agent";
import { validateTeamsRequest } from "@/lib/teams/validate";
import { teamsSkipAuth } from "@/lib/teams/skip-auth";
import { sendActivity, stripChartFences, TeamsStreamer } from "@/lib/teams/connector";

export const runtime = "nodejs";
export const maxDuration = 300;

type TeamsActivity = {
  type?: string;
  text?: string;
  serviceUrl?: string;
  conversation?: { id?: string; conversationType?: string };
  from?: { id?: string; name?: string; aadObjectId?: string };
  recipient?: { id?: string; name?: string };
  membersAdded?: { id?: string }[];
  entities?: { type?: string; text?: string; mentioned?: { id?: string } }[];
  attachments?: unknown[];
  value?: unknown;
};

const WELCOME = [
  "**PruittHealth AI Insight Assistant** — grounded answers over the demo's survey and financial datasets (illustrative data). Try:",
  "- _What open surveys does Fleming Island have?_",
  "- _What grade is the infection-control citation?_",
  "- _Draft a POC for F0880_",
  "- _Which states have the highest survey citation risk?_",
  "- _Break down operating margin by service line_",
].join("\n");

/**
 * Remove only the BOT's own @mention (matched via mention entities against
 * recipient.id) and unwrap any remaining <at> tags so user mentions keep
 * their names instead of being deleted.
 */
function cleanText(activity: TeamsActivity): string {
  let text = activity.text ?? "";
  for (const e of activity.entities ?? []) {
    if (e.type === "mention" && e.text && e.mentioned?.id === activity.recipient?.id) {
      text = text.replace(e.text, "");
    }
  }
  return text
    .replace(/<\/?at>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function runInBackground(work: Promise<unknown>) {
  const guarded = work.catch((e) => console.error("teams background task failed:", e));
  try {
    waitUntil(guarded);
  } catch {
    /* local dev without the Vercel request context — let it run detached */
  }
}

async function handleMessage(activity: TeamsActivity) {
  const serviceUrl = activity.serviceUrl;
  const conversationId = activity.conversation?.id;
  if (!serviceUrl || !conversationId) return;

  const personal = activity.conversation?.conversationType === "personal";
  const streamer = new TeamsStreamer(serviceUrl, conversationId, personal);
  const text = cleanText(activity);

  if (!text) {
    // Card submits and attachment-only posts arrive with empty text — don't
    // greet them with the welcome blurb.
    if (activity.value != null || (activity.attachments?.length ?? 0) > 0) {
      await streamer.finish(
        "I work with text questions in this demo — try asking about a survey, an F-tag, or a financial metric.",
      );
      return;
    }
    await streamer.finish(WELCOME);
    return;
  }

  try {
    const agent = buildAgent("teams", activity.from?.aadObjectId ?? activity.from?.id);
    const result = await agent.stream({ prompt: text });

    // Iterate fullStream, not textStream: model/gateway errors arrive as
    // {type:'error'} parts and never reject the stream — textStream would
    // just end silently with an empty answer.
    let full = "";
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        full += part.text;
        await streamer.update(full);
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
    }
    await streamer.finish(stripChartFences(full));
  } catch (e) {
    console.error("agent run failed:", e);
    // Generic reply — full detail stays in the server logs (Vercel → Functions).
    await streamer
      .finish("Something went wrong running the agent. The details are in the server logs.")
      .catch((err) => console.error("error reply failed:", err));
  }
}

export async function POST(req: Request) {
  let activity: TeamsActivity;
  try {
    activity = (await req.json()) as TeamsActivity;
  } catch {
    return new Response("invalid activity payload", { status: 400 });
  }

  if (!teamsSkipAuth()) {
    if (!process.env.BOT_CLIENT_ID || !process.env.BOT_CLIENT_SECRET || !process.env.BOT_TENANT_ID) {
      // Pre-registration stub: succeed so `teams app create` can target this
      // URL before the BOT_* env vars exist. No processing happens.
      return NextResponse.json({
        status: "bot-not-configured",
        note: "Set BOT_CLIENT_ID, BOT_CLIENT_SECRET, BOT_TENANT_ID on Vercel and redeploy.",
      });
    }
    const verdict = await validateTeamsRequest(req.headers.get("authorization"), activity);
    if (!verdict.ok) {
      return new Response(`unauthorized: ${verdict.reason}`, { status: 401 });
    }
  }

  if (activity.type === "message") {
    runInBackground(handleMessage(activity));
    return new Response(null, { status: 200 });
  }

  if (
    activity.type === "conversationUpdate" &&
    activity.membersAdded?.some((m) => m.id && m.id === activity.recipient?.id) &&
    activity.serviceUrl &&
    activity.conversation?.id
  ) {
    runInBackground(
      sendActivity(activity.serviceUrl, activity.conversation.id, {
        type: "message",
        text: WELCOME,
      }),
    );
    return new Response(null, { status: 200 });
  }

  // Other activity types (typing, reactions, installationUpdate…) — ack only.
  return new Response(null, { status: 200 });
}

export function GET() {
  return NextResponse.json({
    endpoint: "Microsoft Teams bot messaging endpoint",
    configured: Boolean(
      process.env.BOT_CLIENT_ID && process.env.BOT_CLIENT_SECRET && process.env.BOT_TENANT_ID,
    ),
    register: 'teams app create --name "PruittHealth Agent" --endpoint https://<host>/api/messages',
  });
}
