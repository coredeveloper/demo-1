/*
 * AI narrative banner — persona-scoped executive briefing with a stat block.
 * Body strings are authored data with inline emphasis markup.
 */
import { cn } from "@/lib/utils";
import type { NarrativeStat } from "@/lib/financial/types";
import { Sparkles } from "lucide-react";

const STAT_TONE: Record<string, string> = {
  pos: "text-[#2E7D5B]",
  neg: "text-ph-burgundy",
  neu: "text-ph-ink",
};

export function NarrativeBanner({
  title,
  body,
  stats,
}: {
  title: string;
  body: string;
  stats: NarrativeStat[];
}) {
  return (
    <div className="ph-card-marquee p-5 md:p-6 grid gap-5 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ph-primary text-white">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-lg leading-snug">{title}</h2>
            <p
              className="mt-2 text-[13px] leading-relaxed text-ph-gray-700"
              dangerouslySetInnerHTML={{ __html: body }}
            />
            <p className="mt-3 text-[10.5px] text-ph-gray-400">
              Sources · Power BI semantic model · Fabric Lakehouse (finance) · CMS-2567 survey
              index · refreshed 2026-05-31 04:00 ET
            </p>
          </div>
        </div>
      </div>
      <div className="flex md:flex-col gap-4 md:gap-3 md:border-l md:border-ph-gray-200 md:pl-5 self-center">
        {stats.map((s) => (
          <div key={s.lab}>
            <div
              className={cn("font-display text-xl leading-none", STAT_TONE[s.cls])}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {s.val}
            </div>
            <div className="text-[10.5px] text-ph-gray-500 mt-1">{s.lab}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
