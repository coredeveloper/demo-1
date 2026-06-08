import type { Deficiency, PocActivity } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// POC drafting — deterministic per F-tag template
// In production: a Foundry agent does this with RAG over historical accepted
// POCs + policy library. Here: hand-written templates parameterized by F-tag.
// Each activity carries a citation pointing at a (mock) exemplar POC.
// ─────────────────────────────────────────────────────────────────────────────

type Template = {
  text: string;
  /** Responsible facility role — Minesh: "a nurse in charge of infection control / care planning / food". */
  owner: string;
  /** Planned cadence for the action (drives the evidence trail count). */
  cadence: string;
  citation: { exemplarId: string; quote: string };
};

const TEMPLATES: Record<string, Template[]> = {
  F0677: [
    {
      text: "Re-train all CNA staff on the ADL care plan for affected residents within 14 days; competency validation via direct observation by the unit charge nurse.",
      owner: "Unit Charge Nurse",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0677-2023-04-FlemingIsland",
        quote: "All CNAs were re-educated on the ADL bathing and grooming protocol; competency was verified through direct observation.",
      },
    },
    {
      text: "Implement a weekly nail-care audit by the unit charge nurse for the next 90 days; document findings on the resident's care plan progress notes.",
      owner: "Unit Charge Nurse",
      cadence: "Weekly ×12",
      citation: {
        exemplarId: "exemplar-F0677-2024-01-Macon",
        quote: "Weekly nail-care audits will be conducted by the unit charge nurse; results documented in the medical record.",
      },
    },
    {
      text: "Review and update each affected resident's comprehensive care plan to reflect current ADL status and intervention frequency; complete within 7 days of survey exit.",
      owner: "MDS Coordinator",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0677-2023-11-Lafayette",
        quote: "Comprehensive care plans were reviewed and revised by the IDT to include daily ADL audits.",
      },
    },
  ],
  F0689: [
    {
      text: "Perform an environmental safety walkthrough on every shift for 30 days; log findings and corrective actions in the maintenance binder.",
      owner: "Director of Nursing",
      cadence: "Every shift ×30d",
      citation: {
        exemplarId: "exemplar-F0689-2024-02-Marietta",
        quote: "Environmental safety walkthroughs are conducted on every shift, with findings logged and corrective actions documented.",
      },
    },
    {
      text: "Re-educate housekeeping and dietary staff on the policy that cleaning carts and chemicals must be attended at all times when residents are present.",
      owner: "Housekeeping Supervisor",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0689-2023-09-PanamaCity",
        quote: "Staff were re-educated on the unattended-chemicals policy and signed an acknowledgment form.",
      },
    },
    {
      text: "Add daily safety checklist items to the housekeeping sign-out procedure to confirm carts are returned to the locked storage room before shift end.",
      owner: "Housekeeping Supervisor",
      cadence: "Daily ×30",
      citation: {
        exemplarId: "exemplar-F0689-2024-03-FlemingIsland",
        quote: "The shift-end checklist was updated to include a verification step for all cleaning carts.",
      },
    },
  ],
  F0686: [
    {
      text: "Audit dressing-change documentation for all residents with Stage 2+ pressure ulcers daily for 60 days; missing entries trigger same-shift remediation by the wound nurse.",
      owner: "Wound Care Nurse",
      cadence: "Daily ×60",
      citation: {
        exemplarId: "exemplar-F0686-2024-01-Lafayette",
        quote: "Daily dressing-change documentation audits will be performed by the wound nurse for 60 days.",
      },
    },
    {
      text: "Increase wound-rounds frequency to twice weekly with the consulting wound physician for the next 90 days.",
      owner: "Wound Care Nurse",
      cadence: "Twice weekly ×90d",
      citation: {
        exemplarId: "exemplar-F0686-2023-10-Macon",
        quote: "The frequency of wound rounds was increased from weekly to twice weekly until the corrective action review.",
      },
    },
  ],
  F0656: [
    {
      text: "IDT will review every resident's comprehensive care plan within 30 days to confirm pain, ADL, and behavioral interventions are reflected and signed off by the assigned nurse.",
      owner: "MDS Coordinator",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0656-2024-02-Macon",
        quote: "An IDT-led review of all care plans was completed within 30 days; gaps were addressed and signed off by the primary nurse.",
      },
    },
    {
      text: "Add a weekly care-plan compliance check to the DON's Monday huddle agenda for 12 weeks.",
      owner: "Director of Nursing",
      cadence: "Weekly ×12",
      citation: {
        exemplarId: "exemplar-F0656-2023-08-Marietta",
        quote: "A weekly care-plan compliance check is now a standing agenda item at the DON's Monday huddle.",
      },
    },
  ],
  F0725: [
    {
      text: "Post and fill the two open RN positions; until filled, secure agency coverage to meet posted staffing ratios on every shift, verified daily against the staffing matrix.",
      owner: "Director of Nursing",
      cadence: "Daily ×30",
      citation: {
        exemplarId: "exemplar-F0725-2024-02-Macon",
        quote: "Open RN lines were back-filled with contracted agency staff until permanent hires started; daily staffing-matrix verification was implemented.",
      },
    },
    {
      text: "Implement a daily staffing-matrix review by the scheduler with escalation to the Administrator whenever any shift falls below the posted ratio.",
      owner: "Staffing Coordinator",
      cadence: "Daily ×90",
      citation: {
        exemplarId: "exemplar-F0725-2023-10-Lafayette",
        quote: "A daily staffing-matrix review with administrator escalation was added; under-staffed shifts are flagged before the shift begins.",
      },
    },
    {
      text: "Audit call-light response times twice weekly for 90 days on the affected units; report results to the QAPI committee.",
      owner: "Director of Nursing",
      cadence: "Twice weekly ×90d",
      citation: {
        exemplarId: "exemplar-F0725-2024-01-Marietta",
        quote: "Call-light response-time audits were performed twice weekly and reported to QAPI until response times returned to policy.",
      },
    },
  ],
  F0584: [
    {
      text: "Schedule the maintenance department to address the identified environmental hazards within 5 days; verify completion via photographic evidence on the maintenance log.",
      owner: "Maintenance Director",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0584-2023-12-FlemingIsland",
        quote: "Maintenance was tasked to address all identified hazards within 5 days, with photographic verification on file.",
      },
    },
    {
      text: "Implement quarterly room safety inspections by the administrator and document findings in the QA committee minutes.",
      owner: "Administrator",
      cadence: "Quarterly",
      citation: {
        exemplarId: "exemplar-F0584-2024-01-Lafayette",
        quote: "Quarterly room safety inspections by the administrator are now part of the QA committee process.",
      },
    },
  ],
  F0880: [
    {
      text: "Resume daily hand-hygiene compliance audits by the infection preventionist; results reported to the QAPI committee monthly for the next 6 months.",
      owner: "Infection Preventionist",
      cadence: "Daily ×180",
      citation: {
        exemplarId: "exemplar-F0880-2024-03-PanamaCity",
        quote: "Hand-hygiene compliance audits will resume daily; monthly summaries will be submitted to the QAPI committee.",
      },
    },
    {
      text: "All staff to complete the annual infection control competency module within 30 days; new hires within 14 days of orientation.",
      owner: "Staff Development Coordinator",
      cadence: "One-time",
      citation: {
        exemplarId: "exemplar-F0880-2023-11-Marietta",
        quote: "All staff completed the annual infection control competency within 30 days; new hires within their orientation window.",
      },
    },
  ],
};

// Generic fallback template (used for F-tags without a specific template above)
const GENERIC_TEMPLATE: Template[] = [
  {
    text: "Re-educate the affected staff on the policy and procedure relevant to this deficiency within 14 days; completion confirmed by signed acknowledgment.",
    owner: "Department Head",
    cadence: "One-time",
    citation: {
      exemplarId: "exemplar-generic-policy-reedu-2024-02",
      quote: "All affected staff were re-educated on the relevant policy and procedure; signed acknowledgments are on file.",
    },
  },
  {
    text: "Perform a 30-day audit of the documented behavior with weekly review by the responsible department head; results reported to QAPI.",
    owner: "Department Head",
    cadence: "Weekly ×4",
    citation: {
      exemplarId: "exemplar-generic-30day-audit-2024-01",
      quote: "A 30-day audit was performed with weekly review by the department head; results were reported to QAPI.",
    },
  },
];

// Number of evidence events to render for a completed action, by cadence.
function cadenceEventCount(cadence: string): number {
  const c = cadence.toLowerCase();
  if (c.includes("every shift") || c.includes("daily")) return 3;
  if (c.includes("twice weekly") || c.includes("weekly")) return 2;
  return 1;
}

export function mockPocActivities(
  deficiencies: Deficiency[],
  rand: () => number,
  opts: { completedBias: number; baseDate: Date },
): PocActivity[] {
  const activities: PocActivity[] = [];
  for (const d of deficiencies) {
    const templates = TEMPLATES[d.ftag] ?? GENERIC_TEMPLATE;
    const count = Math.min(templates.length, 2 + Math.floor(rand() * 2)); // 2-3 per deficiency
    for (let i = 0; i < count; i++) {
      const t = templates[i % templates.length]!;
      const targetDate = new Date(opts.baseDate.getTime() + (14 + i * 7) * 86_400_000);
      const complete = rand() < opts.completedBias;
      const evidence = complete
        ? Array.from({ length: cadenceEventCount(t.cadence) }, (_, k) => ({
            date: new Date(opts.baseDate.getTime() + (5 + k * 7) * 86_400_000)
              .toISOString()
              .slice(0, 10),
            by: t.owner,
          }))
        : [];
      activities.push({
        id: `activity-${d.ftag}-${i}-${Math.floor(rand() * 1e6)}`,
        text: t.text,
        owner: t.owner,
        cadence: t.cadence,
        status: complete ? "complete" : "not started",
        evidence,
        targetCompletionDate: targetDate.toISOString().slice(0, 10),
        citation: {
          exemplarId: t.citation.exemplarId,
          exemplarFtag: d.ftag,
          quote: t.citation.quote,
        },
      });
    }
  }
  return activities;
}
