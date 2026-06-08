"use client";

import { useState } from "react";
import { Download, Check, X, FileText, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import {
  SURVEYS_BY_DATE_DESC,
  getFacility,
  getFtag,
  categoryFor,
  citationGroupsForSurvey,
  scopeSeverityBand,
} from "@/lib/mock-data";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { CitationActionGroup } from "@/components/poc/citation-action-group";
import { usePersona, actorLabel } from "@/components/layout/persona-context";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import { downloadPoc } from "@/lib/word-export";
import { CanopyOrnament } from "@/components/decorative/canopy";
import type { Survey } from "@/lib/types";

const PENDING = SURVEYS_BY_DATE_DESC.filter((s) => s.pocStatus !== "POC submitted");

// confirm = gateway (review extraction); working = checklist active; rejected = re-draft.
type Stage = "confirm" | "working" | "rejected";

const GRADE_PILL: Record<string, string> = {
  "immediate-jeopardy": "bg-ph-burgundy text-white",
  "actual-harm": "bg-[var(--sev-actual)] text-white",
  minimal: "bg-ph-amber text-white",
  "self-correct": "bg-ph-primary-soft text-ph-primary",
};

function leadCategories(s: Survey): string {
  const cats = Array.from(new Set(s.deficiencies.map((d) => categoryFor(d.ftag))));
  return cats.slice(0, 2).join(" · ") + (cats.length > 2 ? ` +${cats.length - 2}` : "");
}

export default function PocReviewPage() {
  const { persona } = usePersona();
  const pending = persona.facilityId
    ? PENDING.filter((s) => s.facilityId === persona.facilityId)
    : PENDING;
  const [selectedId, setSelectedId] = useState<string>(PENDING[0]?.id ?? "");
  const [stages, setStages] = useState<Record<string, Stage>>({});
  // Selection falls back to the first in-scope survey when the persona changes.
  const selected = pending.find((s) => s.id === selectedId) ?? pending[0];
  const stageOf = (id: string): Stage => stages[id] ?? "confirm";
  const setStage = (id: string, st: Stage) => setStages((p) => ({ ...p, [id]: st }));

  const workingCount = Object.values(stages).filter((s) => s === "working").length;

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-8 ph-reveal">
        <p className="text-base text-ph-gray-500 max-w-2xl leading-relaxed">
          Two-step review. First confirm we read your CMS-2567 correctly — then the per-citation
          action checklist activates. Nothing is generated until a human consents.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-4 ph-card overflow-hidden self-start">
          <header className="px-5 py-4 border-b border-ph-gray-200">
            <h3 className="text-base tracking-tight">Pending review</h3>
            <p className="text-[11px] text-ph-gray-500 mt-0.5">
              {pending.length} surveys
              {persona.facilityId && <span className="text-ph-primary"> · {persona.facilityLabel}</span>}
              {workingCount > 0 && (
                <span className="text-ph-primary"> · {workingCount} in progress this session</span>
              )}
            </p>
          </header>
          <ul className="divide-y divide-ph-gray-200 max-h-[700px] overflow-y-auto">
            {pending.map((s) => (
              <PocListItem
                key={s.id}
                survey={s}
                selected={s.id === selected?.id}
                stage={stageOf(s.id)}
                onSelect={() => setSelectedId(s.id)}
              />
            ))}
          </ul>
        </aside>

        <section className="col-span-12 md:col-span-8">
          {selected ? (
            <PocDetail
              survey={selected}
              stage={stageOf(selected.id)}
              setStage={(st) => setStage(selected.id, st)}
              actorName={actorLabel(persona)}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  );
}

function PocListItem({
  survey,
  selected,
  stage,
  onSelect,
}: {
  survey: Survey;
  selected: boolean;
  stage: Stage;
  onSelect: () => void;
}) {
  const facility = getFacility(survey.facilityId)!;
  const dueIn = daysUntil(survey.pocDueDate);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left px-5 py-3 hover:bg-ph-gray-50 transition-colors",
          selected && "bg-ph-primary-soft border-l-2 border-ph-burgundy",
        )}
      >
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display text-sm tracking-tight inline-flex items-center gap-1.5">
            {stage === "working" && (
              <Check className="h-3 w-3 text-ph-primary" strokeWidth={2.5} aria-label="In progress" />
            )}
            {stage === "rejected" && (
              <X className="h-3 w-3 text-ph-burgundy" strokeWidth={2.5} aria-label="Rejected" />
            )}
            {facility.name.replace("Pruitthealth ", "")}
          </span>
          <span
            className={cn(
              "text-[10px] font-mono",
              dueIn < 0 && "text-ph-burgundy",
              dueIn >= 0 && dueIn <= 3 && "text-ph-amber",
              dueIn > 3 && "text-ph-gray-400",
            )}
          >
            {dueIn < 0 ? `${Math.abs(dueIn)}d overdue` : `${dueIn}d`}
          </span>
        </div>
        <div className="text-[11px] text-ph-gray-600 mb-1">{leadCategories(survey)}</div>
        <div className="text-[10px] text-ph-gray-400">
          {formatDate(survey.surveyDate)} · {stage === "confirm" ? "awaiting confirmation" : stage === "working" ? "checklist active" : "rejected — re-draft"}
        </div>
      </button>
    </li>
  );
}

function PocDetail({
  survey,
  stage,
  setStage,
  actorName,
}: {
  survey: Survey;
  stage: Stage;
  setStage: (s: Stage) => void;
  actorName: string;
}) {
  const facility = getFacility(survey.facilityId)!;
  const groups = citationGroupsForSurvey(survey);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="ph-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="ph-eyebrow text-ph-gray-400 mb-1">{formatDate(survey.surveyDate)}</div>
            <h2 className="text-2xl tracking-tight font-display">{facility.name}</h2>
            <p className="text-xs text-ph-gray-500 mt-1">{survey.surveyorOrg}</p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-[11px] shrink-0">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1", stage === "confirm" ? "bg-ph-burgundy text-white" : "bg-ph-primary-soft text-ph-primary")}>
              {stage !== "confirm" && <Check className="h-3 w-3" strokeWidth={3} />} 1 · Confirm
            </span>
            <ArrowRight className="h-3 w-3 text-ph-gray-300" />
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1", stage === "working" ? "bg-ph-burgundy text-white" : "bg-ph-gray-100 text-ph-gray-500")}>
              2 · Work the plan
            </span>
          </div>
        </div>
      </div>

      {stage === "rejected" ? (
        <RejectedPanel onReopen={() => setStage("confirm")} />
      ) : stage === "confirm" ? (
        <ConfirmPanel survey={survey} onConfirm={() => setStage("working")} onReject={() => setStage("rejected")} />
      ) : (
        <WorkingPanel survey={survey} facility={facility} groups={groups} actorName={actorName} onReopen={() => setStage("confirm")} />
      )}
    </div>
  );
}

// ── Stage 1 — confirm extraction (the human gateway) ──
function ConfirmPanel({
  survey,
  onConfirm,
  onReject,
}: {
  survey: Survey;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="ph-card overflow-hidden">
      <header className="px-6 py-4 border-b border-ph-gray-200">
        <div className="ph-eyebrow text-ph-gray-400">Step 1 · human gateway</div>
        <h3 className="text-lg tracking-tight">Here's what we read from your CMS-2567</h3>
        <p className="text-[11px] text-ph-gray-500 mt-0.5">
          Confirm the extraction is correct. The action checklist is only generated after you consent.
        </p>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ph-gray-200 bg-ph-gray-50">
            <th className="ph-eyebrow text-left px-6 py-2.5">Clinical category</th>
            <th className="ph-eyebrow text-left px-3 py-2.5">F-tag</th>
            <th className="ph-eyebrow text-center px-3 py-2.5">Grade</th>
            <th className="ph-eyebrow text-left px-3 py-2.5">Severity</th>
            <th className="ph-eyebrow text-left px-6 py-2.5">Residents</th>
          </tr>
        </thead>
        <tbody>
          {survey.deficiencies.map((d, i) => {
            const band = scopeSeverityBand(d.scopeSeverity);
            return (
              <tr key={`${d.ftag}-${i}`} className="border-b border-ph-gray-100 last:border-0">
                <td className="px-6 py-3">
                  <div className="font-medium text-ph-ink">{categoryFor(d.ftag)}</div>
                  <div className="text-[11px] text-ph-gray-500">{getFtag(d.ftag)?.shortTitle}</div>
                </td>
                <td className="px-3 py-3 font-mono text-[11px] text-ph-gray-500">{d.ftag}</td>
                <td className="px-3 py-3 text-center">
                  <span className={cn("inline-block rounded px-1.5 py-0.5 font-display text-sm", GRADE_PILL[band.band])} title={band.action}>
                    {d.scopeSeverity}
                  </span>
                </td>
                <td className="px-3 py-3"><SeverityBadge severity={d.severity} compact /></td>
                <td className="px-6 py-3 text-xs text-ph-gray-600">{d.residentsAffected}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className="px-6 py-4 border-t border-ph-gray-200 bg-ph-gray-50 flex items-center justify-between gap-4">
        <p className="text-[11px] text-ph-gray-500 max-w-md leading-relaxed">
          {survey.deficiencies.length} citations extracted with Document Intelligence confidence scores.
          Wrong? Reject and we re-extract.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ph-gray-200 px-3 py-2 text-xs hover:bg-ph-paper"
          >
            <X className="h-3 w-3" /> Reject
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ph-primary text-white px-4 py-2 text-xs font-medium hover:bg-ph-primary-dark shadow-marquee"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Confirm — this matches our 2567
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Stage 2 — work the per-citation checklists ──
function WorkingPanel({
  survey,
  facility,
  groups,
  actorName,
  onReopen,
}: {
  survey: Survey;
  facility: ReturnType<typeof getFacility>;
  groups: ReturnType<typeof citationGroupsForSurvey>;
  actorName: string;
  onReopen: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="ph-card-marquee px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px] text-ph-gray-600">
          <Sparkles className="h-3.5 w-3.5 text-ph-burgundy" />
          <span>
            Extraction confirmed. Checklists below are grounded in historical accepted POCs across GA/FL —
            the model improves as more are approved.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReopen}
            className="text-[11px] text-ph-gray-500 hover:text-ph-ink"
          >
            Re-open extraction
          </button>
          <button
            type="button"
            onClick={() => survey && facility && downloadPoc(survey, facility)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ph-burgundy text-ph-burgundy px-3 py-1.5 text-xs hover:bg-ph-burgundy-soft"
          >
            <Download className="h-3 w-3" /> Send to Word
          </button>
        </div>
      </div>

      {groups.map((g, i) => (
        <CitationActionGroup key={`${g.ftag}-${i}`} group={g} index={i} actorName={actorName} />
      ))}
    </div>
  );
}

function RejectedPanel({ onReopen }: { onReopen: () => void }) {
  return (
    <div className="ph-card p-8 text-center">
      <X className="h-8 w-8 text-ph-burgundy mx-auto mb-3" strokeWidth={1.6} />
      <h3 className="text-base tracking-tight mb-1">Sent back for re-extraction</h3>
      <p className="text-sm text-ph-gray-500 mb-4 max-w-sm mx-auto">
        The pipeline will re-run Document Intelligence on the source PDF and re-draft.
      </p>
      <button type="button" onClick={onReopen} className="text-xs text-ph-primary hover:text-ph-primary-dark">
        Re-open extraction
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ph-card p-12 text-center relative overflow-hidden">
      <CanopyOrnament className="absolute -top-8 -right-10 h-48 w-48 text-ph-primary opacity-[0.06] pointer-events-none" />
      <FileText className="h-10 w-10 text-ph-gray-400 mx-auto mb-4 relative z-10" strokeWidth={1.4} />
      <h3 className="text-lg mb-2 tracking-tight relative z-10">No drafts pending review</h3>
      <p className="text-sm text-ph-gray-500 relative z-10">All POCs are submitted.</p>
    </div>
  );
}
