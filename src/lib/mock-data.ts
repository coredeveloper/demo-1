import type {
  Facility,
  FTag,
  Survey,
  Deficiency,
  Severity,
  ResidentsAffected,
  PocStatus,
} from "./types";
import { mockPocActivities } from "./mock-poc";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic seeded RNG (mulberry32) — same input always yields same output
// so server + client render identical mock data and the demo is reproducible.
// ─────────────────────────────────────────────────────────────────────────────
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rand: () => number, items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  const target = rand() * total;
  let acc = 0;
  for (const it of items) {
    acc += it.weight;
    if (target < acc) return it.value;
  }
  return items[items.length - 1]!.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Facilities — 5 PruittHealth-style facilities matching the architecture spec
// ─────────────────────────────────────────────────────────────────────────────
export const FACILITIES: Facility[] = [
  {
    id: "fleming-island",
    fhirId: "Org/106124",
    name: "Pruitthealth Fleming Island",
    state: "FL",
    city: "Fleming Island",
    address: "2040 Town Center Blvd, Fleming Island, FL 32003",
    bu: "BU-FL-12",
    region: "Region-FL-North",
    division: "Division-Southeast",
    censusBeds: 120,
  },
  {
    id: "lafayette",
    fhirId: "Org/200034",
    name: "Pruitthealth Lafayette",
    state: "GA",
    city: "Lafayette",
    address: "201 Marquis Way, Lafayette, GA 30728",
    bu: "BU-GA-04",
    region: "Region-GA-South",
    division: "Division-Southeast",
    censusBeds: 98,
  },
  {
    id: "macon",
    fhirId: "Org/200078",
    name: "Pruitthealth Macon",
    state: "GA",
    city: "Macon",
    address: "850 Hospital Dr, Macon, GA 31211",
    bu: "BU-GA-09",
    region: "Region-GA-South",
    division: "Division-Southeast",
    censusBeds: 144,
  },
  {
    id: "marietta",
    fhirId: "Org/200122",
    name: "Pruitthealth Marietta",
    state: "GA",
    city: "Marietta",
    address: "350 Whitlock Ave NW, Marietta, GA 30064",
    bu: "BU-GA-15",
    region: "Region-GA-North",
    division: "Division-Southeast",
    censusBeds: 110,
  },
  {
    id: "panama-city",
    fhirId: "Org/300051",
    name: "Pruitthealth Panama City",
    state: "FL",
    city: "Panama City",
    address: "1700 Jenks Ave, Panama City, FL 32405",
    bu: "BU-FL-08",
    region: "Region-FL-Panhandle",
    division: "Division-Southeast",
    censusBeds: 86,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// F-tag catalog — top 15 LTC F-tags with realistic CMS descriptions
// (Source language adapted from CMS State Operations Manual Appendix PP)
// ─────────────────────────────────────────────────────────────────────────────
export const FTAGS: FTag[] = [
  { code: "F0677", title: "Provide care and assistance to perform activities of daily living for any resident who is unable", shortTitle: "ADL care" },
  { code: "F0689", title: "Free of accident hazards / supervision / devices", shortTitle: "Accident hazards" },
  { code: "F0686", title: "Treatment / services to prevent / heal pressure ulcers", shortTitle: "Pressure ulcer prevention" },
  { code: "F0656", title: "Develop / implement comprehensive care plan", shortTitle: "Care plan" },
  { code: "F0584", title: "Safe / clean / comfortable / homelike environment", shortTitle: "Environment safety" },
  { code: "F0880", title: "Infection prevention and control", shortTitle: "Infection control" },
  { code: "F0812", title: "Food procurement, store, prepare, serve — sanitary", shortTitle: "Food sanitation" },
  { code: "F0658", title: "Services provided meet professional standards", shortTitle: "Professional standards" },
  { code: "F0641", title: "Accuracy of assessments", shortTitle: "Assessment accuracy" },
  { code: "F0636", title: "Comprehensive assessments + timing", shortTitle: "Comprehensive assessment" },
  { code: "F0697", title: "Pain management", shortTitle: "Pain management" },
  { code: "F0759", title: "Free of medication error rates of 5% or more", shortTitle: "Medication error rate" },
  { code: "F0693", title: "Tube feeding management / restore eating skills", shortTitle: "Tube feeding" },
  { code: "F0684", title: "Quality of care", shortTitle: "Quality of care" },
  { code: "F0550", title: "Resident rights / exercise of rights", shortTitle: "Resident rights" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Narrative stubs — rotated through to seed survey deficiency narratives.
// Realistic in style, generic in detail; pre-redacted resident IDs (R<n>).
// ─────────────────────────────────────────────────────────────────────────────
const NARRATIVES = [
  "Resident #R294 was observed in his room sitting up in a wheelchair with elongated jagged fingernails with brown matter underneath. Interview with the certified nursing assistant assigned to the resident revealed that nail care had not been provided for approximately 14 days. Record review showed the most recent ADL care plan dated 2024-09-01 directed daily fingernail care.",
  "Surveyor observed an unattended cleaning cart in the central hallway containing a labeled bottle of disinfectant accessible to ambulatory residents. Interview with the housekeeping supervisor confirmed the cart should not be left unattended at any time when residents are present in the corridor.",
  "Resident #R187 was admitted with a Stage 2 pressure ulcer on the sacrum. Treatment record showed inconsistent application of the prescribed dressing — three of seven scheduled changes in the past week were not documented. Wound care nurse interview confirmed staffing shortfalls on weekend shifts contributed to the missed changes.",
  "Comprehensive care plan for Resident #R412 dated 2024-08-15 did not include interventions for the resident's documented pain diagnosis. Interdisciplinary team meeting minutes from 2024-09-22 noted that pain assessment was discussed but no plan revision occurred.",
  "Kitchen observation: an open carton of milk in the walk-in refrigerator had a 'use by' date 2 days past. Cook interview confirmed the milk was still in the rotation pool. Temperature log showed the walk-in had been at 45°F (above the 41°F max) for at least 4 hours during the prior shift without staff intervention.",
  "Resident #R301 was observed receiving a medication 90 minutes past the scheduled administration time without documented justification. Medication pass observation across two shifts revealed 4 of 38 administrations exceeded the 60-minute window allowed by policy.",
  "Tube feeding pump for Resident #R055 was running at the prescribed rate but the feed bag had not been changed within the 24-hour limit per manufacturer guidance. Bag change log showed last change 31 hours prior.",
  "Surveyor reviewed the infection control logs for the 30 days preceding the survey. Hand hygiene compliance audit data was missing for 18 of 30 days. The infection preventionist confirmed that documentation was deferred during a staffing gap and not back-filled.",
  "Resident #R209 voiced a grievance regarding her care assignment to the social services director on 2024-09-10. The grievance log showed the entry but no documented follow-up occurred within the 5-day window required by facility policy.",
  "Bath room observation revealed two residents waiting in their wheelchairs in the hallway outside the central bathing room for over 25 minutes during the 8am bath schedule. Bath aide interview confirmed scheduling conflicts on Tuesdays.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Survey generator — produces 30 surveys deterministically.
// Distribution (post-Pass-1 audit rebalance):
//   • 25 historical surveys distributed across the last 12 months
//   • 5 RECENT surveys clustered in the last 30 days, biased toward
//     "draft pending review" so the dashboard KPIs read alive:
//        Open surveys ≥ 6 · POCs due ≤7d (or overdue) ≥ 2 · IJ ≥ 1
// ─────────────────────────────────────────────────────────────────────────────
const FTAG_WEIGHTS: { value: string; weight: number }[] = [
  { value: "F0677", weight: 25 },
  { value: "F0689", weight: 18 },
  { value: "F0686", weight: 12 },
  { value: "F0656", weight: 9 },
  { value: "F0584", weight: 8 },
  { value: "F0880", weight: 7 },
  { value: "F0812", weight: 5 },
  { value: "F0658", weight: 4 },
  { value: "F0641", weight: 3 },
  { value: "F0636", weight: 3 },
  { value: "F0697", weight: 2 },
  { value: "F0759", weight: 2 },
  { value: "F0693", weight: 1 },
  { value: "F0684", weight: 1 },
];

// Pre-computed Document Intelligence-style confidence scores per F-tag.
// Used by the pipeline page Step 1 panel so values are deterministic
// and don't shift on every render (no Math.random() in JSX).
export const CONFIDENCE_BY_FTAG: Record<string, number> = {
  F0677: 0.987,
  F0689: 0.974,
  F0686: 0.962,
  F0656: 0.953,
  F0584: 0.978,
  F0880: 0.991,
  F0812: 0.969,
  F0658: 0.946,
  F0641: 0.957,
  F0636: 0.964,
  F0697: 0.972,
  F0759: 0.985,
  F0693: 0.951,
  F0684: 0.948,
  F0550: 0.967,
};

const SEVERITY_WEIGHTS: { value: Severity; weight: number }[] = [
  { value: "Minimal harm or potential for actual harm", weight: 60 },
  { value: "Actual harm", weight: 25 },
  { value: "Immediate jeopardy", weight: 8 },
  { value: "No actual harm with potential for minimal harm", weight: 7 },
];

const RES_AFFECTED_WEIGHTS: { value: ResidentsAffected; weight: number }[] = [
  { value: "Few", weight: 55 },
  { value: "Some", weight: 30 },
  { value: "Many", weight: 15 },
];

const STATUS_WEIGHTS: { value: PocStatus; weight: number }[] = [
  { value: "POC submitted", weight: 75 },
  { value: "draft pending review", weight: 20 },
  { value: "in extraction", weight: 5 },
];

const SURVEYOR_ORGS: Record<string, string> = {
  FL: "Florida Agency for Health Care Administration",
  GA: "Georgia Department of Community Health — Healthcare Facility Regulation",
  SC: "South Carolina Department of Health and Environmental Control",
};

const SEVERITY_RANK: Record<Severity, number> = {
  "Immediate jeopardy": 4,
  "Actual harm": 3,
  "Minimal harm or potential for actual harm": 2,
  "No actual harm with potential for minimal harm": 1,
};

type BuildOpts = {
  /** Days before today; if undefined, uses the historical 12-month spread. */
  daysBack?: number;
  /** Force the highest-severity deficiency to a specific tier (e.g. "Immediate jeopardy"). */
  forceWorstSeverity?: Severity;
  /** Bias the POC status weights toward "draft pending review" so the dashboard reads alive. */
  biasOpen?: boolean;
};

function buildSurvey(seed: number, idx: number, opts: BuildOpts = {}): Survey {
  const rand = rng(seed);
  const facility = FACILITIES[idx % FACILITIES.length]!;
  const surveyDate = new Date();
  if (opts.daysBack !== undefined) {
    surveyDate.setDate(surveyDate.getDate() - opts.daysBack);
  } else {
    // Historical spread across the past 12 months
    const monthsBack = 12 - Math.floor(idx / 3);
    const dayOfMonth = Math.floor(rand() * 28) + 1;
    surveyDate.setMonth(surveyDate.getMonth() - monthsBack);
    surveyDate.setDate(dayOfMonth);
  }
  surveyDate.setHours(0, 0, 0, 0);

  const surveyType = rand() < 0.85 ? "health-inspection" : "complaint-inspection";

  // 1-4 deficiencies
  const deficiencyCount = Math.floor(rand() * 3) + 1;
  const usedFtags = new Set<string>();
  const deficiencies: Deficiency[] = [];
  for (let i = 0; i < deficiencyCount; i++) {
    let ftag = pickWeighted(rand, FTAG_WEIGHTS);
    let attempts = 0;
    while (usedFtags.has(ftag) && attempts < 10) {
      ftag = pickWeighted(rand, FTAG_WEIGHTS);
      attempts++;
    }
    usedFtags.add(ftag);
    const severity = pickWeighted(rand, SEVERITY_WEIGHTS);
    const residentsAffected = pickWeighted(rand, RES_AFFECTED_WEIGHTS);
    const narrative = NARRATIVES[Math.floor(rand() * NARRATIVES.length)]!;
    deficiencies.push({ ftag, severity, residentsAffected, narrative });
  }

  // If caller wants to guarantee a specific severity tier, promote the first
  // deficiency. (Used to ensure ≥1 Immediate Jeopardy in the recent batch.)
  if (opts.forceWorstSeverity && deficiencies[0]) {
    deficiencies[0].severity = opts.forceWorstSeverity;
  }

  // Worst severity = highest-rank
  const worstSeverity = deficiencies.reduce<Severity>(
    (worst, d) => (SEVERITY_RANK[d.severity] > SEVERITY_RANK[worst] ? d.severity : worst),
    deficiencies[0]!.severity,
  );

  // Recent surveys: bias toward "draft pending review" so they show up
  // as urgent on the dashboard.
  const statusWeights = opts.biasOpen
    ? ([
        { value: "POC submitted", weight: 10 },
        { value: "draft pending review", weight: 75 },
        { value: "in extraction", weight: 15 },
      ] as { value: PocStatus; weight: number }[])
    : STATUS_WEIGHTS;
  const pocStatus = pickWeighted(rand, statusWeights);
  const pocDueDate = new Date(surveyDate.getTime() + 10 * 86_400_000); // 10-day window
  const id = `survey-${facility.id}-${idx}-${Math.floor(surveyDate.getTime() / 86_400_000)}`;

  const pocActivities = mockPocActivities(deficiencies, rand);

  return {
    id,
    facilityId: facility.id,
    surveyDate: surveyDate.toISOString(),
    surveyorOrg: SURVEYOR_ORGS[facility.state] ?? "State Agency",
    surveyType,
    deficiencies,
    pocActivities,
    pocStatus,
    pocDueDate: pocDueDate.toISOString(),
    worstSeverity,
    pdfPath: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public exports — generated once at module load (deterministic).
//
// Distribution after Pass-1 audit rebalance:
//   • 25 historical surveys spread across last 12 months (mostly POC submitted)
//   • 5 recent surveys clustered in the last 30 days, biased open, with one
//     forced Immediate Jeopardy so the IJ KPI reads non-zero.
// Recent days back: 2, 4, 9, 14, 21 — yielding 2 POCs due ≤7 days from today
// (4d → due+6, 9d → due+1) plus an overdue one (14d → due-4) for variety.
// ─────────────────────────────────────────────────────────────────────────────
const SEED_BASE = 2026_05_09;

const _historical: Survey[] = Array.from({ length: 25 }, (_, i) =>
  buildSurvey(SEED_BASE + i * 7, i),
);

const RECENT_PROFILES = [
  { daysBack: 2,  biasOpen: true,  forceWorstSeverity: undefined },
  { daysBack: 4,  biasOpen: true,  forceWorstSeverity: undefined },
  { daysBack: 9,  biasOpen: true,  forceWorstSeverity: "Immediate jeopardy" as Severity },
  { daysBack: 14, biasOpen: true,  forceWorstSeverity: undefined },
  { daysBack: 21, biasOpen: true,  forceWorstSeverity: undefined },
];

const _recent: Survey[] = RECENT_PROFILES.map((p, i) =>
  buildSurvey(SEED_BASE + (25 + i) * 7, 25 + i, p),
);

const _surveys: Survey[] = [..._historical, ..._recent];

// Attach the real CMS-2567 sample PDFs we ship so the PDF viewer tab shows
// actual source material on multiple records (and the pipeline survey-picker
// has more than one option). Both PDFs are real CMS-2567s; we attach
// Fleming-Island.pdf to the latest Fleming Island survey (its native match)
// and Arabella.pdf to a different recent survey (same form layout, different
// facility — illustrative for demo purposes).
const recentFleming = _recent.find((s) => s.facilityId === "fleming-island");
if (recentFleming) {
  recentFleming.pdfPath = "/samples/fleming-island-f0677.pdf";
} else {
  const anyFleming = _surveys.find((s) => s.facilityId === "fleming-island");
  if (anyFleming) anyFleming.pdfPath = "/samples/fleming-island-f0677.pdf";
}

const recentLafayette = _recent.find((s) => s.facilityId === "lafayette");
if (recentLafayette) {
  recentLafayette.pdfPath = "/samples/arabella-grand-bay.pdf";
} else {
  const anyLafayette = _surveys.find((s) => s.facilityId === "lafayette");
  if (anyLafayette) anyLafayette.pdfPath = "/samples/arabella-grand-bay.pdf";
}

export const SURVEYS: Survey[] = _surveys;

export const SURVEYS_BY_DATE_DESC = [...SURVEYS].sort(
  (a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime(),
);

export function getFacility(id: string): Facility | undefined {
  return FACILITIES.find((f) => f.id === id);
}

export function getSurvey(id: string): Survey | undefined {
  return SURVEYS.find((s) => s.id === id);
}

export function getFtag(code: string): FTag | undefined {
  return FTAGS.find((t) => t.code === code);
}

export function surveysByFacility(facilityId: string): Survey[] {
  return SURVEYS.filter((s) => s.facilityId === facilityId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregations for the dashboard / trends pages
// ─────────────────────────────────────────────────────────────────────────────
export function ftagCountsByFacility(): Map<string, Map<string, number>> {
  // facilityId -> ftag -> count
  const out = new Map<string, Map<string, number>>();
  for (const f of FACILITIES) out.set(f.id, new Map());
  for (const s of SURVEYS) {
    for (const d of s.deficiencies) {
      const m = out.get(s.facilityId)!;
      m.set(d.ftag, (m.get(d.ftag) ?? 0) + 1);
    }
  }
  return out;
}

export function severityCounts(): Map<Severity, number> {
  const m = new Map<Severity, number>();
  for (const s of SURVEYS) {
    for (const d of s.deficiencies) {
      m.set(d.severity, (m.get(d.severity) ?? 0) + 1);
    }
  }
  return m;
}

export function ftagFrequency(): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of SURVEYS) {
    for (const d of s.deficiencies) {
      m.set(d.ftag, (m.get(d.ftag) ?? 0) + 1);
    }
  }
  return m;
}

/**
 * Dashboard KPIs.
 *
 * NOTE: takes a `now` parameter so the caller can compute against a stable
 * client-side timestamp. Without this, calling Date.now() inside an SSR
 * render path produces hydration mismatches (server timestamp ≠ client
 * timestamp). Pages that need these values use a small client wrapper.
 */
export function dashboardKpis(now: number = Date.now()) {
  const open = SURVEYS.filter((s) => s.pocStatus !== "POC submitted").length;
  // "Urgent" = due within 7 days, OR already overdue and not yet submitted.
  const urgent = SURVEYS.filter((s) => {
    if (s.pocStatus === "POC submitted") return false;
    const days = (new Date(s.pocDueDate).getTime() - now) / 86_400_000;
    return days <= 7;
  }).length;
  const totalDeficiencies = SURVEYS.reduce((acc, s) => acc + s.deficiencies.length, 0);
  const ijCount = SURVEYS.reduce(
    (acc, s) => acc + s.deficiencies.filter((d) => d.severity === "Immediate jeopardy").length,
    0,
  );
  return {
    openSurveys: open,
    dueThisWeek: urgent,
    totalDeficiencies,
    immediateJeopardy: ijCount,
  };
}
