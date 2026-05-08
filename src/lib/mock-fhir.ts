import type { Survey, Facility, Deficiency } from "./types";
import { getFacility, getFtag } from "./mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Mock FHIR R4 Bundle constructor
// Produces a valid-shape Bundle for any survey, mirroring the production
// FHIR Converter Liquid template output. Schema follows architecture/proposed/
// 02-state-survey-poc.md §5 (FHIR mapping).
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_TO_DETECTED_ISSUE: Record<string, string> = {
  "Immediate jeopardy": "high",
  "Actual harm": "moderate",
  "Minimal harm or potential for actual harm": "moderate",
  "No actual harm with potential for minimal harm": "low",
};

export type FhirResource = {
  resourceType: string;
  id: string;
  [key: string]: unknown;
};

export type FhirBundle = {
  resourceType: "Bundle";
  id: string;
  type: "collection";
  timestamp: string;
  entry: { fullUrl: string; resource: FhirResource }[];
};

function org(facility: Facility): FhirResource {
  return {
    resourceType: "Organization",
    id: facility.fhirId.split("/")[1]!,
    identifier: [
      { system: "https://cms.gov/cms-2567", value: facility.fhirId.split("/")[1] },
    ],
    name: facility.name,
    address: [
      {
        line: [facility.address.split(",")[0]!.trim()],
        city: facility.city,
        state: facility.state,
        country: "US",
      },
    ],
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: "prov",
            display: "Healthcare Provider",
          },
        ],
        text: "Skilled Nursing Facility",
      },
    ],
  };
}

function surveyorOrg(survey: Survey): FhirResource {
  return {
    resourceType: "Organization",
    id: `surveyor-${survey.surveyorOrg.split(" ").join("-").slice(0, 32)}`,
    name: survey.surveyorOrg,
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: "govt",
            display: "Government",
          },
        ],
        text: "State Survey Agency",
      },
    ],
  };
}

function measure(ftag: string): FhirResource {
  const t = getFtag(ftag);
  return {
    resourceType: "Measure",
    id: ftag,
    url: `https://pruitthealth.com/fhir/Measure/${ftag}`,
    name: ftag,
    title: t?.title ?? ftag,
    status: "active",
    experimental: false,
    publisher: "CMS State Operations Manual Appendix PP",
    description: t?.title ?? ftag,
    topic: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/measure-topic",
            code: "structure",
          },
        ],
        text: "Long-term care quality measure",
      },
    ],
  };
}

function measureReport(
  survey: Survey,
  facility: Facility,
  d: Deficiency,
  index: number,
): FhirResource {
  return {
    resourceType: "MeasureReport",
    id: `${survey.id}-mr-${index}`,
    status: "complete",
    type: "individual",
    measure: `Measure/${d.ftag}`,
    subject: { reference: facility.fhirId, display: facility.name },
    date: survey.surveyDate.slice(0, 10),
    period: {
      start: survey.surveyDate.slice(0, 10),
      end: survey.surveyDate.slice(0, 10),
    },
    improvementNotation: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/measure-improvement-notation",
          code: "decrease",
        },
      ],
    },
    group: [
      {
        stratifier: [
          {
            code: [{ text: "Level of Harm" }],
            stratum: [{ value: { text: d.severity } }],
          },
          {
            code: [{ text: "Residents Affected" }],
            stratum: [{ value: { text: d.residentsAffected } }],
          },
        ],
      },
    ],
    evaluatedResource: [{ reference: `DocumentReference/${survey.id}-pdf` }],
    extension: [
      {
        url: "https://pruitthealth.com/fhir/StructureDefinition/finding-narrative",
        valueString: d.narrative,
      },
    ],
  };
}

function detectedIssue(
  survey: Survey,
  facility: Facility,
  d: Deficiency,
  index: number,
): FhirResource {
  return {
    resourceType: "DetectedIssue",
    id: `${survey.id}-di-${index}`,
    status: "preliminary",
    code: {
      coding: [
        {
          system: "https://pruitthealth.com/fhir/CodeSystem/cms-ftag",
          code: d.ftag,
        },
      ],
    },
    severity: SEVERITY_TO_DETECTED_ISSUE[d.severity] ?? "moderate",
    subject: { reference: facility.fhirId, display: facility.name },
    identifiedDateTime: survey.surveyDate,
    detail: d.narrative.slice(0, 200) + (d.narrative.length > 200 ? "..." : ""),
  };
}

function carePlan(survey: Survey, facility: Facility): FhirResource {
  return {
    resourceType: "CarePlan",
    id: `${survey.id}-poc`,
    status: survey.pocStatus === "POC submitted" ? "active" : "draft",
    intent: "plan",
    title: "Plan of Correction",
    subject: { reference: facility.fhirId, display: facility.name },
    period: {
      start: survey.surveyDate.slice(0, 10),
      end: survey.pocDueDate.slice(0, 10),
    },
    activity: survey.pocActivities.map((a) => ({
      id: a.id,
      detail: {
        status: "not-started",
        description: a.text,
        scheduledTiming: { event: [a.targetCompletionDate] },
      },
    })),
    note: [
      {
        text: `Drafted by Foundry POC drafting agent. ${survey.pocActivities.length} corrective activities. Citations: ${survey.pocActivities.length} historical exemplars.`,
      },
    ],
  };
}

function binary(survey: Survey): FhirResource {
  return {
    resourceType: "Binary",
    id: `${survey.id}-binary`,
    contentType: "application/pdf",
    data: "<base64-encoded PDF bytes — omitted in mock>",
  };
}

function documentReference(survey: Survey, facility: Facility): FhirResource {
  return {
    resourceType: "DocumentReference",
    id: `${survey.id}-pdf`,
    status: "current",
    type: {
      coding: [
        {
          system: "https://cms.gov/cms-2567",
          code: "CMS-2567",
          display: "Statement of Deficiencies",
        },
      ],
    },
    category: [{ text: "regulatory-survey" }],
    subject: { reference: facility.fhirId, display: facility.name },
    date: survey.surveyDate,
    content: [
      {
        attachment: {
          contentType: "application/pdf",
          url: `Binary/${survey.id}-binary`,
          title: `${facility.name} CMS-2567 ${survey.surveyDate.slice(0, 10)}`,
        },
      },
    ],
  };
}

function composition(
  survey: Survey,
  facility: Facility,
  measureReportIds: string[],
  carePlanId: string,
  documentReferenceId: string,
): FhirResource {
  return {
    resourceType: "Composition",
    id: `${survey.id}-composition`,
    status: "final",
    type: {
      coding: [
        {
          system: "https://pruitthealth.com/fhir/CodeSystem/cms-2567",
          code: "CMS-2567",
          display: "CMS-2567 Statement of Deficiencies",
        },
      ],
    },
    subject: { reference: facility.fhirId, display: facility.name },
    date: survey.surveyDate,
    author: [{ reference: `Organization/surveyor-${survey.surveyorOrg.split(" ").join("-").slice(0, 32)}` }],
    title: `Statement of Deficiencies — ${facility.name} — ${survey.surveyDate.slice(0, 10)}`,
    section: [
      {
        title: "Deficiencies",
        entry: measureReportIds.map((id) => ({ reference: `MeasureReport/${id}` })),
      },
      {
        title: "Plan of Correction",
        entry: [{ reference: `CarePlan/${carePlanId}` }],
      },
      {
        title: "Source Document",
        entry: [{ reference: `DocumentReference/${documentReferenceId}` }],
      },
    ],
  };
}

function provenance(survey: Survey, bundleId: string): FhirResource {
  return {
    resourceType: "Provenance",
    id: `${survey.id}-provenance`,
    target: [{ reference: `Bundle/${bundleId}` }],
    recorded: new Date().toISOString(),
    activity: {
      coding: [
        {
          system: "https://pruitthealth.com/fhir/CodeSystem/conversion",
          code: "fhir-converter-cms2567",
          display: "FHIR Converter Liquid template (CMS-2567 → FHIR R4)",
        },
      ],
    },
    agent: [
      {
        type: { text: "Microsoft FHIR Converter" },
        who: { display: "Azure Health Data Services FHIR Converter" },
      },
    ],
  };
}

export function buildBundle(survey: Survey): FhirBundle {
  const facility = getFacility(survey.facilityId);
  if (!facility) throw new Error(`Facility ${survey.facilityId} not found`);

  const bundleId = `bundle-${survey.id}`;
  const measureReports = survey.deficiencies.map((d, i) => measureReport(survey, facility, d, i));
  const detectedIssues = survey.deficiencies.map((d, i) => detectedIssue(survey, facility, d, i));
  const measures = Array.from(new Set(survey.deficiencies.map((d) => d.ftag))).map(measure);
  const cp = carePlan(survey, facility);
  const docRef = documentReference(survey, facility);
  const bin = binary(survey);
  const surveyorO = surveyorOrg(survey);
  const facO = org(facility);
  const comp = composition(
    survey,
    facility,
    measureReports.map((mr) => mr.id),
    cp.id,
    docRef.id,
  );
  const prov = provenance(survey, bundleId);

  const entries: FhirResource[] = [
    comp,
    facO,
    surveyorO,
    ...measures,
    ...measureReports,
    ...detectedIssues,
    cp,
    docRef,
    bin,
    prov,
  ];

  return {
    resourceType: "Bundle",
    id: bundleId,
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: entries.map((r) => ({
      fullUrl: `urn:uuid:${r.resourceType}-${r.id}`,
      resource: r,
    })),
  };
}
