"use client";

/*
 * /financial/alerts — Alert & Action Center. Counts computed from the rows
 * (fixing the vendor's hard-coded badge), scope-filtered by persona.
 */
import { useFinPersona } from "@/components/financial/persona-provider";
import {
  Card,
  Pill,
  ScopeBanner,
  SectionLabel,
  TheaterNote,
} from "@/components/financial/primitives";
import { fireToast } from "@/components/financial/chrome";
import { ALERT_SCOPE_LABEL, alertsForScope } from "@/lib/financial/alerts";
import { KpiTile } from "@/components/financial/kpi-tile";

const STATUS_TONE: Record<string, string> = {
  New: "m",
  Acknowledged: "s",
  Investigating: "a",
};

export default function AlertsPage() {
  const { persona } = useFinPersona();
  const scope = persona.alertScope;
  const rows = alertsForScope(scope);
  const [scopeLabel, scopeSub] =
    scope === "all"
      ? ["Portfolio · 180 locations", "all KPI & compliance alerts"]
      : ALERT_SCOPE_LABEL[scope];
  const crit = rows.filter((r) => r.sev === "Critical").length;
  const warn = rows.filter((r) => r.sev === "Warning").length;

  return (
    <div className="flex flex-col gap-6">
      <ScopeBanner scope={scopeLabel} sub={scopeSub} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile tile={{ accent: "burgundy", label: "Critical (open)", value: String(crit), sub: scope === "all" ? "avg age 1.2 days" : scopeLabel }} />
        <KpiTile tile={{ accent: "amber", label: "Warning (open)", value: String(warn), sub: scope === "all" ? "avg age 2.6 days" : "in scope" }} />
        <KpiTile tile={{ accent: "green", label: "SLA on-time", value: "94%", sub: "gen→delivery" }} />
        <KpiTile tile={{ accent: "sage", label: "Channels", value: "Teams · Email", sub: "per-rule routing" }} />
      </section>

      <Card
        title="Alert inbox"
        sub={`KPI breaches & compliance risks · ${scopeLabel}`}
        headerRight={
          <button
            type="button"
            onClick={() => fireToast("Bulk acknowledge (demo)")}
            className="rounded-md border border-ph-gray-200 px-2.5 py-1 text-[11px] font-medium text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
          >
            Acknowledge selected
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                <th className="py-1.5 pr-3 font-semibold">Sev</th>
                <th className="py-1.5 pr-3 font-semibold">Source</th>
                <th className="py-1.5 pr-3 font-semibold">Alert</th>
                <th className="py-1.5 pr-3 font-semibold">Location</th>
                <th className="py-1.5 pr-3 font-semibold">Owner</th>
                <th className="py-1.5 pr-3 font-semibold">Status</th>
                <th className="py-1.5 pr-3 font-semibold">Age</th>
                <th className="py-1.5 font-semibold">Channels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ph-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-ph-gray-400">
                    No open alerts in this scope.
                  </td>
                </tr>
              )}
              {rows.map((a) => (
                <tr key={a.alert + a.loc}>
                  <td className="py-2 pr-3">
                    <Pill tone={a.sev === "Critical" ? "r" : "a"}>{a.sev}</Pill>
                  </td>
                  <td className="py-2 pr-3 text-ph-gray-500 whitespace-nowrap">{a.source}</td>
                  <td className="py-2 pr-3 font-medium text-ph-ink">{a.alert}</td>
                  <td className="py-2 pr-3 text-ph-gray-500 whitespace-nowrap">{a.loc}</td>
                  <td className="py-2 pr-3 text-ph-gray-500 whitespace-nowrap">{a.owner}</td>
                  <td className="py-2 pr-3">
                    <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-ph-gray-500">{a.age}</td>
                  <td className="py-2 text-ph-gray-500 whitespace-nowrap">{a.channels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TheaterNote>
        Each alert has an owner, status, severity, source, channel, and audit trail. Suppression
        &amp; reassignment require a reason and are logged (Governance &amp; Audit).
      </TheaterNote>
    </div>
  );
}
