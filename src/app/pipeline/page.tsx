"use client";

import { useMemo, useState } from "react";
import { Play, RotateCcw, FileText, Download, ChevronDown } from "lucide-react";
import { PipelineStepper, type Step } from "@/components/pipeline/pipeline-stepper";
import { FhirTreeView } from "@/components/fhir/fhir-tree-view";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { SURVEYS, getFacility, getFtag, CONFIDENCE_BY_FTAG } from "@/lib/mock-data";
import { passagesFor, passageLabel } from "@/lib/mock-narratives";
import { buildBundle } from "@/lib/mock-fhir";
import { downloadPoc } from "@/lib/word-export";
import { cn, formatDate } from "@/lib/utils";
import type { Survey, Facility } from "@/lib/types";
import type { FhirBundle } from "@/lib/mock-fhir";

// Surveys with a real source PDF — these are the only ones the pipeline
// "ingestion" can plausibly run against. The picker exposes them.
const PIPELINE_OPTIONS = SURVEYS.filter((s) => s.pdfPath !== null);

const STEP_LABELS: Pick<Step, "num" | "label" | "description">[] = [
  { num: 1, label: "Extract", description: "Document Intelligence — custom CMS-2567 model" },
  { num: 2, label: "Reason", description: "Content Understanding — canonicalize" },
  { num: 3, label: "FHIR", description: "Bundle into AHDS R4 resources" },
  { num: 4, label: "Draft POC", description: "Foundry agent — RAG + cite" },
];

export default function PipelinePage() {
  const [surveyId, setSurveyId] = useState<string>(
    PIPELINE_OPTIONS.find((s) => s.facilityId === "fleming-island")?.id ??
      PIPELINE_OPTIONS[0]?.id ??
      SURVEYS[0]!.id,
  );
  const survey = useMemo(() => SURVEYS.find((s) => s.id === surveyId)!, [surveyId]);
  const facility = useMemo(() => getFacility(survey.facilityId)!, [survey]);
  const bundle = useMemo<FhirBundle>(() => buildBundle(survey), [survey]);

  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  // 0 = idle, 1 = extracting, 2 = reasoning, 3 = building FHIR, 4 = drafting POC, 5 = done

  function run() {
    setPhase(1);
    setTimeout(() => setPhase(2), 1700);
    setTimeout(() => setPhase(3), 3300);
    setTimeout(() => setPhase(4), 5300);
    setTimeout(() => setPhase(5), 7400);
  }

  function reset() {
    setPhase(0);
  }

  function pickSurvey(id: string) {
    setSurveyId(id);
    setPhase(0);
  }

  const steps: Step[] = STEP_LABELS.map((s) => ({
    ...s,
    state:
      phase === 0
        ? s.num === 1
          ? "pending"
          : "pending"
        : phase >= s.num + 1
          ? "complete"
          : phase === s.num
            ? "active"
            : "pending",
  }));

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      {/* Banner */}
      <div className="mb-6 flex items-baseline justify-between gap-6 ph-reveal">
        <div>
          <div className="ph-eyebrow text-ph-burgundy mb-1">Live demo</div>
          <h2 className="text-2xl tracking-tight">
            {facility.name} — {formatDate(survey.surveyDate)}
          </h2>
          <p className="text-sm text-ph-gray-500 mt-1 max-w-3xl">
            Mock progression. In production: Document Intelligence + Content Understanding +
            FHIR Converter (Liquid templates) + Azure Health Data Services + Microsoft Foundry agent.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Survey picker */}
          {PIPELINE_OPTIONS.length > 1 && phase === 0 && (
            <SurveyPicker
              options={PIPELINE_OPTIONS}
              value={surveyId}
              onChange={pickSurvey}
            />
          )}
          {phase === 0 && (
            <button
              type="button"
              onClick={run}
              className="inline-flex items-center gap-2 rounded-lg bg-ph-burgundy px-5 py-2.5 text-sm font-medium text-white hover:bg-ph-burgundy/90 transition-colors shadow-marquee"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" /> Run pipeline
            </button>
          )}
          {phase > 0 && phase < 5 && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg border border-ph-gray-200 px-5 py-2.5 text-sm text-ph-gray-500"
            >
              <span className="h-2 w-2 rounded-full bg-ph-burgundy ph-pulse" /> Processing…
            </button>
          )}
          {phase === 5 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-ph-gray-200 px-5 py-2.5 text-sm hover:bg-ph-gray-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Run again
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <PipelineStepper steps={steps} />
      </div>

      {/* Body */}
      {phase === 0 ? (
        <IdleState />
      ) : (
        <div className="space-y-6">
          {phase >= 1 && <Step1Extract delay={0} survey={survey} facility={facility} />}
          {phase >= 2 && <Step2Reason delay={300} survey={survey} />}
          {phase >= 3 && <Step3Fhir delay={300} bundle={bundle} />}
          {phase >= 4 && (
            <Step4Poc
              delay={300}
              done={phase === 5}
              survey={survey}
              facility={facility}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SurveyPicker({
  options,
  value,
  onChange,
}: {
  options: Survey[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer rounded-lg border border-ph-gray-200 bg-ph-paper px-3 py-2.5 pr-9 text-xs font-mono hover:border-ph-burgundy transition-colors focus:outline-none focus:ring-2 focus:ring-ph-burgundy/30"
        aria-label="Select survey to ingest"
      >
        {options.map((s) => {
          const f = getFacility(s.facilityId);
          return (
            <option key={s.id} value={s.id}>
              {f?.name.replace("Pruitthealth ", "")} · {s.surveyDate.slice(0, 10)}
            </option>
          );
        })}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ph-gray-400 pointer-events-none" />
    </div>
  );
}

function IdleState() {
  return (
    <div className="ph-card p-12 text-center">
      <FileText className="h-10 w-10 text-ph-gray-400 mx-auto mb-4" strokeWidth={1.4} />
      <h3 className="text-xl mb-2 tracking-tight">Ready to ingest</h3>
      <p className="text-sm text-ph-gray-500 max-w-md mx-auto leading-relaxed">
        Press <span className="text-ph-ink font-medium">Run pipeline</span> to walk through a real
        PruittHealth CMS-2567 survey end-to-end — extraction, reasoning, FHIR persistence, and
        AI-drafted Plan-of-Correction.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 1 — Extraction
// ─────────────────────────────────────────────────────────────────────
function Step1Extract({
  delay,
  survey,
  facility,
}: {
  delay: number;
  survey: Survey;
  facility: Facility;
}) {
  return (
    <section className="ph-card overflow-hidden ph-reveal" style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <div className="ph-eyebrow text-ph-gray-400">Step 1</div>
          <h3 className="text-lg tracking-tight">Document Intelligence — layout extraction</h3>
        </div>
        <span className="text-[11px] text-ph-gray-400 font-mono">custom-cms2567 · 1.4s</span>
      </header>
      <div className="grid grid-cols-12 gap-6 px-6 py-5">
        <div className="col-span-12 md:col-span-4">
          <div className="ph-eyebrow text-ph-gray-400 mb-1">Form header</div>
          <table className="text-xs text-ph-gray-700 w-full">
            <tbody>
              <tr>
                <td className="py-1 text-ph-gray-500">X1 Provider ID</td>
                <td className="py-1 font-mono text-right">{facility.fhirId.split("/")[1]}</td>
              </tr>
              <tr>
                <td className="py-1 text-ph-gray-500">X3 Survey date</td>
                <td className="py-1 font-mono text-right">{survey.surveyDate.slice(0, 10)}</td>
              </tr>
              <tr>
                <td className="py-1 text-ph-gray-500">Facility</td>
                <td className="py-1 text-right">{facility.name}</td>
              </tr>
              <tr>
                <td className="py-1 text-ph-gray-500">Address</td>
                <td className="py-1 text-right text-[10px]">{facility.address}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-span-12 md:col-span-8">
          <div className="ph-eyebrow text-ph-gray-400 mb-1">Per-deficiency rows</div>
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-ph-gray-200">
                <th className="text-left py-1.5 font-medium text-ph-gray-500">F-tag</th>
                <th className="text-left py-1.5 font-medium text-ph-gray-500">Severity (raw)</th>
                <th className="text-left py-1.5 font-medium text-ph-gray-500">Affected</th>
                <th className="text-right py-1.5 font-medium text-ph-gray-500">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {survey.deficiencies.map((d, i) => (
                <tr key={`${d.ftag}-${i}`} className="border-b border-ph-gray-100">
                  <td className="py-2 font-mono">{d.ftag}</td>
                  <td className="py-2 text-ph-gray-700">{d.severity}</td>
                  <td className="py-2 text-ph-gray-700">{d.residentsAffected}</td>
                  <td className="py-2 text-right font-mono text-ph-primary">
                    {(CONFIDENCE_BY_FTAG[d.ftag] ?? 0.95).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 2 — Reason / Content Understanding
// ─────────────────────────────────────────────────────────────────────
function Step2Reason({ delay, survey }: { delay: number; survey: Survey }) {
  return (
    <section className="ph-card overflow-hidden ph-reveal" style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <div className="ph-eyebrow text-ph-gray-400">Step 2</div>
          <h3 className="text-lg tracking-tight">Content Understanding — semantic reasoning</h3>
        </div>
        <span className="text-[11px] text-ph-gray-400 font-mono">Foundry Tools · 0.9s</span>
      </header>
      <div className="px-6 py-5 grid grid-cols-12 gap-6">
        {survey.deficiencies.map((d, i) => {
          const t = getFtag(d.ftag);
          const passages = passagesFor(d.ftag);
          return (
            <div
              key={`${d.ftag}-${i}`}
              className="col-span-12 md:col-span-6 rounded border border-ph-gray-200 p-4 bg-ph-gray-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs text-ph-burgundy">{d.ftag}</span>
                <SeverityBadge severity={d.severity} compact />
                <span className="text-[10px] text-ph-gray-400">· residents: {d.residentsAffected}</span>
              </div>
              <div className="text-[11px] text-ph-gray-700 mb-3 leading-relaxed">{t?.title}</div>
              <div className="ph-eyebrow text-ph-gray-400 mb-1">Narrative passages</div>
              <ul className="text-[11px] text-ph-gray-500 leading-relaxed space-y-1.5">
                {passages.map((p, j) => (
                  <li key={j} className="flex gap-1.5">
                    <span className="font-mono text-[10px] text-ph-burgundy shrink-0 mt-0.5">
                      {passageLabel(p.type)}
                    </span>
                    <span className="text-ph-gray-700">{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 3 — FHIR Bundle (the marquee)
// ─────────────────────────────────────────────────────────────────────
function Step3Fhir({ delay, bundle }: { delay: number; bundle: FhirBundle }) {
  return (
    <section className="ph-card-marquee overflow-hidden ph-reveal" style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <div className="ph-eyebrow text-ph-burgundy">Step 3 · marquee</div>
          <h3 className="text-lg tracking-tight">
            FHIR R4 Bundle — Composition + MeasureReport + CarePlan + Binary
          </h3>
          <p className="text-xs text-ph-gray-500 mt-1 max-w-2xl">
            HL7-standard. CMS NHSN dQM- and Da Vinci DEQM-aligned. Persisted in production to
            Azure Health Data Services with SMART-on-FHIR scopes per facility.
          </p>
        </div>
        <span className="text-[11px] text-ph-gray-400 font-mono">{bundle.entry.length} resources</span>
      </header>
      <div className="p-6">
        <FhirTreeView bundle={bundle} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 4 — Drafted POC
// ─────────────────────────────────────────────────────────────────────
function Step4Poc({
  delay,
  done,
  survey,
  facility,
}: {
  delay: number;
  done: boolean;
  survey: Survey;
  facility: Facility;
}) {
  return (
    <section className="ph-card overflow-hidden ph-reveal" style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <div className="ph-eyebrow text-ph-gray-400">Step 4</div>
          <h3 className="text-lg tracking-tight">Foundry POC drafting agent</h3>
          <p className="text-[11px] text-ph-gray-500 mt-0.5">
            RAG over historical accepted POCs. Cite-or-refuse grounding. Refuses if no relevant exemplar.
          </p>
        </div>
        {done && (
          <button
            type="button"
            onClick={() => downloadPoc(survey, facility)}
            className="inline-flex items-center gap-2 rounded-lg border border-ph-primary text-ph-primary px-4 py-2 text-xs font-medium hover:bg-ph-primary-soft transition-colors"
          >
            <Download className="h-3 w-3" /> Export to Word
          </button>
        )}
      </header>
      <ol className="divide-y divide-ph-gray-200">
        {survey.pocActivities.map((a, i) => (
          <li
            key={a.id}
            className="px-6 py-5 ph-reveal"
            style={{ animationDelay: `${delay + i * 200}ms` }}
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-display font-medium shrink-0 mt-0.5",
                  "bg-ph-primary-soft text-ph-primary",
                )}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm text-ph-ink leading-relaxed">{a.text}</div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ph-gray-500">
                  <span>Target: {a.targetCompletionDate}</span>
                  <span className="text-ph-gray-300">·</span>
                  <span className="font-mono text-ph-burgundy">cites {a.citation.exemplarFtag}</span>
                </div>
                <blockquote className="mt-2 border-l-2 border-ph-sage/50 pl-3 text-[11px] italic text-ph-gray-500 leading-relaxed">
                  &quot;{a.citation.quote}&quot;
                  <span className="block not-italic font-mono text-[10px] text-ph-gray-400 mt-1">
                    — {a.citation.exemplarId}
                  </span>
                </blockquote>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
