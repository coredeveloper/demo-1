"use client";

/*
 * Operating-margin breakdown — the CEO click (Aug 10 meeting ask).
 *
 * Clicking the Operating Margin tile opens this panel in-page: WHY margin is
 * off (top levers from the variance story, worst-agency facilities named),
 * WHICH facilities to tackle (bottom-5 by margin from the dataset), and an
 * "Explore in chat" pill that hands the same question to the agent — the two
 * design directions from the call, combined.
 */
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinScope } from "@/lib/financial/types";
import { finVariant } from "@/lib/financial/story";
import { worstByMargin } from "@/lib/financial/selectors";
import { openDock } from "./chrome";

export function MarginBreakdown({ scope, onClose }: { scope: FinScope; onClose: () => void }) {
  const v = finVariant(scope);
  const facilities = worstByMargin(scope, scope === "chesapeake" ? 1 : 5);

  return (
    <div className="ph-card border-l-4 border-l-ph-burgundy p-5 ph-reveal">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-sm font-semibold text-ph-ink">
            Why operating margin is off — {v.vSub}
          </div>
          <div className="text-xs text-ph-gray-500 mt-0.5">
            {v.banner} · the levers to tackle, and where
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close breakdown"
          className="rounded p-1 text-ph-gray-400 hover:bg-ph-gray-100 hover:text-ph-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* The 3 levers, biggest first — a CEO-level read, no chat required. */}
      <div className="grid gap-3 md:grid-cols-3 mb-4">
        {v.vTree.map((n, i) => (
          <div
            key={n.name}
            className={cn(
              "rounded-lg border px-4 py-3",
              i === 0 ? "border-ph-burgundy/30 bg-ph-burgundy-soft/40" : "border-ph-gray-200 bg-ph-gray-50",
            )}
          >
            <div
              className={cn(
                "font-display text-xl leading-none",
                n.tone === "g" ? "text-[#2E7D5B]" : "text-ph-burgundy",
              )}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {n.variance}
            </div>
            <div className="text-[12.5px] font-medium text-ph-ink mt-1">{n.name}</div>
            {n.kids[0] && (
              <div className="text-[11px] text-ph-gray-500 mt-0.5">
                {i === 0 ? "Biggest driver: " : ""}
                {n.kids[0].name} ({n.kids[0].v})
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Facilities to tackle today — worst margins in scope, from the dataset. */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
              <th className="py-1.5 pr-3 font-semibold">Facility to tackle</th>
              <th className="py-1.5 pr-3 font-semibold">St</th>
              <th className="py-1.5 pr-3 font-semibold text-right">Margin</th>
              <th className="py-1.5 pr-3 font-semibold text-right">Labor %</th>
              <th className="py-1.5 pr-3 font-semibold text-right">Agency %</th>
              <th className="py-1.5 pr-3 font-semibold text-right">Occ</th>
              <th className="py-1.5 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ph-gray-100">
            {facilities.map((f) => (
              <tr key={f.name}>
                <td className="py-1.5 pr-3 font-medium text-ph-ink whitespace-nowrap">{f.name}</td>
                <td className="py-1.5 pr-3 text-ph-gray-500">{f.state}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums font-semibold text-ph-burgundy">
                  {f.margin}%
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{f.labor}%</td>
                <td
                  className={cn(
                    "py-1.5 pr-3 text-right tabular-nums",
                    f.agency > 10 && "font-semibold text-ph-burgundy",
                  )}
                >
                  {f.agency}%
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">
                  {f.occ == null ? "—" : `${f.occ}%`}
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      openDock(
                        `Why is ${f.name} (${f.state}) at ${f.margin}% operating margin, and what should we tackle first there?`,
                      )
                    }
                    className="text-[11px] font-medium text-ph-primary hover:underline whitespace-nowrap"
                  >
                    Ask why →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[10.5px] text-ph-gray-400">
        Highest agency cost in scope: <strong>{[...facilities].sort((a, b) => b.agency - a.agency)[0]?.name}</strong> — agency staffing is the common thread across the red rows.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            openDock("Why is operating margin down, and what should we tackle first? Keep it executive-level.")
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-ph-primary px-3.5 py-1.5 text-xs font-medium text-white hover:bg-ph-primary-dark"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} /> Explore in chat
        </button>
        <Link
          href="/financial/insights"
          className="inline-flex items-center gap-1 text-xs font-medium text-ph-gray-700 hover:text-ph-primary"
        >
          Full variance tree in Financial Insights <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
