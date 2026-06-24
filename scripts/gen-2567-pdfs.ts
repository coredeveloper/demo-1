/*
 * Generate synthetic CMS-2567 (Statement of Deficiencies) PDFs from the
 * prototype's mock survey data — for loading into the SharePoint knowledge
 * library that grounds the Teams Copilot agent (demo/03-teams-copilot-agent).
 *
 * One PDF per survey, foldered by state (FL / GA). Output: scripts/out/2567/.
 * Run:  npm run gen:pdfs
 *
 * Reusing the same SURVEYS the web prototype renders keeps the Teams agent and
 * the dashboard telling the identical story. Synthetic only — no PHI.
 */
import { mkdirSync, rmSync, existsSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import {
  SURVEYS,
  getFacility,
  getFtag,
  categoryFor,
  scopeSeverityBand,
} from "../src/lib/mock-data";
import { formatDate } from "../src/lib/utils";
import type { Survey } from "../src/lib/types";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out", "2567");

const TEAL = "#0E5752";
const BURGUNDY = "#7B2D3F";
const INK = "#14171C";
const GRAY = "#6B6F75";
const RULE = "#E5E1D8";

type Doc = PDFKit.PDFDocument;

function slug(name: string): string {
  return name
    .replace("Pruitthealth ", "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function rule(doc: Doc, color = TEAL, width = 0.8) {
  const y = doc.y + 2;
  doc
    .save()
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke()
    .restore();
  doc.moveDown(0.5);
}

function field(doc: Doc, label: string, value: string) {
  doc.font("Helvetica-Bold").fillColor(GRAY).fontSize(7.5).text(label.toUpperCase());
  doc.font("Helvetica").fillColor(INK).fontSize(10).text(value);
  doc.moveDown(0.25);
}

function genOne(survey: Survey): Promise<string> {
  const facility = getFacility(survey.facilityId)!;
  const dir = join(OUT, facility.state);
  mkdirSync(dir, { recursive: true });
  const filename = `2567_${slug(facility.name)}_${survey.surveyDate.slice(0, 10)}.pdf`;
  const path = join(dir, filename);

  const doc = new PDFDocument({ size: "LETTER", margin: 54, info: { Title: `CMS-2567 — ${facility.name} — ${survey.surveyDate.slice(0, 10)}` } });
  const stream = createWriteStream(path);
  doc.pipe(stream);

  // ── Header ──
  doc.font("Helvetica-Bold").fillColor(INK).fontSize(12).text("DEPARTMENT OF HEALTH & HUMAN SERVICES");
  doc.font("Helvetica").fillColor(GRAY).fontSize(9).text("Centers for Medicare & Medicaid Services");
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fillColor(TEAL).fontSize(16).text("Statement of Deficiencies (CMS-2567)");
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fillColor(BURGUNDY).fontSize(8).text("SYNTHETIC — GENERATED FOR DEMONSTRATION. NOT A REAL SURVEY. NO PHI.");
  doc.moveDown(0.4);
  rule(doc);

  // ── Facility / survey identification ──
  field(doc, "Provider / CCN", facility.fhirId.split("/")[1] ?? facility.fhirId);
  field(doc, "Facility", facility.name);
  field(doc, "Address", facility.address);
  field(doc, "Survey date", formatDate(survey.surveyDate));
  field(doc, "Survey type", survey.surveyType === "health-inspection" ? "Health inspection" : "Complaint inspection");
  field(doc, "Surveyed by", survey.surveyorOrg);
  field(doc, "Worst severity", survey.worstSeverity);
  doc.moveDown(0.3);
  rule(doc);

  // ── Deficiencies ──
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fillColor(INK).fontSize(12).text(`Deficiencies cited (${survey.deficiencies.length})`);
  doc.moveDown(0.4);

  survey.deficiencies.forEach((d, i) => {
    const ft = getFtag(d.ftag);
    const band = scopeSeverityBand(d.scopeSeverity);
    doc.font("Helvetica-Bold").fillColor(BURGUNDY).fontSize(11).text(`${d.ftag} — ${ft?.shortTitle ?? d.ftag}`);
    doc.font("Helvetica").fillColor(GRAY).fontSize(8.5).text(
      `Clinical area: ${categoryFor(d.ftag)}    |    Scope-severity grade: ${d.scopeSeverity} (${band.label})    |    Severity: ${d.severity}    |    Residents affected: ${d.residentsAffected}`,
    );
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fillColor(INK).fontSize(9).text("Surveyor findings");
    doc.font("Helvetica").fillColor(INK).fontSize(10).text(d.narrative, { align: "left" });
    doc.moveDown(0.5);
    if (i < survey.deficiencies.length - 1) {
      rule(doc, RULE, 0.5);
      doc.moveDown(0.2);
    }
  });

  // ── Footer ──
  doc.moveDown(0.4);
  rule(doc);
  doc.font("Helvetica").fillColor(GRAY).fontSize(8).text(
    `Synthetic record · ${survey.id} · POC status: ${survey.pocStatus} · POC due ${survey.pocDueDate.slice(0, 10)}`,
  );

  doc.end();
  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(path));
    stream.on("error", reject);
  });
}

async function main() {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const byState: Record<string, number> = {};
  for (const survey of SURVEYS) {
    await genOne(survey);
    const st = getFacility(survey.facilityId)!.state;
    byState[st] = (byState[st] ?? 0) + 1;
  }

  const total = SURVEYS.length;
  console.log(`\n✓ Generated ${total} synthetic CMS-2567 PDFs`);
  for (const [st, n] of Object.entries(byState)) console.log(`   ${st}: ${n}`);
  console.log(`\nOutput: ${OUT}`);
  console.log("Next: upload each state folder into the matching SharePoint region folder.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
