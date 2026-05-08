import { z } from "zod";

export const Severity = z.enum([
  "Immediate jeopardy",
  "Actual harm",
  "Minimal harm or potential for actual harm",
  "No actual harm with potential for minimal harm",
]);
export type Severity = z.infer<typeof Severity>;

export const ResidentsAffected = z.enum(["Few", "Some", "Many"]);
export type ResidentsAffected = z.infer<typeof ResidentsAffected>;

export const PocStatus = z.enum([
  "in extraction",
  "draft pending review",
  "POC submitted",
]);
export type PocStatus = z.infer<typeof PocStatus>;

export const Facility = z.object({
  id: z.string(),
  fhirId: z.string(),
  name: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  bu: z.string(),
  region: z.string(),
  division: z.string(),
  censusBeds: z.number(),
});
export type Facility = z.infer<typeof Facility>;

export const FTag = z.object({
  code: z.string(),
  title: z.string(),
  shortTitle: z.string(),
});
export type FTag = z.infer<typeof FTag>;

export const Deficiency = z.object({
  ftag: z.string(),
  severity: Severity,
  residentsAffected: ResidentsAffected,
  narrative: z.string(),
});
export type Deficiency = z.infer<typeof Deficiency>;

export const PocActivity = z.object({
  id: z.string(),
  text: z.string(),
  targetCompletionDate: z.string(),
  citation: z.object({
    exemplarId: z.string(),
    exemplarFtag: z.string(),
    quote: z.string(),
  }),
});
export type PocActivity = z.infer<typeof PocActivity>;

export const Survey = z.object({
  id: z.string(),
  facilityId: z.string(),
  surveyDate: z.string(),
  surveyorOrg: z.string(),
  surveyType: z.enum(["health-inspection", "complaint-inspection"]),
  deficiencies: z.array(Deficiency),
  pocActivities: z.array(PocActivity),
  pocStatus: PocStatus,
  pocDueDate: z.string(),
  worstSeverity: Severity,
  /** Public path to the source CMS-2567 PDF when available (real samples only). */
  pdfPath: z.string().nullable(),
});
export type Survey = z.infer<typeof Survey>;
