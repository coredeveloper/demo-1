"use client";

import { useState } from "react";
import { FileText, Network, ClipboardCheck, FileType2 } from "lucide-react";
import { FhirTreeView } from "@/components/fhir/fhir-tree-view";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { cn } from "@/lib/utils";
import type { Survey, Facility } from "@/lib/types";
import type { FhirBundle } from "@/lib/mock-fhir";
import { getFtag } from "@/lib/mock-data";

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
        return (
          <article
            key={`${d.ftag}-${i}`}
            className="ph-card p-5 ph-reveal"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-mono text-sm text-ph-burgundy">{d.ftag}</span>
              <SeverityBadge severity={d.severity} compact />
            </div>
            <h4 className="text-sm font-medium text-ph-ink mb-1 leading-snug">
              {ftag?.shortTitle ?? d.ftag}
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
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs text-ph-gray-500 max-w-2xl">
          {survey.pocActivities.length} corrective activities. Each cites a historical accepted
          POC retrieved by the Foundry agent for the same F-tag.
        </p>
      </div>
      <ol className="ph-card divide-y divide-ph-gray-200">
        {survey.pocActivities.map((a, i) => (
          <li key={a.id} className="px-6 py-4">
            <div className="flex items-start gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ph-primary-soft text-ph-primary text-[11px] font-display font-medium shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-ph-ink leading-relaxed">{a.text}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ph-gray-500">
                  <span>Target: {a.targetCompletionDate}</span>
                  <span className="text-ph-gray-300">·</span>
                  <span className="font-mono text-ph-burgundy">cites {a.citation.exemplarFtag}</span>
                </div>
                <blockquote className="mt-2 border-l-2 border-ph-sage/50 pl-3 text-[11px] italic text-ph-gray-500 leading-relaxed">
                  &ldquo;{a.citation.quote}&rdquo;
                  <span className="block not-italic font-mono text-[10px] text-ph-gray-400 mt-1">
                    — {a.citation.exemplarId}
                  </span>
                </blockquote>
              </div>
            </div>
          </li>
        ))}
      </ol>
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
      <iframe
        src={survey.pdfPath}
        title={`CMS-2567 — ${facility.name}`}
        className="w-full h-[820px] bg-ph-gray-100"
      />
    </div>
  );
}
