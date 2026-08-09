/*
 * The agentic layer — ONE agent, both toolsets, two surfaces.
 *
 * Model resolution goes through the Vercel AI Gateway (plain "provider/model"
 * strings), so swapping the brain is a one-string change: set AGENT_MODEL to
 * e.g. "openai/gpt-5.4" — or an Azure-hosted deployment via Gateway BYOK —
 * without touching code. Auth: VERCEL_OIDC_TOKEN (auto on Vercel, `vercel env
 * pull` locally) or AI_GATEWAY_API_KEY.
 */
import { ToolLoopAgent, isStepCount } from "ai";
import { systemPrompt, type Surface } from "./system-prompt";
import { surveyTools } from "./tools-survey";
import { financialTools } from "./tools-financial";

export const DEFAULT_MODEL = process.env.AGENT_MODEL ?? "anthropic/claude-sonnet-5";

export function buildAgent(surface: Surface, userId?: string) {
  return new ToolLoopAgent({
    model: DEFAULT_MODEL,
    instructions: systemPrompt(surface),
    tools: { ...surveyTools, ...financialTools },
    stopWhen: isStepCount(8),
    providerOptions: {
      gateway: {
        user: userId ?? "demo-anonymous",
        tags: [`surface:${surface}`, "demo:pruitthealth"],
      },
    },
  });
}
