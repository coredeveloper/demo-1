/*
 * Survey-risk view content per scope. The all-locations categories come from
 * the dataset (citation taxonomy); scoped variants and the document-repository
 * rows are authored story data. Repository rows deep-link into OUR survey app
 * (the vendor jumped to its own mock POC tab instead).
 */
import type { HighRiskRow, IngestionChip, RepoRow, SurveyScope, SurveyVariant } from "./types";
import { citationTaxonomy } from "./selectors";

export const SURVEY_INGESTION: IngestionChip[] = [
  { label: "CMS-2567 ingestion", sub: "Today: 6 processed · 0 failed · SharePoint drop", tone: "green" },
  { label: "Extraction confidence", sub: "Avg 0.93 · Document Intelligence (custom 2567)", tone: "green" },
  { label: "Needs validation queue", sub: "3 low-confidence extractions pending", tone: "amber" },
  { label: "AI Search index", sub: "1,284 citations indexed · per-doc RBAC trim", tone: "green" },
];

const CAT_TONES: Record<string, string> = {
  "Clinical / Quality of Care": "#7B2D3F",
  "Infection Control": "#2E7D5B",
  "Resident Rights / Dignity": "#2F7D78",
  "Environment / Safety": "#B8862B",
  "Dietary / Nutrition": "#9FB8B0",
  "Administration / Governance": "#6B6F75",
};

const ALL_HIGH_RISK: HighRiskRow[] = [
  { sev: "crit", title: "Clinical / Quality of Care — trending up", meta: "66 citations (12m) · +18% QoQ · F684, F689, F656", val: "↑", tone: "r" },
  { sev: "warn", title: "Environment / Safety — rising", meta: "23 citations (12m) · +9% QoQ · F921, F908", val: "↑", tone: "a" },
  { sev: "info", title: "Infection Control — improving", meta: "39 citations (12m) · –12% QoQ · F880 improving", val: "↓", tone: "g" },
  { sev: "warn", title: "Recurring: Coastal Pines F880", meta: "Cited in 3 of the last 4 surveys", val: "×3", tone: "a" },
];

const ALL_REPO: RepoRow[] = [
  { name: "Chesapeake [Illustrative]", state: "MD", date: "2026-05-22", cites: 5, topTag: "F689 (Sev J)", confidence: "0.96", pill: "r", pillLabel: "POC open", href: "/poc-review" },
  { name: "Coastal Pines [Illustrative]", state: "GA", date: "2026-05-14", cites: 4, topTag: "F880", confidence: "0.94", pill: "a", pillLabel: "POC drafting", href: "/poc-review" },
  { name: "Piedmont Manor [Illustrative]", state: "NC", date: "2026-05-09", cites: 3, topTag: "F684", confidence: "0.91", pill: "s", pillLabel: "indexed" },
  { name: "Cumberland [Illustrative]", state: "TN", date: "2026-04-30", cites: 3, topTag: "F656", confidence: "0.88", pill: "a", pillLabel: "needs validation" },
  { name: "Gulf Coast HH [Illustrative]", state: "FL", date: "2026-04-21", cites: 2, topTag: "F812", confidence: "0.95", pill: "g", pillLabel: "validated" },
  { name: "Lowcountry [Illustrative]", state: "SC", date: "2026-04-12", cites: 2, topTag: "F550", confidence: "0.92", pill: "g", pillLabel: "validated" },
];

const ASSIGNED: SurveyVariant = {
  banner: "Assigned facilities · 14",
  bannerSub: "your review scope · trailing 12 months",
  categories: [
    { label: "Clinical / QoC", count: 22, tone: "#7B2D3F" },
    { label: "Infection Control", count: 14, tone: "#2E7D5B" },
    { label: "Resident Rights", count: 9, tone: "#2F7D78" },
    { label: "Environment / Safety", count: 7, tone: "#B8862B" },
    { label: "Dietary", count: 6, tone: "#9FB8B0" },
    { label: "Admin / Gov", count: 4, tone: "#6B6F75" },
  ],
  highRisk: [
    { sev: "crit", title: "Chesapeake — F689 (immediate jeopardy, Sev J)", meta: "Accident hazards · POC due 4d", val: "IJ", tone: "r" },
    { sev: "warn", title: "Coastal Pines — recurring F880", meta: "Infection control · 3 of last 4 surveys", val: "×3", tone: "a" },
    { sev: "warn", title: "Clinical / Quality of Care — rising in scope", meta: "22 citations · +14% QoQ · F684, F656", val: "↑", tone: "a" },
    { sev: "info", title: "Cumberland — F656 needs validation", meta: "Low-confidence extraction · held for review", val: "0.88", tone: "a" },
  ],
  repo: ALL_REPO.slice(0, 4),
};

const CHESAPEAKE: SurveyVariant = {
  banner: "Chesapeake [Illustrative] · Baltimore, MD",
  bannerSub: "1 location · 11 citations (12m)",
  categories: [
    { label: "Clinical / QoC", count: 5, tone: "#7B2D3F" },
    { label: "Environment / Safety", count: 3, tone: "#B8862B" },
    { label: "Infection Control", count: 1, tone: "#2E7D5B" },
    { label: "Resident Rights", count: 1, tone: "#2F7D78" },
    { label: "Admin / Gov", count: 1, tone: "#6B6F75" },
    { label: "Dietary", count: 0, tone: "#9FB8B0" },
  ],
  highRisk: [
    { sev: "crit", title: "F689 — immediate jeopardy (Sev J)", meta: "Accident hazards · unsecured med cart · POC due 4d", val: "IJ", tone: "r" },
    { sev: "warn", title: "Clinical / Quality of Care", meta: "5 citations (12m) · F684, F656", val: "↑", tone: "a" },
    { sev: "info", title: "Environment / Safety", meta: "3 citations (12m) · F908, F921", val: "3", tone: "a" },
  ],
  repo: [
    { name: "Chesapeake [Illustrative]", state: "MD", date: "2026-05-22", cites: 5, topTag: "F689 (Sev J)", confidence: "0.96", pill: "r", pillLabel: "POC open", href: "/poc-review" },
    { name: "Chesapeake [Illustrative]", state: "MD", date: "2026-02-10", cites: 3, topTag: "F684", confidence: "0.93", pill: "g", pillLabel: "validated" },
    { name: "Chesapeake [Illustrative]", state: "MD", date: "2025-11-04", cites: 3, topTag: "F761", confidence: "0.90", pill: "g", pillLabel: "validated" },
  ],
};

export function surveyVariant(scope: SurveyScope): SurveyVariant {
  if (scope === "assigned") return ASSIGNED;
  if (scope === "chesapeake") return CHESAPEAKE;
  return {
    banner: "All locations · 180",
    bannerSub: "trailing 12 months · all surveys",
    categories: citationTaxonomy().map((c) => ({
      label: c.label,
      count: c.count,
      tone: CAT_TONES[c.label] ?? "#6B6F75",
    })),
    highRisk: ALL_HIGH_RISK,
    repo: ALL_REPO,
  };
}
