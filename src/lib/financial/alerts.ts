/*
 * Alert inbox data + scope filtering. Counts are computed from the rows
 * (the vendor's nav badge said 5 while its data had 6 — computing fixes it).
 */
import type { AlertRow, AlertScope } from "./types";

export const ALERTS: AlertRow[] = [
  { sev: "Critical", source: "Compliance", alert: "F689 immediate jeopardy — POC due in 4d", loc: "Chesapeake, MD", owner: "M. Tran", status: "Investigating", age: "1d", channels: "Teams, Email", tags: ["md", "chesapeake", "assigned"] },
  { sev: "Critical", source: "Financial KPI", alert: "Agency % breach (14.2% vs 8% threshold)", loc: "Chesapeake, MD", owner: "R. Owens", status: "Acknowledged", age: "1d", channels: "Teams", tags: ["md", "chesapeake"] },
  { sev: "Critical", source: "Financial KPI", alert: "Operating margin breach (2.3%)", loc: "Annapolis, MD", owner: "R. Owens", status: "New", age: "1d", channels: "Email", tags: ["md"] },
  { sev: "Warning", source: "Financial KPI", alert: "Operating margin below target (3.1%)", loc: "Coastal Pines, GA", owner: "R. Owens", status: "New", age: "2d", channels: "Email", tags: ["assigned"] },
  { sev: "Warning", source: "Survey ingestion", alert: "Recurring F880 — 3 of last 4 surveys", loc: "Coastal Pines, GA", owner: "M. Tran", status: "Acknowledged", age: "3d", channels: "Teams", tags: ["assigned"] },
  { sev: "Warning", source: "Pipeline health", alert: "Census/EMR refresh stale (2 sites)", loc: "Portfolio", owner: "IT on-call", status: "New", age: "3h", channels: "Teams", tags: [] },
];

export const ALERT_SCOPE_LABEL: Record<Exclude<AlertScope, "all">, [string, string]> = {
  md: ["Maryland · 6 locations", "region alert feed"],
  chesapeake: ["Chesapeake [Illustrative] · Baltimore, MD", "facility alert feed"],
  assigned: ["Assigned facilities · 14", "your compliance scope"],
};

export function alertsForScope(scope: AlertScope): AlertRow[] {
  if (scope === "all") return ALERTS;
  if (scope === "assigned")
    return ALERTS.filter((a) => a.tags.includes("assigned") || a.tags.includes("chesapeake"));
  return ALERTS.filter((a) => a.tags.includes(scope));
}
