/*
 * Exception card — severity-railed rows with owner chips and a right-aligned
 * toned value. Meta strings are authored data and may carry inline markup.
 */
import { cn } from "@/lib/utils";
import type { ExceptionCardData } from "@/lib/financial/types";
import { Card } from "./primitives";

const SEV_RAIL: Record<string, string> = {
  crit: "bg-ph-burgundy",
  warn: "bg-ph-amber",
  info: "bg-ph-sage",
};

const VAL_TONE: Record<string, string> = {
  r: "text-ph-burgundy",
  a: "text-ph-amber",
  g: "text-[#2E7D5B]",
};

export function ExceptionCard({ data }: { data: ExceptionCardData }) {
  return (
    <Card title={data.title} sub={data.sub} pill={data.pill} pillTone={data.pillTone}>
      <div className="flex flex-col divide-y divide-ph-gray-100">
        {data.items.map((it) => (
          <div key={it.title} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className={cn("mt-1 h-8 w-1 shrink-0 rounded-full", SEV_RAIL[it.sev])} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ph-ink leading-snug">{it.title}</div>
              <div
                className="text-[11.5px] text-ph-gray-500 leading-snug mt-0.5"
                dangerouslySetInnerHTML={{ __html: it.meta }}
              />
            </div>
            <span className={cn("text-[13px] font-semibold whitespace-nowrap", VAL_TONE[it.valTone])}>
              {it.val}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
