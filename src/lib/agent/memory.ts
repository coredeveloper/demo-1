/*
 * Cross-surface conversation memory — the "holistic chat" piece.
 *
 * One thread key = one conversation, whichever surface it happens on: the web
 * AgentDock uses "demo-user"; Teams uses the caller's AAD object id (mapped to
 * "demo-user" when it matches DEMO_USER_AAD_ID, so the presenter's Teams chat
 * and web dock share one thread).
 *
 * Backend: Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is present;
 * otherwise a per-instance in-memory fallback so nothing breaks before the
 * store is linked. Blob paths are HMAC-style hashes so keys aren't guessable.
 * Memory is an enhancement — every failure degrades to "no history", never to
 * a failed answer.
 */
import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";
import type { ModelMessage } from "ai";

export type StoredMsg = {
  role: "user" | "assistant";
  text: string;
  surface: "web" | "teams";
  at: number;
};

const CAP = 20;
const localFallback = new Map<string, StoredMsg[]>();

const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;

function threadPath(threadKey: string): string {
  const salt = process.env.BOT_CLIENT_SECRET ?? "ph-demo-salt";
  const hash = createHash("sha256").update(`${threadKey}:${salt}`).digest("hex").slice(0, 32);
  return `chat/${hash}.json`;
}

export async function loadThread(threadKey: string): Promise<StoredMsg[]> {
  const token = blobToken();
  if (!token) return localFallback.get(threadKey) ?? [];
  try {
    // useCache:false — cross-surface continuity needs the latest write, not CDN.
    const res = await get(threadPath(threadKey), { token, access: "private", useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return [];
    const parsed = (await new Response(res.stream).json()) as { messages?: StoredMsg[] };
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch (e) {
    console.error("memory load failed:", e);
    return [];
  }
}

export async function appendThread(threadKey: string, msgs: StoredMsg[]): Promise<void> {
  try {
    const existing = await loadThread(threadKey);
    const next = [...existing, ...msgs].slice(-CAP);
    const token = blobToken();
    if (!token) {
      localFallback.set(threadKey, next);
      return;
    }
    await put(threadPath(threadKey), JSON.stringify({ messages: next }), {
      access: "private",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (e) {
    console.error("memory append failed:", e);
  }
}

export function toModelMessages(stored: StoredMsg[]): ModelMessage[] {
  return stored.map((m) => ({ role: m.role, content: m.text }));
}

/** Thread key for a Teams sender; joins the presenter's web thread when mapped. */
export function teamsThreadKey(aadObjectId?: string, fallbackId?: string): string {
  const id = aadObjectId ?? fallbackId ?? "anonymous";
  if (process.env.DEMO_USER_AAD_ID && aadObjectId === process.env.DEMO_USER_AAD_ID) {
    return "demo-user";
  }
  return `teams-${id}`;
}
