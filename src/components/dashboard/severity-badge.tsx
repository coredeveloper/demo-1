import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<Severity, string> = {
  "Immediate jeopardy":
    "bg-ph-burgundy text-white border-transparent",
  "Actual harm":
    "bg-[var(--sev-actual)]/10 text-[var(--sev-actual)] border-[var(--sev-actual)]/30",
  "Minimal harm or potential for actual harm":
    "bg-[var(--sev-minimal)]/15 text-[var(--ph-gray-700)] border-[var(--sev-minimal)]/40",
  "No actual harm with potential for minimal harm":
    "bg-ph-primary-soft text-ph-primary border-transparent",
};

const SHORT: Record<Severity, string> = {
  "Immediate jeopardy": "IJ",
  "Actual harm": "Actual harm",
  "Minimal harm or potential for actual harm": "Minimal",
  "No actual harm with potential for minimal harm": "No harm",
};

export function SeverityBadge({ severity, compact = false }: { severity: Severity; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
        STYLES[severity],
      )}
    >
      {compact ? SHORT[severity] : severity}
    </span>
  );
}
