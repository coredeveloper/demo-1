import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageFooter } from "@/components/layout/page-footer";
import { PersonaProvider } from "@/components/layout/persona-context";

export const metadata: Metadata = {
  title: "State Survey Automation · PruittHealth",
  description:
    "Local prototype — turns CMS-2567 PDFs into FHIR R4 resources and AI-drafted Plans of Correction.",
};

/**
 * Survey-suite shell (sidebar + header + footer). The Financial app
 * (/financial) deliberately does NOT share this — it is its own surface
 * with independent navigation (see src/app/financial/layout.tsx).
 */
export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <div className="grid min-h-[calc(100vh-28px)] grid-cols-[260px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <PageFooter />
        </div>
      </div>
    </PersonaProvider>
  );
}
