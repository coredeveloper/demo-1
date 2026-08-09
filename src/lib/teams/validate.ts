/*
 * Inbound auth for /api/messages — validates the Bot Framework JWT that the
 * Bot Connector attaches to every activity it delivers.
 *
 * Checks (per the Bot Connector authentication spec):
 *   issuer   https://api.botframework.com
 *   audience the bot's Microsoft App ID (BOT_CLIENT_ID)
 *   signing  JWKS advertised by login.botframework.com's OpenID config
 *   claim    serviceurl must equal the activity's serviceUrl
 *
 * TEAMS_SKIP_AUTH=1 bypasses validation for local Agents Playground testing
 * (the Playground sends unauthenticated requests by design). Never set it on
 * a deployed environment.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

const OPENID_CONFIG_URL =
  "https://login.botframework.com/v1/.well-known/openidconfiguration";
const FALLBACK_JWKS_URL = "https://login.botframework.com/v1/.well-known/keys";
const ISSUER = "https://api.botframework.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function getJwks() {
  if (jwks) return jwks;
  let jwksUri = FALLBACK_JWKS_URL;
  try {
    const res = await fetch(OPENID_CONFIG_URL);
    if (res.ok) {
      const config = (await res.json()) as { jwks_uri?: string };
      if (config.jwks_uri) jwksUri = config.jwks_uri;
    }
  } catch {
    /* fall back to the conventional keys URL */
  }
  jwks = createRemoteJWKSet(new URL(jwksUri));
  return jwks;
}

const normalizeUrl = (u: string) => u.replace(/\/+$/, "").toLowerCase();

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export async function validateTeamsRequest(
  authHeader: string | null,
  activity: { serviceUrl?: string },
): Promise<ValidationResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, reason: "missing bearer token" };
  }
  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, await getJwks(), {
      issuer: ISSUER,
      audience: process.env.BOT_CLIENT_ID,
      clockTolerance: 300,
    });

    const claimUrl = payload.serviceurl as string | undefined;
    if (
      claimUrl &&
      activity.serviceUrl &&
      normalizeUrl(claimUrl) !== normalizeUrl(activity.serviceUrl)
    ) {
      return { ok: false, reason: "serviceUrl claim mismatch" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "invalid token" };
  }
}
