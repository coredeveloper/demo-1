/*
 * Outbound auth for Bot Connector replies.
 *
 * Single-tenant bots (the Teams CLI / Developer Portal default) MUST request
 * tokens from the tenant-specific endpoint — the common botframework.com
 * endpoint yields tokens the Connector rejects with 401. Token is cached in
 * module scope for the instance's lifetime (expiry-aware).
 *
 * Returns null under TEAMS_SKIP_AUTH=1 so local Agents Playground runs need
 * no credentials (the Playground's local Connector accepts anonymous posts).
 */

let cached: { token: string; expiresAt: number } | null = null;

export async function connectorToken(): Promise<string | null> {
  if (process.env.TEAMS_SKIP_AUTH === "1") return null;

  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const tenantId = process.env.BOT_TENANT_ID;
  const clientId = process.env.BOT_CLIENT_ID;
  const clientSecret = process.env.BOT_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("BOT_TENANT_ID / BOT_CLIENT_ID / BOT_CLIENT_SECRET are not all set");
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://api.botframework.com/.default",
      }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`connector token request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cached.token;
}
