import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ftagFrequency, getFtag } from "@/lib/mock-data";

export function TrendSnapshot() {
  const freq = Array.from(ftagFrequency())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = freq[0]?.[1] ?? 1;

  return (
    <section className="ph-card overflow-hidden">
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl tracking-tight">F-tag frequency</h2>
          <p className="text-xs text-ph-gray-500 mt-0.5">Trailing 12 months · all facilities.</p>
        </div>
        <Link href="/trends" className="text-xs text-ph-primary hover:text-ph-primary-dark inline-flex items-center gap-1">
          Trends <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>
      <div className="px-6 py-5 flex flex-col gap-4">
        {freq.map(([ftag, count], i) => {
          const t = getFtag(ftag);
          const pct = (count / max) * 100;
          return (
            <Link
              key={ftag}
              href="/trends"
              title={t ? `${t.shortTitle} — open Trends` : "Open Trends"}
              className="ph-reveal group flex items-center gap-3 -mx-2 rounded-md px-2 py-0.5 transition-colors hover:bg-ph-gray-50"
              style={{ animationDelay: `${300 + i * 50}ms` }}
            >
              <span className="font-mono text-[11px] text-ph-gray-700 group-hover:text-ph-primary w-12 shrink-0">
                {ftag}
              </span>
              <div className="flex-1 h-1.5 bg-ph-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ph-primary rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-ph-gray-500 w-8 text-right tabular-nums">{count}</span>
            </Link>
          );
        })}
        <div className="text-[11px] text-ph-gray-400 italic mt-2">
          {freq[0] && getFtag(freq[0][0])?.shortTitle} leads — typical for skilled-nursing programs.
        </div>
      </div>
    </section>
  );
}
