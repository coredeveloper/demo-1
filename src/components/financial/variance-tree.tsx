"use client";

/*
 * Variance tree — expandable driver branches with magnitude bars.
 * First branch starts open, matching the reference behavior.
 */
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VarianceNode } from "@/lib/financial/types";

export function VarianceTree({ nodes }: { nodes: VarianceNode[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col divide-y divide-ph-gray-100">
      {nodes.map((n, i) => {
        const isOpen = open.has(i);
        return (
          <div key={n.name} className="py-2">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2.5 rounded px-1 py-1 text-left hover:bg-ph-gray-100/60"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-ph-gray-400 transition-transform",
                  isOpen && "rotate-90",
                )}
              />
              <span className="text-[13px] font-medium text-ph-ink flex-1 min-w-0">{n.name}</span>
              <span className="hidden sm:block h-1.5 w-28 rounded-full bg-ph-gray-100 overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${n.w}%`,
                    background: n.tone === "g" ? "#2E7D5B" : "#7B2D3F",
                  }}
                />
              </span>
              <span
                className={cn(
                  "text-[12.5px] font-semibold whitespace-nowrap",
                  n.tone === "g" ? "text-[#2E7D5B]" : "text-ph-burgundy",
                )}
              >
                {n.variance}
              </span>
            </button>
            {isOpen && (
              <div className="ml-7 mt-1 flex flex-col gap-1">
                {n.kids.map((k) => (
                  <div key={k.name} className="flex items-baseline justify-between gap-3 text-[12px]">
                    <span className="text-ph-gray-500">{k.name}</span>
                    <span
                      className={cn(
                        "font-medium whitespace-nowrap",
                        k.v.startsWith("+") ? "text-[#2E7D5B]" : "text-ph-burgundy",
                      )}
                    >
                      {k.v}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
