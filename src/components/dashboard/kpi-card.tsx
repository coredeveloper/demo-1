import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  value: string | number;
  caption: string;
  emphasis?: "neutral" | "warning" | "critical";
  delay?: number;
};

export function KpiCard({ eyebrow, value, caption, emphasis = "neutral", delay = 0 }: Props) {
  return (
    <div
      className={cn(
        "ph-card p-6 ph-reveal flex flex-col gap-2",
        emphasis === "critical" && "border-ph-burgundy/20 bg-ph-burgundy-soft/40",
        emphasis === "warning" && "border-ph-amber/30",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ph-eyebrow">{eyebrow}</div>
      <div
        className={cn(
          "ph-kpi-num",
          emphasis === "critical" && "text-ph-burgundy",
          emphasis === "warning" && "text-ph-amber",
        )}
      >
        {value}
      </div>
      <div className="text-xs text-ph-gray-500 leading-relaxed">{caption}</div>
    </div>
  );
}
