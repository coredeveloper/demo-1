/*
 * Cross-surface conversation memory + user pairing — the "holistic chat".
 *
 * Identity model (context is split per user):
 *   - Web: each browser mints a persistent anonymous id → thread `web-<id>`.
 *   - Teams: each sender is keyed by AAD object id → thread `teams-<aad>`.
 *   - Pairing joins them: the dock issues a short-lived code (/api/pair); the
 *     user sends `pair <code>` to the Teams bot; from then on that Teams user
 *     resolves to the SAME `web-<id>` thread — one conversation, two surfaces.
 *
 * Backend: Vercel Blob (linked private store — SDK resolves OIDC via
 * BLOB_STORE_ID automatically; explicit BLOB_READ_WRITE_TOKEN also supported),
 * with a per-instance in-memory fallback. Paths are salted hashes so keys
 * aren't guessable. Memory is an enhancement — every failure degrades to
 * "no history", never to a failed answer.
 */
import { createHash, randomInt } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import type { ModelMessage } from "ai";

export type StoredMsg = {
  role: "user" | "assistant";
  text: string;
  surface: "web" | "teams";
  at: number;
};

const CAP = 20;
const PAIR_TTL_MS = 10 * 60_000;

const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;
const blobAvailable = () => Boolean(blobToken() || process.env.BLOB_STORE_ID);
const authOpts = () => (blobToken() ? { token: blobToken()! } : {});

/* ── low-level JSON blob helpers (with local fallback) ─────────────── */

const localKV = new Map<string, unknown>();

function hashed(prefix: string, key: string): string {
  const salt = process.env.BOT_CLIENT_SECRET ?? "ph-demo-salt";
  const hash = createHash("sha256").update(`${prefix}:${key}:${salt}`).digest("hex").slice(0, 32);
  return `${prefix}/${hash}.json`;
}

async function readJson<T>(path: string): Promise<T | null> {
  if (!blobAvailable()) return (localKV.get(path) as T) ?? null;
  try {
    // useCache:false — cross-surface continuity needs the latest write, not CDN.
    const res = await get(path, { access: "private", useCache: false, ...authOpts() });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return (await new Response(res.stream).json()) as T;
  } catch (e) {
    console.error(`blob read failed (${path}):`, e);
    return null;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  if (!blobAvailable()) {
    localKV.set(path, value);
    return;
  }
  try {
    await put(path, JSON.stringify(value), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      ...authOpts(),
    });
  } catch (e) {
    console.error(`blob write failed (${path}):`, e);
  }
}

async function deleteJson(path: string): Promise<void> {
  if (!blobAvailable()) {
    localKV.delete(path);
    return;
  }
  try {
    await del(path, authOpts());
  } catch {
    /* expiry still guards single-use codes */
  }
}

/* ── conversation threads ──────────────────────────────────────────── */

export async function loadThread(threadKey: string): Promise<StoredMsg[]> {
  const parsed = await readJson<{ messages?: StoredMsg[] }>(hashed("chat", threadKey));
  return Array.isArray(parsed?.messages) ? parsed.messages : [];
}

export async function appendThread(threadKey: string, msgs: StoredMsg[]): Promise<void> {
  const existing = await loadThread(threadKey);
  await writeJson(hashed("chat", threadKey), {
    messages: [...existing, ...msgs].slice(-CAP),
  });
}

export function toModelMessages(stored: StoredMsg[]): ModelMessage[] {
  return stored.map((m) => ({ role: m.role, content: m.text }));
}

/* ── pairing: web browser ↔ Teams user ─────────────────────────────── */

type PairCode = { webId: string; expiresAt: number };
type TeamsMapping = { webId: string; pairedAt: number };
type WebPairInfo = { teamsName: string; pairedAt: number };

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no easy-to-confuse chars

export async function createPairCode(webId: string): Promise<{ code: string; ttlSeconds: number }> {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  await writeJson(hashed("pair", code), {
    webId,
    expiresAt: Date.now() + PAIR_TTL_MS,
  } satisfies PairCode);
  return { code, ttlSeconds: PAIR_TTL_MS / 1000 };
}

/** Resolve and consume a pairing code (single-use, 10-minute expiry). */
export async function resolvePairCode(code: string): Promise<string | null> {
  const path = hashed("pair", code.toUpperCase());
  const entry = await readJson<PairCode>(path);
  if (!entry) return null;
  await deleteJson(path);
  if (Date.now() > entry.expiresAt) return null;
  return entry.webId;
}

export async function savePairing(
  teamsUserId: string,
  webId: string,
  teamsName?: string,
): Promise<void> {
  await writeJson(hashed("map", teamsUserId), {
    webId,
    pairedAt: Date.now(),
  } satisfies TeamsMapping);
  await writeJson(hashed("rmap", webId), {
    teamsName: teamsName ?? "Teams user",
    pairedAt: Date.now(),
  } satisfies WebPairInfo);
}

/** What the dock shows once its browser id has been paired from Teams. */
export async function getPairInfoForWeb(webId: string): Promise<WebPairInfo | null> {
  return readJson<WebPairInfo>(hashed("rmap", webId));
}

/** Thread key for a Teams sender — the paired web thread when one exists. */
export async function resolveTeamsThreadKey(
  aadObjectId?: string,
  fallbackId?: string,
): Promise<string> {
  const id = aadObjectId ?? fallbackId ?? "anonymous";
  const mapping = await readJson<TeamsMapping>(hashed("map", id));
  return mapping?.webId ? `web-${mapping.webId}` : `teams-${id}`;
}
