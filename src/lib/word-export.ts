import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import type { Survey, Facility } from "./types";
import { getFtag } from "./mock-data";

// Brand color (PruittHealth teal) used for headings.
const TEAL = "0E5752";
const BURGUNDY = "7B2D3F";
const GRAY = "6B6F75";

function eyebrow(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        size: 16, // 8pt
        bold: true,
        color: GRAY,
        font: "Aptos",
      }),
    ],
  });
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text,
        size: 44, // 22pt
        bold: false,
        color: TEAL,
        font: "Aptos Display",
      }),
    ],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({
        text,
        size: 28, // 14pt
        bold: false,
        color: TEAL,
        font: "Aptos Display",
      }),
    ],
  });
}

function body(text: string, italic = false, color = "14171C"): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 120, line: 320 },
    children: [
      new TextRun({
        text,
        size: 22, // 11pt
        italics: italic,
        color,
        font: "Aptos",
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 0, after: 80, line: 300 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: "Aptos",
      }),
    ],
  });
}

function numbered(text: string, num: number): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 60, line: 300 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({
        text: `${num}.  `,
        bold: true,
        color: TEAL,
        size: 22,
        font: "Aptos",
      }),
      new TextRun({
        text,
        size: 22,
        font: "Aptos",
      }),
    ],
  });
}

function citation(text: string, exemplarId: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 200, line: 280 },
    indent: { left: 720 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 8, color: "9FB8B0", space: 8 },
    },
    children: [
      new TextRun({
        text: `“${text}”`,
        size: 18, // 9pt
        italics: true,
        color: GRAY,
        font: "Aptos",
      }),
      new TextRun({
        text: `   — ${exemplarId}`,
        size: 16,
        color: "9CA3AF",
        font: "Cascadia Code",
      }),
    ],
  });
}

function rule(): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.DOTTED, size: 6, color: "E5E1D8", space: 4 },
    },
    children: [],
  });
}

function footer(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    children: [
      new TextRun({
        text,
        size: 16,
        italics: true,
        color: GRAY,
        font: "Aptos",
      }),
    ],
  });
}

/**
 * Build a Word .docx representing the drafted Plan of Correction.
 * Mirrors what the production Foundry agent would produce, then a
 * compliance staffer would edit and submit.
 */
export async function pocToDocxBlob(
  survey: Survey,
  facility: Facility,
): Promise<Blob> {
  // Header block ---------------------------------------------------
  const headerLines: Paragraph[] = [
    eyebrow("Plan of Correction"),
    heading1(facility.name),
    body(`${facility.address}`, false, GRAY),
    body(`Provider ID: ${facility.fhirId.split("/")[1]} · ${facility.bu} · ${facility.region}`, false, GRAY),
    rule(),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: "Survey date: ", bold: true, size: 20, font: "Aptos" }),
        new TextRun({ text: new Date(survey.surveyDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), size: 20, font: "Aptos" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: "Surveying agency: ", bold: true, size: 20, font: "Aptos" }),
        new TextRun({ text: survey.surveyorOrg, size: 20, font: "Aptos" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: "Survey type: ", bold: true, size: 20, font: "Aptos" }),
        new TextRun({ text: survey.surveyType === "health-inspection" ? "Health inspection" : "Complaint inspection", size: 20, font: "Aptos" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: "POC due: ", bold: true, size: 20, font: "Aptos" }),
        new TextRun({ text: new Date(survey.pocDueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), size: 20, color: BURGUNDY, font: "Aptos" }),
      ],
    }),
  ];

  // Deficiencies cited ---------------------------------------------
  const deficiencyLines: Paragraph[] = [
    heading2("Deficiencies cited"),
  ];
  for (const d of survey.deficiencies) {
    const tag = getFtag(d.ftag);
    deficiencyLines.push(
      bullet(`${d.ftag} — ${tag?.shortTitle ?? d.ftag} — ${d.severity} (residents affected: ${d.residentsAffected})`),
    );
  }

  // Plan of Correction ---------------------------------------------
  const pocLines: Paragraph[] = [
    heading2("Plan of Correction"),
    body(`${survey.pocActivities.length} corrective activities. Each cites the historical accepted POC the drafting agent used as grounding.`, true, GRAY),
  ];
  for (let i = 0; i < survey.pocActivities.length; i++) {
    const a = survey.pocActivities[i]!;
    pocLines.push(numbered(a.text, i + 1));
    pocLines.push(
      new Paragraph({
        spacing: { before: 20, after: 0 },
        indent: { left: 720 },
        children: [
          new TextRun({
            text: `Target completion: ${a.targetCompletionDate} · cites ${a.citation.exemplarFtag}`,
            size: 18,
            color: GRAY,
            font: "Aptos",
          }),
        ],
      }),
    );
    pocLines.push(citation(a.citation.quote, a.citation.exemplarId));
  }

  // Footer ---------------------------------------------------------
  const footerLines: Paragraph[] = [
    rule(),
    footer(
      "Drafted by the Foundry POC drafting agent · cite-or-refuse grounded against historical accepted POCs · finalized in Microsoft Word.",
    ),
  ];

  const doc = new Document({
    creator: "PruittHealth State Survey Automation (prototype)",
    title: `POC — ${facility.name} — ${survey.surveyDate.slice(0, 10)}`,
    description: "Plan of Correction draft for compliance review.",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children: [...headerLines, ...deficiencyLines, ...pocLines, ...footerLines],
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Convenience: build + trigger download in one call. */
export async function downloadPoc(
  survey: Survey,
  facility: Facility,
): Promise<void> {
  const blob = await pocToDocxBlob(survey, facility);
  const dateStr = survey.surveyDate.slice(0, 10);
  const facilitySlug = facility.id;
  saveAs(blob, `POC-${facilitySlug}-${dateStr}.docx`);
}
