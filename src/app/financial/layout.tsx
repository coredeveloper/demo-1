import type { Metadata } from "next";
import { FinPersonaProvider } from "@/components/financial/persona-provider";
import { FinChrome } from "@/components/financial/chrome";
import { AgentDock } from "@/components/financial/agent-dock";

export const metadata: Metadata = {
  title: "AI Command Center · PruittHealth",
  description:
    "Financial Insights & Survey Intelligence — persona-scoped demo dashboard over the illustrative 180-location dataset.",
};

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinPersonaProvider>
      <FinChrome>{children}</FinChrome>
      <AgentDock />
    </FinPersonaProvider>
  );
}
