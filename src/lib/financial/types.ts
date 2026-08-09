/*
 * Types for the Financial section ("AI Command Center") — the vendor demo's
 * concept rebuilt on our stack. All display content is typed data in this
 * folder; components render it and never hard-code a number.
 */

export type FinTab = "command" | "insights" | "survey-risk" | "alerts" | "platform";

export type PersonaKey =
  | "exec"
  | "finance"
  | "compliance"
  | "reviewer"
  | "facility"
  | "it";

export type FinScope = "enterprise" | "md" | "chesapeake";
export type SurveyScope = "all" | "assigned" | "chesapeake";
export type AlertScope = "all" | "md" | "chesapeake" | "assigned";

/** Tile accent color family (vendor cls t/s/g/a/r/v). */
export type TileAccent = "teal" | "sage" | "green" | "amber" | "burgundy" | "verdigris";
export type TileStatus = "green" | "amber" | "red";
/** Delta reading: up-good, down-bad, neutral. */
export type DeltaTone = "good" | "bad" | "neutral";

export type KpiTileData = {
  accent: TileAccent;
  status?: TileStatus;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
  sub?: string;
  /** Drill href — the whole tile becomes a link (e.g. "/financial/insights", "/poc-review"). */
  drill?: string;
};

export type ExceptionRow = {
  sev: "crit" | "warn" | "info";
  title: string;
  /** May contain <strong>/<span> markup — authored data, rendered as HTML. */
  meta: string;
  val: string;
  valTone: "r" | "a" | "g";
};

export type ExceptionCardData = {
  title: string;
  sub: string;
  pill: string;
  pillTone: "r" | "a" | "g" | "s" | "m";
  items: ExceptionRow[];
};

export type NarrativeStat = { val: string; lab: string; cls: "pos" | "neg" | "neu" };

export type SuggestedAction = { action: string; signal: string };

export type PersonaDef = {
  key: PersonaKey;
  name: string;
  role: string;
  scopeChip: string;
  mode: string;
  rbac: string;
  tabs: FinTab[];
  finScope: FinScope;
  surveyScope: SurveyScope;
  alertScope: AlertScope;
  roster: "all" | "MD" | "none";
  command: {
    title: string;
    /** Authored HTML (bold + tone spans). */
    body: string;
    stats: NarrativeStat[];
    kpiLabel: string;
    kpis: KpiTileData[];
    excFin: ExceptionCardData;
    excComp: ExceptionCardData;
    actions: SuggestedAction[];
  };
};

export type VarianceNode = {
  name: string;
  /** Bar width 0–100 encoding relative magnitude. */
  w: number;
  tone: "r" | "g";
  variance: string;
  kids: { name: string; v: string }[];
};

export type AnomalyRow = {
  kpi: string;
  val: string;
  exp: string;
  score: string;
  scoreTone: "r" | "a";
  driver: string;
  action: "investigate" | "acknowledge";
};

export type IngestionChip = {
  label: string;
  sub: string;
  tone: "green" | "amber";
};

export type FinVariant = {
  banner: string;
  bannerSub: string;
  kpis: KpiTileData[];
  vTitle: string;
  vSub: string;
  vTree: VarianceNode[];
  /** Authored HTML. */
  ai: string;
  aiSources: string[];
  anomalies: AnomalyRow[];
  trend: { rev: number[]; margin: number[]; min: number; max: number };
};

export type HighRiskRow = {
  sev: "crit" | "warn" | "info";
  title: string;
  meta: string;
  val: string;
  tone: "r" | "a" | "g";
};

export type RepoRow = {
  name: string;
  state: string;
  date: string;
  cites: number;
  topTag: string;
  confidence: string;
  pill: "r" | "a" | "s" | "g";
  pillLabel: string;
  /** Deep-link target in OUR app (replaces the vendor's POC-tab jump). */
  href?: string;
};

export type SurveyVariant = {
  banner: string;
  bannerSub: string;
  categories: { label: string; count: number; tone: string }[];
  highRisk: HighRiskRow[];
  repo: RepoRow[];
};

export type AlertRow = {
  sev: "Critical" | "Warning";
  source: string;
  alert: string;
  loc: string;
  owner: string;
  status: "New" | "Acknowledged" | "Investigating";
  age: string;
  channels: string;
  tags: ("md" | "chesapeake" | "assigned")[];
};

export type RosterRow = {
  name: string;
  state: string;
  line: string;
  occ: string;
  margin: string;
  cit: number;
  status: string;
  pill: "r" | "a" | "g" | "s";
};
