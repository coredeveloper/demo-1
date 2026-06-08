import { cn } from "@/lib/utils";

// CMS scope-severity grid bands (Appendix P) — what drives enforcement.
const BANDS = [
  { letters: "A–C", label: "Self-correct", cls: "bg-ph-primary-soft text-ph-primary" },
  { letters: "D–F", label: "More than minimal", cls: "bg-ph-amber text-white" },
  { letters: "G–I", label: "Actual harm", cls: "bg-[var(--sev-actual)] text-white" },
  { letters: "J–L", label: "Immediate Jeopardy · state enforcement", cls: "bg-ph-burgundy text-white" },
];

export function ScopeSeverityLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]", className)}>
      <span className="ph-eyebrow text-ph-gray-400">CMS grade</span>
      {BANDS.map((b) => (
        <span key={b.letters} className="inline-flex items-center gap-1.5">
          <span className={cn("rounded px-1.5 py-0.5 font-display leading-none", b.cls)}>{b.letters}</span>
          <span className="text-ph-gray-500">{b.label}</span>
        </span>
      ))}
    </div>
  );
}
