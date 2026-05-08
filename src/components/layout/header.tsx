"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

  return (
    <header className="border-b border-ph-gray-200 bg-ph-paper">
      <div className="px-10 py-6 flex items-baseline justify-between">
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
        <div className="flex items-baseline gap-6 text-xs text-ph-gray-500">
          <div>
            <div className="ph-eyebrow text-ph-gray-400">Region</div>
            <div className="text-ph-ink">Division Southeast</div>
          </div>
          <div className="h-8 w-px bg-ph-gray-200" />
          <div className="text-right">
            <div className="ph-eyebrow text-ph-gray-400">Signed in</div>
            <div className="text-ph-ink">demo@pruitthealth.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
