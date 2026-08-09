/*
 * Platform & Governance content — the "built as if PruittHealth IT operates it
 * day one" admin surface. Authored data, RFP-scope-tagged (Scope F = model
 * lifecycle; Scope B/D = identity, PHI, audit).
 */

export const SOURCE_CHIPS = [
  { label: "ODS", sub: "Connected · 05-31 04:00", tone: "green" as const },
  { label: "PeopleSoft 9.2", sub: "Connected · 06:10", tone: "green" as const },
  { label: "Snowflake / EMR", sub: "2 sites pending · 02:40", tone: "amber" as const },
  { label: "SharePoint drop", sub: "6 docs today", tone: "green" as const },
  { label: "Blob storage", sub: "Healthy", tone: "green" as const },
];

export const LINEAGE = [
  { name: "Source systems", status: "green" as const },
  { name: "Fabric Mirror / Data Factory", status: "green" as const },
  { name: "Lakehouse Bronze→Silver→Gold", status: "amber" as const, note: "1 stage delayed" },
  { name: "Power BI semantic model", status: "green" as const },
  { name: "Azure AI Search index", status: "green" as const },
];

export const QUALITY_CHECKS = [
  { check: "Completeness", domain: "Finance", score: "99.4%", status: "pass" as const },
  { check: "Timeliness", domain: "Census-EMR", score: "91.0%", status: "warn" as const },
  { check: "Consistency", domain: "Survey extract", score: "97.8%", status: "pass" as const },
  { check: "Accuracy (sampled)", domain: "Citation class", score: "94.1%", status: "pass" as const },
];

export const BUSINESS_IMPACT = [
  {
    tone: "amber" as const,
    text: "Occupancy tiles for 2 sites may be stale — Census/EMR source last refreshed 02:40 ET. Next scheduled refresh 14:00 ET.",
  },
  {
    tone: "green" as const,
    text: "All finance domains current as of 04:00 ET. No business impact on Financial Insights.",
  },
];

export const MODEL_REGISTRY = [
  { model: "CMS-2567 citation extractor", version: "v2.3", env: "PROD", accuracy: "94.1%", drift: "0.02", status: "healthy" as const },
  { model: "Citation classifier", version: "v1.8", env: "PROD", accuracy: "91.6%", drift: "0.05", status: "healthy" as const },
  { model: "KPI anomaly detector", version: "v1.2", env: "PROD", accuracy: "88.0%", drift: "0.11", status: "watch drift" as const },
  { model: "POC draft generator", version: "v2.3", env: "PROD", accuracy: "—", drift: "0.03", status: "healthy" as const },
  { model: "NLQ orchestrator", version: "v3.0", env: "QA", accuracy: "—", drift: "—", status: "staging" as const },
];

export const DRIFT_BARS = [
  { label: "Input drift", value: 0.11, threshold: 0.15, tone: "amber" as const },
  { label: "Output drift", value: 0.06, threshold: 0.15, tone: "green" as const },
  { label: "Label drift (feedback)", value: 0.09, threshold: 0.15, tone: "green" as const },
];

export const FEEDBACK_LINE =
  "Feedback (30d): useful 142 · partial 18 · wrong 7. False-positive/negative log feeds evaluation. Rollback to last-known-good is gated by approver role.";

export const IDENTITY_ITEMS = [
  "Power BI RLS by facility / region / division",
  "AI Search trim mirrors facility scope",
  "Field-level security on finance + PHI",
  "MSAL / Entra auth · managed identities",
];

export const PHI_ROWS = [
  { label: "Finance pipeline", value: "0 PHI fields", tone: "green" as const },
  { label: "Survey pipeline", value: "masked at output", tone: "amber" as const },
  { label: "POC drafts", value: "PHI flagged for review", tone: "amber" as const },
  { label: "Exports", value: "data masking on · Purview labels", tone: "green" as const },
];

export const AUDIT_LOG = [
  { time: "04:12", actor: "M. Tran", event: "poc_generate", tone: "r" as const, detail: "POC-2026-0517 · 3 exemplars · F689", id: "…517-g1" },
  { time: "04:09", actor: "R. Owens", event: "assistant_query", tone: "v" as const, detail: "Finance mode · labor variance · scope: Maryland", id: "…aq-8842" },
  { time: "03:55", actor: "system", event: "alert_route", tone: "a" as const, detail: "F689 IJ → Teams (East compliance channel)", id: "…al-2210" },
  { time: "02:41", actor: "system", event: "pipeline_warn", tone: "a" as const, detail: "Census/EMR stale · 2 sites", id: "…pl-0099" },
  { time: "00:30", actor: "D. Gates (Exec)", event: "briefing_export", tone: "s" as const, detail: "Executive briefing PPT · watermark applied", id: "…be-7711" },
];
