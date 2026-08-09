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
 * TEAMS_SKIP_AUTH=1 = local Agents Playground mode (no JWT, no outbound auth).
 */
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { buildAgent } from "@/lib/agent/agent";
import { validateTeamsRequest } from "@/lib/teams/validate";
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
};

const WELCOME = [
  "**PruittHealth AI Insight Assistant** — grounded answers over the demo's survey and financial datasets (illustrative data). Try:",
  "- _What open surveys does Fleming Island have?_",
  "- _What grade is the infection-control citation?_",
  "- _Draft a POC for F0880_",
  "- _Which states have the highest survey citation risk?_",
  "- _Break down operating margin by service line_",
].join("\n");

/** Strip the bot @mention Teams prepends in channel messages. */
function cleanText(activity: TeamsActivity): string {
  return (activity.text ?? "")
    .replace(/<at>.*?<\/at>/g, "")
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
    await streamer.finish(WELCOME);
    return;
  }

  try {
    const agent = buildAgent("teams", activity.from?.aadObjectId ?? activity.from?.id);
    const result = await agent.stream({ prompt: text });

    let full = "";
    for await (const chunk of result.textStream) {
      full += chunk;
      await streamer.update(full);
    }
    await streamer.finish(stripChartFences(full));
  } catch (e) {
    console.error("agent run failed:", e);
    const reason = e instanceof Error ? e.message : "unknown error";
    await sendActivity(serviceUrl, conversationId, {
      type: "message",
      text: `Something went wrong running the agent: ${reason.slice(0, 200)}`,
    }).catch((err) => console.error("error reply failed:", err));
  }
}

export async function POST(req: Request) {
  let activity: TeamsActivity;
  try {
    activity = (await req.json()) as TeamsActivity;
  } catch {
    return new Response("invalid activity payload", { status: 400 });
  }

  const skipAuth = process.env.TEAMS_SKIP_AUTH === "1";

  if (!skipAuth) {
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
