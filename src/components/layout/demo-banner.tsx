import { AlertTriangle } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-ph-burgundy text-white">
      <div className="px-10 py-1.5 flex items-center justify-center gap-2 text-[11px] tracking-wide font-medium">
        <AlertTriangle className="h-3 w-3" strokeWidth={2.4} />
        <span>
          MOCK DATA · NOT REAL FACILITY OUTCOMES · LOCAL PROTOTYPE — see
          <code className="mx-1.5 px-1 py-0.5 rounded bg-white/15 font-mono text-[10px]">
            architecture/proposed/02-state-survey-poc.md
          </code>
          for the production-architecture this UI is modeled on
        </span>
      </div>
    </div>
  );
}
