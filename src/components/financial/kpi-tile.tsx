/*
 * KPI tile — accent rail, status dot, delta tone, plain-English glossary
 * tooltip (KPI_DEFS), and click-to-drill when a drill href is set.
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import { KPI_DEFS } from "@/lib/financial/glossary";
import type { KpiTileData } from "@/lib/financial/types";
import { ACCENTS, StatusDot } from "./primitives";

const DELTA_TONE: Record<string, string> = {
  good: "text-[#2E7D5B]",
  bad: "text-ph-burgundy",
  neutral: "text-ph-gray-500",
};

export function KpiTile({ tile }: { tile: KpiTileData }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="ph-eyebrow">{tile.label}</span>
        {tile.status && <StatusDot status={tile.status} />}
      </div>
      <div
        className="font-display text-[1.9rem] leading-none tracking-tight text-ph-ink mt-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {tile.value}
      </div>
      {tile.delta && (
        <div className={cn("text-[11px] font-medium mt-1.5", DELTA_TONE[tile.deltaTone ?? "neutral"])}>
          {tile.delta}
        </div>
      )}
      {tile.sub && <div className="text-[11px] text-ph-gray-500 mt-0.5">{tile.sub}</div>}
    </>
  );

  const className = cn(
    "ph-card relative p-4 pl-5 flex flex-col overflow-hidden",
    tile.drill && "transition-shadow hover:shadow-[var(--shadow-card-hover)]",
  );
  const rail = (
    <span
      className="absolute inset-y-0 left-0 w-1"
      style={{ background: ACCENTS[tile.accent] }}
      aria-hidden
    />
  );
  const title = KPI_DEFS[tile.label];

  if (tile.drill) {
    return (
      <Link href={tile.drill} className={className} title={title}>
        {rail}
        {body}
      </Link>
    );
  }
  return (
    <div className={cn(className, title && "cursor-help")} title={title}>
      {rail}
      {body}
    </div>
  );
}

export function KpiGrid({ tiles }: { tiles: KpiTileData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t) => (
        <KpiTile key={t.label + t.value} tile={t} />
      ))}
    </div>
  );
}
