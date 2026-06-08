"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { scopeSeverityBand, getFtag, type CitationGroup } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PocActivity, PocEvidence } from "@/lib/types";

const BAND_PILL: Record<string, string> = {
  "immediate-jeopardy": "bg-ph-burgundy text-white",
  "actual-harm": "bg-[var(--sev-actual)] text-white",
  minimal: "bg-ph-amber text-white",
  "self-correct": "bg-ph-primary-soft text-ph-primary",
};

function fmt(date: string): string {
  // date is an ISO yyyy-mm-dd; render compact "Jun 5" without TZ drift.
  const [y, m, d] = date.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(m ?? 1) - 1]} ${d}${y && y !== new Date().getFullYear() ? `, ${y}` : ""}`;
}

/**
 * One citation = one clinical-category card with its own executable checklist.
 * Reused by POC Review (stage 2), the facility Correction Roadmap, and the
 * survey detail POC tab. Checking an item records a live evidence entry
 * (today + the active persona) — the tracking story Minesh asked for.
 */
export function CitationActionGroup({
  group,
  actorName = "Sarah Okafor, DON",
  anchorId,
  index = 0,
}: {
  group: CitationGroup;
  actorName?: string;
  anchorId?: string;
  index?: number;
}) {
  const band = scopeSeverityBand(group.scopeSeverity);
  const ftag = getFtag(group.ftag);

  // Session overrides on top of the seeded status/evidence.
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [live, setLive] = useState<Record<string, PocEvidence[]>>({});
  const [showFinding, setShowFinding] = useState(false);

  const isComplete = (a: PocActivity) => done[a.id] ?? a.status === "complete";
  const evidenceFor = (a: PocActivity): PocEvidence[] => [...a.evidence, ...(live[a.id] ?? [])];

  function toggle(a: PocActivity) {
    if (isComplete(a)) {
      setDone((p) => ({ ...p, [a.id]: false }));
      setLive((p) => ({ ...p, [a.id]: [] }));
    } else {
      setDone((p) => ({ ...p, [a.id]: true }));
      const today = new Date().toISOString().slice(0, 10);
      setLive((p) => ({ ...p, [a.id]: [{ date: today, by: actorName }] }));
    }
  }

  const completeCount = group.activities.filter(isComplete).length;

  return (
    <section
      id={anchorId}
      className="ph-card overflow-hidden ph-reveal scroll-mt-24"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header — clinical category leads, F-tag is secondary */}
      <header className="px-6 py-4 border-b border-ph-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="ph-eyebrow text-ph-gray-400 mb-1">Citation</div>
            <h3 className="text-lg tracking-tight leading-snug">{group.category}</h3>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-ph-gray-500 bg-ph-gray-100 rounded px-1.5 py-0.5">
                {group.ftag}
              </span>
              <span className="text-[11px] text-ph-gray-500">{ftag?.shortTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SeverityBadge severity={group.severity} compact />
            <span
              className={cn(
                "inline-flex flex-col items-center justify-center rounded-md px-2 py-1 leading-none",
                BAND_PILL[band.band],
              )}
              title={`Scope-severity ${group.scopeSeverity} · ${band.action}`}
            >
              <span className="font-display text-base">{group.scopeSeverity}</span>
              <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-90">grade</span>
            </span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ph-gray-500">{band.action}</p>
      </header>

      {/* Finding (collapsible) */}
      <button
        type="button"
        onClick={() => setShowFinding((v) => !v)}
        className="w-full flex items-center gap-1.5 px-6 py-2 text-[11px] text-ph-gray-500 hover:text-ph-ink border-b border-ph-gray-100"
      >
        <ChevronDown className={cn("h-3 w-3 transition-transform", showFinding && "rotate-180")} />
        {showFinding ? "Hide" : "View"} surveyor finding
      </button>
      {showFinding && (
        <blockquote className="px-6 py-3 text-[11px] italic text-ph-gray-600 leading-relaxed bg-ph-gray-50 border-b border-ph-gray-100">
          "{group.narrative}"
        </blockquote>
      )}

      {/* Checklist */}
      <div className="px-6 pt-3 pb-1 flex items-baseline justify-between">
        <div className="ph-eyebrow text-ph-gray-400">Corrective checklist</div>
        <div className="text-[11px] text-ph-gray-500 tabular-nums">
          {completeCount}/{group.activities.length} done
        </div>
      </div>
      <ul className="divide-y divide-ph-gray-100">
        {group.activities.map((a) => {
          const complete = isComplete(a);
          const evidence = evidenceFor(a);
          return (
            <li key={a.id} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(a)}
                  aria-pressed={complete}
                  aria-label={complete ? "Mark not done" : "Mark done"}
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0 rounded border flex items-center justify-center transition-colors",
                    complete
                      ? "bg-ph-primary border-ph-primary text-white"
                      : "border-ph-gray-300 hover:border-ph-primary",
                  )}
                >
                  {complete && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-relaxed", complete ? "text-ph-gray-500 line-through decoration-ph-gray-300" : "text-ph-ink")}>
                    {a.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-ph-gray-500">
                    <span className="inline-flex items-center rounded bg-ph-primary-soft text-ph-primary px-1.5 py-0.5 font-medium">
                      {a.owner}
                    </span>
                    <span className="text-ph-gray-300">·</span>
                    <span>{a.cadence}</span>
                    <span className="text-ph-gray-300">·</span>
                    <span>Target {fmt(a.targetCompletionDate)}</span>
                  </div>
                  {complete && evidence.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ph-primary">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                      <span>
                        Logged by {evidence[0]!.by} — {evidence.map((e) => fmt(e.date)).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
