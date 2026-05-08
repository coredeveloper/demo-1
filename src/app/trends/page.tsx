import { ftagCountsByFacility, FACILITIES, severityCounts, ftagFrequency } from "@/lib/mock-data";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NlqChat } from "@/components/trends/nlq-chat";

export default function TrendsPage() {
  const heat = ftagCountsByFacility();
  const topFtags = Array.from(ftagFrequency())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([code]) => code);
  const max = Math.max(
    1,
    ...FACILITIES.flatMap((f) => topFtags.map((t) => heat.get(f.id)?.get(t) ?? 0)),
  );
  const sev = severityCounts();
  const sevTotal = Array.from(sev.values()).reduce((a, b) => a + b, 0);
  const sevOrder: Severity[] = [
    "Immediate jeopardy",
    "Actual harm",
    "Minimal harm or potential for actual harm",
    "No actual harm with potential for minimal harm",
  ];
  const SEV_COLORS: Record<Severity, string> = {
    "Immediate jeopardy": "bg-ph-burgundy",
    "Actual harm": "bg-[var(--sev-actual)]",
    "Minimal harm or potential for actual harm": "bg-[var(--sev-minimal)]",
    "No actual harm with potential for minimal harm": "bg-ph-sage",
  };

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-10 ph-reveal grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="text-[20px] leading-[1.3] tracking-tight font-display text-ph-ink">
            What's <span className="text-ph-burgundy">recurring</span>, where it concentrates,
            and which severity tier it lands in.
          </p>
        </div>
        <div className="col-span-12 md:col-span-5">
          <hr className="ph-rule mb-3" />
          <p className="text-xs text-ph-gray-500 leading-relaxed">
            Trailing 12 months across {FACILITIES.length} facilities. Click any cell to drill into
            the underlying surveys.
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <section className="ph-card overflow-hidden mb-10">
        <header className="px-6 py-4 border-b border-ph-gray-200 flex items-baseline justify-between gap-4">
          <div>
            <h3 className="text-lg tracking-tight">F-tag heatmap</h3>
            <p className="text-[11px] text-ph-gray-500 mt-0.5">
              Color intensity = citation count. Burgundy cells = highest concentration; amber = mid; sage = low.
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-ph-burgundy bg-ph-burgundy-soft px-2 py-1 rounded whitespace-nowrap">
            Synthetic · n=30 · seed-based
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="ph-eyebrow text-left px-4 py-3 sticky left-0 bg-ph-paper">Facility</th>
                {topFtags.map((code) => (
                  <th key={code} className="px-2 py-3 text-center font-mono text-[10px] text-ph-gray-700">
                    {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACILITIES.map((f) => (
                <tr key={f.id} className="border-t border-ph-gray-100">
                  <td className="px-4 py-2 font-display text-ph-ink whitespace-nowrap sticky left-0 bg-ph-paper">
                    {f.name.replace("Pruitthealth ", "")}
                  </td>
                  {topFtags.map((code) => {
                    const c = heat.get(f.id)?.get(code) ?? 0;
                    const intensity = c / max;
                    return (
                      <td key={code} className="px-1 py-1 text-center">
                        <div
                          className={cn(
                            "h-9 w-9 mx-auto flex items-center justify-center rounded text-[11px] font-mono transition-transform hover:scale-110",
                            c === 0
                              ? "bg-ph-gray-50 text-ph-gray-300"
                              : intensity > 0.66
                                ? "bg-ph-burgundy text-white"
                                : intensity > 0.33
                                  ? "bg-ph-amber/80 text-white"
                                  : "bg-ph-primary-soft text-ph-primary",
                          )}
                          title={`${f.name} · ${code} · ${c} citations`}
                        >
                          {c || ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="px-6 py-3 border-t border-ph-gray-100 bg-ph-gray-50 text-[10px] text-ph-gray-500 italic leading-relaxed">
          Generated from a deterministic seed in <code className="not-italic font-mono text-[10px] mx-0.5 px-1 py-0.5 rounded bg-ph-paper">src/lib/mock-data.ts</code>.
          F-tag distribution weights match published LTC patterns; specific facility-by-F-tag counts are illustrative, not actual PruittHealth outcomes.
        </footer>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Severity stack */}
        <section className="col-span-12 md:col-span-7 ph-card overflow-hidden">
          <header className="px-6 py-4 border-b border-ph-gray-200 flex items-baseline justify-between gap-4">
            <div>
              <h3 className="text-lg tracking-tight">Severity distribution</h3>
              <p className="text-[11px] text-ph-gray-500 mt-0.5">{sevTotal} total citations across the synthetic corpus.</p>
            </div>
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-ph-burgundy bg-ph-burgundy-soft px-2 py-1 rounded whitespace-nowrap">
              Synthetic
            </span>
          </header>
          <div className="px-6 py-5">
            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {sevOrder.map((s) => {
                const c = sev.get(s) ?? 0;
                const pct = (c / sevTotal) * 100;
                return <div key={s} className={cn(SEV_COLORS[s], "h-full")} style={{ width: `${pct}%` }} />;
              })}
            </div>
            <ul className="text-xs space-y-2">
              {sevOrder.map((s) => {
                const c = sev.get(s) ?? 0;
                const pct = ((c / sevTotal) * 100).toFixed(1);
                return (
                  <li key={s} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-3", SEV_COLORS[s])} />
                      <span className="text-ph-gray-700">{s}</span>
                    </div>
                    <span className="font-mono text-ph-gray-500">
                      {c} <span className="text-ph-gray-300">·</span> {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* NLQ chat (the survey-trend agent surface) */}
        <div className="col-span-12 md:col-span-5">
          <NlqChat />
        </div>
      </div>
    </div>
  );
}
