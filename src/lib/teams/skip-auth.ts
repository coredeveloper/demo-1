/*
 * TEAMS_SKIP_AUTH=1 exists solely for local Agents Playground testing (the
 * Playground sends unauthenticated requests by design). It must never take
 * effect on a deployment: VERCEL_ENV is set on every Vercel deploy (production
 * and preview) and unset locally, so the flag is refused there even if someone
 * copies it into the project's env vars.
 */
export function teamsSkipAuth(): boolean {
  const requested = process.env.TEAMS_SKIP_AUTH === "1";
  if (requested && process.env.VERCEL_ENV) {
    console.warn("TEAMS_SKIP_AUTH=1 ignored: refusing to disable auth on a deployed environment");
    return false;
  }
  return requested;
}
