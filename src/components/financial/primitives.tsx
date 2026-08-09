/*
 * Small shared building blocks for the Financial section — section labels,
 * pills, cards, scope banners, ingestion strips, theater notes.
 */
import { cn } from "@/lib/utils";
import type { IngestionChip } from "@/lib/financial/types";

export const ACCENTS: Record<string, string> = {
  teal: "#0E5752",
  burgundy: "#7B2D3F",
  amber: "#B8862B",
  green: "#2E7D5B",
  verdigris: "#2F7D78",
  sage: "#9FB8B0",
};

export function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="ph-eyebrow">{children}</span>
      <span className="h-px flex-1 bg-ph-gray-200" />
      {hint && <span className="text-[10px] text-ph-gray-400">{hint}</span>}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  r: "bg-ph-burgundy-soft text-ph-burgundy",
  a: "bg-ph-amber/10 text-ph-amber",
  g: "bg-[#E7F0EB] text-[#2E7D5B]",
  s: "bg-ph-primary-soft text-ph-primary",
  v: "bg-[#E4EEED] text-[#2F7D78]",
  m: "bg-ph-gray-100 text-ph-gray-500",
};

export function Pill({ tone = "m", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap",
        PILL_TONES[tone] ?? PILL_TONES.m,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  sub,
  pill,
  pillTone,
  headerRight,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  pill?: string;
  pillTone?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ph-card p-5", className)}>
      {(title || pill || headerRight) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && <div className="text-sm font-semibold text-ph-ink">{title}</div>}
            {sub && <div className="text-xs text-ph-gray-500 mt-0.5">{sub}</div>}
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {pill && <Pill tone={pillTone}>{pill}</Pill>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function ScopeBanner({ scope, sub }: { scope: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-ph-gray-200 border-l-4 border-l-ph-primary bg-ph-paper px-4 py-2.5 text-sm">
      <span className="h-2 w-2 rounded-full bg-ph-primary ph-pulse" />
      <span className="font-medium text-ph-ink">{scope}</span>
      {sub && <span className="text-ph-gray-500">· {sub}</span>}
    </div>
  );
}

export function IngestionStrip({ chips }: { chips: IngestionChip[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {chips.map((c) => (
        <div key={c.label} className="ph-card px-3.5 py-2.5 flex items-start gap-2.5">
          <span
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              c.tone === "green" ? "bg-[#2E7D5B]" : "bg-ph-amber",
            )}
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-ph-ink">{c.label}</div>
            <div className="text-[11px] text-ph-gray-500 leading-snug">{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TheaterNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dotted border-ph-gray-200 bg-ph-gray-100/60 px-4 py-2.5 text-xs leading-relaxed text-ph-gray-500">
      {children}
    </p>
  );
}

export function StatusDot({ status }: { status: "green" | "amber" | "red" }) {
  const color =
    status === "green" ? "bg-[#2E7D5B]" : status === "amber" ? "bg-ph-amber" : "bg-ph-burgundy";
  return <span className={cn("h-2 w-2 rounded-full", color)} />;
}
