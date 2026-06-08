"use client";

import { useState } from "react";
import { FileText, Network, ClipboardCheck, FileType2 } from "lucide-react";
import { FhirTreeView } from "@/components/fhir/fhir-tree-view";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { CitationActionGroup } from "@/components/poc/citation-action-group";
import { cn } from "@/lib/utils";
import type { Survey, Facility } from "@/lib/types";
import type { FhirBundle } from "@/lib/mock-fhir";
import { getFtag, categoryFor, scopeSeverityBand, citationGroupsForSurvey } from "@/lib/mock-data";

const GRADE_PILL: Record<string, string> = {
  "immediate-jeopardy": "bg-ph-burgundy text-white",
  "actual-harm": "bg-[var(--sev-actual)] text-white",
  minimal: "bg-ph-amber text-white",
  "self-correct": "bg-ph-primary-soft text-ph-primary",
};

type Tab = "summary" | "fhir" | "poc" | "pdf";

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "summary", label: "Summary", icon: FileText },
  { key: "fhir", label: "FHIR Bundle", icon: Network },
  { key: "poc", label: "Drafted POC", icon: ClipboardCheck },
  { key: "pdf", label: "Original PDF", icon: FileType2 },
];

export function SurveyTabbedView({
  survey,
  facility,
  bundle,
}: {
  survey: Survey;
  facility: Facility;
  bundle: FhirBundle;
}) {
  const [tab, setTab] = useState<Tab>("summary");

  return (
    <div>
      {/* Tab nav */}
      <nav className="flex border-b border-ph-gray-200 mb-6 -mt-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative inline-flex items-center gap-2 px-5 py-3 text-sm transition-colors",
                active
                  ? "text-ph-burgundy"
                  : "text-ph-gray-500 hover:text-ph-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span>{t.label}</span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ph-burgundy" />
              )}
              {t.key === "fhir" && (
                <span className="ml-1 inline-flex items-center rounded bg-ph-burgundy-soft text-ph-burgundy px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide">
                  Marquee
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {tab === "summary" && <SummaryPanel survey={survey} />}
      {tab === "fhir" && <FhirPanel bundle={bundle} />}
      {tab === "poc" && <PocPanel survey={survey} />}
      {tab === "pdf" && <PdfPanel survey={survey} facility={facility} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function SummaryPanel({ survey }: { survey: Survey }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {survey.deficiencies.map((d, i) => {
        const ftag = getFtag(d.ftag);
        const band = scopeSeverityBand(d.scopeSeverity);
        return (
          <article
            key={`${d.ftag}-${i}`}
            className="ph-card p-5 ph-reveal"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="ph-eyebrow text-ph-gray-400">{categoryFor(d.ftag)}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SeverityBadge severity={d.severity} compact />
                <span className={cn("inline-block rounded px-1.5 py-0.5 font-display text-xs", GRADE_PILL[band.band])} title={band.action}>
                  {d.scopeSeverity}
                </span>
              </div>
            </div>
            <h4 className="text-sm font-medium text-ph-ink mb-1 leading-snug">
              {ftag?.shortTitle ?? d.ftag}
              <span className="ml-1.5 font-mono text-[11px] text-ph-gray-400">{d.ftag}</span>
            </h4>
            <p className="text-[11px] text-ph-gray-500 mb-3 leading-relaxed">{ftag?.title}</p>
            <div className="ph-eyebrow text-ph-gray-400 mb-1">Residents affected</div>
            <div className="text-xs text-ph-ink mb-3">{d.residentsAffected}</div>
            <div className="ph-eyebrow text-ph-gray-400 mb-1">Narrative</div>
            <p className="text-[11px] text-ph-gray-700 leading-relaxed line-clamp-5">{d.narrative}</p>
          </article>
        );
      })}
    </div>
  );
}

function FhirPanel({ bundle }: { bundle: FhirBundle }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs text-ph-gray-500 max-w-2xl">
          HL7-standard. CMS NHSN dQM- and Da Vinci DEQM-aligned. Click any{" "}
          <code className="font-mono text-[10px] mx-0.5 px-1 py-0.5 rounded bg-ph-gray-100">
            reference
          </code>{" "}
          string in the JSON to navigate to the linked resource.
        </p>
        <span className="text-[11px] text-ph-gray-400 font-mono shrink-0">
          {bundle.entry.length} resources
        </span>
      </div>
      <FhirTreeView bundle={bundle} />
    </div>
  );
}

function PocPanel({ survey }: { survey: Survey }) {
  const groups = citationGroupsForSurvey(survey);
  return (
    <div className="space-y-5">
      <p className="text-xs text-ph-gray-500 max-w-2xl">
        {survey.pocActivities.length} corrective activities, grouped by citation so each clinical
        owner works only their items. Each set is grounded in historical accepted POCs for the same F-tag.
      </p>
      {groups.map((g, i) => (
        <CitationActionGroup key={`${g.ftag}-${i}`} group={g} index={i} />
      ))}
    </div>
  );
}

function PdfPanel({ survey, facility }: { survey: Survey; facility: Facility }) {
  if (!survey.pdfPath) {
    return (
      <div className="ph-card p-12 text-center">
        <FileType2
          className="h-10 w-10 text-ph-gray-300 mx-auto mb-4"
          strokeWidth={1.4}
        />
        <h3 className="text-base tracking-tight mb-2">Synthetic survey · no source PDF</h3>
        <p className="text-sm text-ph-gray-500 max-w-md mx-auto leading-relaxed">
          This record was generated from the deterministic mock seed. The original CMS-2567 PDF
          would be embedded here in production from the SharePoint drop folder.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded bg-ph-burgundy-soft text-ph-burgundy px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider">
          Synthetic record · {survey.id}
        </div>
      </div>
    );
  }

  return (
    <div className="ph-card overflow-hidden">
      <div className="px-5 py-3 border-b border-ph-gray-200 flex items-baseline justify-between bg-ph-gray-50">
        <div>
          <div className="ph-eyebrow text-ph-gray-400">Source CMS-2567 PDF</div>
          <div className="text-xs text-ph-gray-700 mt-0.5 font-mono">{survey.pdfPath}</div>
        </div>
        <a
          href={survey.pdfPath}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ph-primary hover:text-ph-primary-dark"
        >
          Open in new tab ↗
        </a>
      </div>
      {/* `<object>` lets the browser render the PDF natively AND shows the
          fallback children if the browser blocks inline PDF rendering
          (Chrome corporate policy, mobile Safari, etc). */}
      <object
        data={survey.pdfPath}
        type="application/pdf"
        className="block w-full h-[820px] bg-ph-gray-100"
        aria-label={`CMS-2567 — ${facility.name}`}
      >
        <div className="p-12 text-center">
          <FileType2 className="h-10 w-10 text-ph-gray-400 mx-auto mb-4" strokeWidth={1.4} />
          <h3 className="text-base tracking-tight mb-2">Inline PDF blocked by your browser</h3>
          <p className="text-sm text-ph-gray-500 mb-4 max-w-md mx-auto">
            Some browsers (and corporate Chrome profiles) block inline PDF embedding. The source
            document is still available below.
          </p>
          <a
            href={survey.pdfPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ph-primary text-ph-primary px-4 py-2 text-xs font-medium hover:bg-ph-primary-soft transition-colors"
          >
            Open CMS-2567 in new tab ↗
          </a>
        </div>
      </object>
    </div>
  );
}
