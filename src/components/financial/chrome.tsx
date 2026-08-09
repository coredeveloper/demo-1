"use client";

/*
 * Financial-section chrome: title strip (persona chip · scope chip · freshness),
 * the view tabs (visibility driven by the active persona's RBAC), and the
 * auto-redirect when a persona loses access to the current view.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONAS } from "@/lib/financial/personas";
import { alertsForScope } from "@/lib/financial/alerts";
import { AS_OF } from "@/lib/financial/selectors";
import type { FinTab } from "@/lib/financial/types";
import { useFinPersona } from "./persona-provider";

/** Demo-theater toast (vendor parity): fire from anywhere in the section. */
export function fireToast(message: string) {
  window.dispatchEvent(new CustomEvent("ph-toast", { detail: message }));
}

/** Programmatically open the AgentDock (e.g. "Ask in Finance mode"). */
export function openDock() {
  window.dispatchEvent(new CustomEvent("ph-open-dock"));
}

function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener("ph-toast", onToast);
    return () => {
      window.removeEventListener("ph-toast", onToast);
      clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ph-ink px-4 py-2 text-xs text-white shadow-lg">
      {msg}
    </div>
  );
}

const TABS: { key: FinTab; href: string; label: string }[] = [
  { key: "command", href: "/financial", label: "◈ Command Center" },
  { key: "insights", href: "/financial/insights", label: "$ Financial Insights" },
  { key: "survey-risk", href: "/financial/survey-risk", label: "⚑ Survey Risk" },
  { key: "alerts", href: "/financial/alerts", label: "◷ Alerts" },
  { key: "platform", href: "/financial/platform", label: "Platform & Governance" },
];

function activeTab(path: string): FinTab {
  if (path.startsWith("/financial/insights")) return "insights";
  if (path.startsWith("/financial/survey-risk")) return "survey-risk";
  if (path.startsWith("/financial/alerts")) return "alerts";
  if (path.startsWith("/financial/platform")) return "platform";
  return "command";
}

export function FinChrome({ children }: { children: React.ReactNode }) {
  const { persona, personaKey, setPersona } = useFinPersona();
  const path = usePathname();
  const router = useRouter();
  const current = activeTab(path);
  const alertCount = alertsForScope(persona.alertScope).length;

  // RBAC redirect: if the persona can't see the current view, land on Command.
  useEffect(() => {
    if (!persona.tabs.includes(current)) router.replace("/financial");
  }, [persona, current, router]);

  return (
    <div className="mx-auto max-w-[1560px] px-6 py-5 md:px-8 flex flex-col gap-5">
      {/* Independent app header — the Financial app does NOT share the survey
          suite's sidebar. Cross-over is one discreet link, nothing more. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ph-gray-200 pb-4">
        <Link href="/financial" className="inline-flex items-center gap-3">
          <Image
            src="/pruitthealth-logo.png"
            alt="PruittHealth"
            width={150}
            height={42}
            priority
            className="h-9 w-auto"
          />
          <span className="h-8 w-px bg-ph-gray-200" aria-hidden />
          <span>
            <span className="block font-display text-lg leading-tight text-ph-ink">
              AI Command Center
            </span>
            <span className="block text-[10.5px] text-ph-gray-500">
              Financial Insights &amp; Survey Intelligence · Microsoft-native · demo
            </span>
          </span>
        </Link>
        <span className="mr-auto" />
        <PersonaMenu personaKey={personaKey} setPersona={setPersona} />
        <span className="rounded-full border border-ph-gray-200 bg-ph-paper px-3 py-1.5 text-xs text-ph-gray-700">
          {persona.scopeChip}
        </span>
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-ph-gray-200 bg-ph-paper px-3 py-1.5 text-xs text-ph-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B]" /> Refreshed {AS_OF} 04:00 ET
        </span>
        <span className="relative inline-grid h-8 w-8 place-items-center rounded-full border border-ph-gray-200 bg-ph-paper text-ph-gray-500">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ph-burgundy px-1 text-[9px] font-bold text-white">
            {alertCount}
          </span>
        </span>
        <Link
          href="/"
          className="text-[11px] text-ph-gray-400 hover:text-ph-primary hover:underline"
        >
          Survey suite →
        </Link>
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-ph-gray-200 -mb-1">
        {TABS.filter((t) => persona.tabs.includes(t.key)).map((t) => {
          const isActive = t.key === current;
          const isAdmin = t.key === "platform";
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative px-3.5 py-2 text-[13px] transition-colors rounded-t-md",
                isAdmin && "ml-auto text-xs",
                isActive
                  ? "font-semibold text-ph-primary"
                  : "text-ph-gray-500 hover:text-ph-ink hover:bg-ph-gray-100/70",
              )}
            >
              {t.label}
              {t.key === "alerts" && (
                <span className="ml-1.5 rounded-full bg-ph-burgundy px-1.5 text-[9.5px] font-bold text-white align-middle">
                  {alertCount}
                </span>
              )}
              {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-ph-primary" />}
            </Link>
          );
        })}
      </nav>

      {children}
      <p className="text-[11px] text-ph-gray-400 border-t border-dotted border-ph-gray-200 pt-3">
        Footer (production): data refresh status · model health · governance/RBAC banner — reflects
        active persona scope (<span className="font-medium text-ph-gray-500">{persona.name} · {persona.scopeChip}</span>).
      </p>
      <Toaster />
    </div>
  );
}

function PersonaMenu({
  personaKey,
  setPersona,
}: {
  personaKey: string;
  setPersona: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const persona = PERSONAS[personaKey];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-ph-gray-200 bg-ph-paper px-3 py-1.5 text-xs font-medium text-ph-ink hover:border-ph-primary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B]" />
        {persona.name}
        <ChevronDown className="h-3 w-3 text-ph-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-72 rounded-lg border border-ph-gray-200 bg-ph-paper p-1.5 shadow-[var(--shadow-card-hover)]">
          {Object.values(PERSONAS).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPersona(p.key);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-md px-3 py-2 text-left transition-colors",
                p.key === personaKey ? "bg-ph-primary-soft" : "hover:bg-ph-gray-100",
              )}
            >
              <div className="text-[13px] font-medium text-ph-ink">{p.name}</div>
              <div className="text-[11px] text-ph-gray-500">{p.role}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
