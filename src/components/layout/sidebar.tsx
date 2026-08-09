"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Building2,
  Cpu,
  ClipboardCheck,
  Gauge,
  DollarSign,
  ShieldAlert,
  BellRing,
  ServerCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/surveys", label: "Surveys", icon: FileText },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/facilities", label: "Facilities", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: Cpu },
  { href: "/poc-review", label: "POC Review", icon: ClipboardCheck },
];

const NAV_FINANCIAL = [
  { href: "/financial", label: "Command Center", icon: Gauge },
  { href: "/financial/insights", label: "Financial Insights", icon: DollarSign },
  { href: "/financial/survey-risk", label: "Survey Risk", icon: ShieldAlert },
  { href: "/financial/alerts", label: "Alerts", icon: BellRing },
  { href: "/financial/platform", label: "Platform", icon: ServerCog },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="border-r border-ph-gray-200 bg-ph-paper px-4 py-6 flex flex-col">
      <Link href="/" className="mb-12 px-2 inline-flex items-center">
        <Image
          src="/pruitthealth-logo.png"
          alt="PruittHealth"
          width={170}
          height={48}
          priority
          className="h-10 w-auto"
        />
      </Link>

      <div className="ph-eyebrow mb-3 px-2">Compliance suite</div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? path === "/" : path.startsWith(href) && !path.startsWith("/financial");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-ph-primary-soft text-ph-primary font-medium"
                  : "text-ph-gray-700 hover:bg-ph-gray-100",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-ph-primary" : "text-ph-gray-400 group-hover:text-ph-gray-700",
                )}
                strokeWidth={1.6}
              />
              <span>{label}</span>
              {active && (
                <span className="absolute -left-4 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-ph-burgundy" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="ph-eyebrow mb-3 mt-8 px-2">AI Command Center</div>

      <nav className="flex flex-col gap-0.5">
        {NAV_FINANCIAL.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/financial" ? path === "/financial" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-ph-primary-soft text-ph-primary font-medium"
                  : "text-ph-gray-700 hover:bg-ph-gray-100",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-ph-primary" : "text-ph-gray-400 group-hover:text-ph-gray-700",
                )}
                strokeWidth={1.6}
              />
              <span>{label}</span>
              {active && (
                <span className="absolute -left-4 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-ph-burgundy" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 px-2">
        <div className="rounded-lg border border-dotted border-ph-gray-200 p-3">
          <div className="ph-eyebrow text-ph-gray-400 mb-1">Local prototype</div>
          <p className="text-xs leading-relaxed text-ph-gray-500">
            Mock data only. No Azure. Ingestion, FHIR persistence, and POC drafting are
            simulated; production wiring lives in <code className="text-[11px]">scripts/</code>.
          </p>
        </div>
      </div>
    </aside>
  );
}
