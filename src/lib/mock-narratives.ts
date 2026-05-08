// Pre-canned narrative passage extracts per F-tag for the pipeline Step 2
// "Content Understanding — semantic reasoning" panel. In production: an LLM
// classifies each survey narrative paragraph into one of five passage types
// (observation / record-review / interview / policy-review / findings-summary)
// and emits the typed extracts. Here: hand-curated examples per common F-tag,
// realistic in style and grounded in CMS State Operations Manual Appendix PP.

export type PassageType =
  | "observation"
  | "record-review"
  | "interview"
  | "policy-review"
  | "findings-summary";

export type Passage = { type: PassageType; text: string };

const FALLBACK: Passage[] = [
  { type: "observation", text: "Direct observation captured during the survey window; details vary by deficiency." },
  { type: "record-review", text: "Resident chart and care-plan documentation reviewed for corroboration." },
  { type: "interview", text: "Assigned staff and unit charge nurse interviewed; responses recorded." },
];

export const PASSAGES_BY_FTAG: Record<string, Passage[]> = {
  F0677: [
    { type: "observation", text: "Resident observed in wheelchair with elongated, jagged fingernails; visible debris underneath." },
    { type: "record-review", text: "ADL care plan dated 2024-09-01 directs daily fingernail care; last documented care 14 days prior." },
    { type: "interview", text: "Assigned CNA confirmed nail care had not been provided due to weekend coverage gap." },
    { type: "policy-review", text: "Facility policy 'Resident grooming and hygiene' (rev. 2023-11) mandates daily nail-care documentation." },
  ],
  F0689: [
    { type: "observation", text: "Unattended cleaning cart in central hallway containing labeled disinfectant accessible to ambulatory residents." },
    { type: "record-review", text: "Housekeeping shift sign-out log shows cart was not returned to locked storage at end of prior shift." },
    { type: "interview", text: "Housekeeping supervisor confirmed unattended-cart policy violation; staff to be re-educated." },
    { type: "policy-review", text: "Environmental safety policy section 4.2 prohibits unattended cleaning chemicals in resident-accessible areas." },
  ],
  F0686: [
    { type: "observation", text: "Resident #R187 admitted with Stage 2 pressure ulcer on sacrum; dressing inconsistent with treatment order." },
    { type: "record-review", text: "Wound-care log shows 3 of 7 scheduled dressing changes in past week were not documented." },
    { type: "interview", text: "Wound-care nurse confirmed weekend staffing shortfalls contributed to missed changes." },
    { type: "findings-summary", text: "Pattern of inconsistent wound documentation; risk of delayed identification of pressure-ulcer progression." },
  ],
  F0656: [
    { type: "record-review", text: "Comprehensive care plan dated 2024-08-15 omits interventions for documented pain diagnosis." },
    { type: "interview", text: "IDT minutes from 2024-09-22 noted pain assessment discussion; no plan revision occurred." },
    { type: "policy-review", text: "Care planning policy requires plan revision within 7 days of any new diagnosis or status change." },
  ],
  F0584: [
    { type: "observation", text: "Resident bath room shows water pooling at floor drain; non-slip strip lifted on threshold." },
    { type: "record-review", text: "Maintenance work-order log shows the repair was deferred from the prior month's punch list." },
    { type: "interview", text: "Maintenance supervisor acknowledged backlog; corrective scheduling already underway." },
  ],
  F0880: [
    { type: "record-review", text: "Hand hygiene compliance audit data missing for 18 of 30 days preceding the survey window." },
    { type: "interview", text: "Infection preventionist confirmed documentation deferred during staffing gap and not back-filled." },
    { type: "policy-review", text: "Infection-prevention policy requires daily hand-hygiene audits and weekly QAPI reporting." },
  ],
  F0812: [
    { type: "observation", text: "Walk-in refrigerator at 45°F (above 41°F max). Open milk carton 2 days past 'use by' date." },
    { type: "record-review", text: "Temperature log gap of 4 hours during prior shift; cook on duty did not escalate." },
    { type: "interview", text: "Dietary manager confirmed refrigerator alarm did not sound; equipment service order opened." },
  ],
  F0759: [
    { type: "observation", text: "Medication pass observation: 4 of 38 administrations exceeded the 60-minute window allowed by policy." },
    { type: "record-review", text: "MAR shows no documented justification for the late administrations." },
    { type: "interview", text: "Charge nurse cited unit acuity surge during the observed shift as contributing factor." },
  ],
  F0697: [
    { type: "observation", text: "Resident #R412 verbalized pain at 7/10 during observation; nurse on duty unaware of recent assessment." },
    { type: "record-review", text: "Last documented pain assessment was 11 days prior; care plan does not list non-pharmacological interventions." },
    { type: "policy-review", text: "Pain management policy requires assessment every shift and care-plan update with each escalation." },
  ],
};

export function passagesFor(ftag: string): Passage[] {
  return PASSAGES_BY_FTAG[ftag] ?? FALLBACK;
}

const PASSAGE_LABEL: Record<PassageType, string> = {
  "observation": "observation",
  "record-review": "record-review",
  "interview": "interview",
  "policy-review": "policy-review",
  "findings-summary": "findings-summary",
};

export function passageLabel(t: PassageType): string {
  return PASSAGE_LABEL[t];
}
