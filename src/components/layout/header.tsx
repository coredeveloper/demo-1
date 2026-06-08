"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronDown, Lock } from "lucide-react";
import { usePersona, PERSONAS } from "@/components/layout/persona-context";

const TITLES: Record<string, string> = {
  "/": "Compliance overview",
  "/surveys": "Surveys",
  "/trends": "Trends + cross-facility analysis",
  "/facilities": "Facilities",
  "/pipeline": "Live ingestion pipeline",
  "/poc-review": "Plan-of-Correction review",
};

function titleFor(path: string): string {
  if (TITLES[path]) return TITLES[path]!;
  if (path.startsWith("/surveys/")) return "Survey detail";
  if (path.startsWith("/facilities/")) return "Facility detail";
  return "—";
}

export function Header() {
  const path = usePathname();
  const title = titleFor(path);
  const segments = path.split("/").filter(Boolean);
  const { persona, setPersonaId } = usePersona();

  return (
    <header className="border-b border-ph-gray-200 bg-ph-paper">
      <div className="px-10 py-6 flex items-center justify-between gap-6">
        <div>
          <div className="ph-eyebrow text-ph-gray-400 flex items-center gap-1.5 mb-2">
            <Link href="/" className="hover:text-ph-primary">
              State Survey Automation
            </Link>
            {segments.map((seg, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                <span className="capitalize">{seg.replace(/-/g, " ")}</span>
              </span>
            ))}
          </div>
          <h1 className="text-3xl tracking-tight">{title}</h1>
        </div>

        {/* Persona switcher — the role-based access story */}
        <div className="flex items-center gap-3 shrink-0">
          {persona.facilityId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ph-primary-soft text-ph-primary px-2.5 py-1 text-[11px] font-medium">
              <Lock className="h-3 w-3" /> Scoped to {persona.facilityLabel}
            </span>
          )}
          <div className="text-right">
            <div className="ph-eyebrow text-ph-gray-400">Signed in as</div>
            <div className="relative inline-flex items-center">
              <select
                aria-label="Switch persona"
                value={persona.id}
                onChange={(e) => setPersonaId(e.target.value)}
                className="appearance-none cursor-pointer bg-transparent pr-5 text-sm font-medium text-ph-ink focus:outline-none"
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                    {p.facilityLabel ? ` · ${p.facilityLabel}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 h-3.5 w-3.5 text-ph-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
