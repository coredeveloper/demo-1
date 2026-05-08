"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Link2 } from "lucide-react";
import type { FhirBundle, FhirResource } from "@/lib/mock-fhir";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  Composition: "bg-ph-primary text-white",
  Organization: "bg-ph-sage text-ph-ink",
  Measure: "bg-ph-gray-700 text-white",
  MeasureReport: "bg-ph-burgundy text-white",
  CarePlan: "bg-ph-primary-dark text-white",
  Binary: "bg-ph-gray-400 text-white",
  DocumentReference: "bg-ph-amber text-white",
  Provenance: "bg-ph-gray-500 text-white",
  DetectedIssue: "bg-ph-burgundy text-white opacity-70",
};

function ResourceBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium",
        TYPE_COLORS[type] ?? "bg-ph-gray-100 text-ph-gray-700",
      )}
    >
      {type}
    </span>
  );
}

export function FhirTreeView({ bundle }: { bundle: FhirBundle }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    bundle.entry[0]?.resource.id ?? null,
  );
  const selected = useMemo(
    () => bundle.entry.find((e) => e.resource.id === selectedId)?.resource,
    [bundle, selectedId],
  );

  return (
    <div className="grid grid-cols-12 border border-ph-gray-200 rounded-lg overflow-hidden bg-ph-paper">
      {/* Tree */}
      <div className="col-span-12 lg:col-span-5 border-r border-ph-gray-200 bg-ph-gray-50">
        <div className="px-4 py-3 border-b border-ph-gray-200 flex items-baseline justify-between">
          <div>
            <div className="ph-eyebrow text-ph-burgundy">Bundle</div>
            <div className="text-sm text-ph-gray-700 font-mono mt-0.5">{bundle.id}</div>
          </div>
          <span className="text-[11px] text-ph-gray-500">
            {bundle.entry.length} entries
          </span>
        </div>
        <ul className="py-2 max-h-[640px] overflow-y-auto">
          {bundle.entry.map((e) => (
            <ResourceTreeNode
              key={e.resource.id}
              resource={e.resource}
              isSelected={e.resource.id === selectedId}
              onSelect={(id) => setSelectedId(id)}
              bundle={bundle}
            />
          ))}
        </ul>
      </div>

      {/* JSON pane */}
      <div className="col-span-12 lg:col-span-7 bg-ph-paper">
        {selected ? (
          <>
            <div className="px-5 py-3 border-b border-ph-gray-200 flex items-center gap-2 bg-ph-gray-50">
              <ResourceBadge type={selected.resourceType} />
              <span className="font-mono text-xs text-ph-gray-700 truncate">{selected.id}</span>
            </div>
            <pre className="p-5 text-[12px] leading-relaxed font-mono overflow-auto max-h-[640px]">
              {renderJson(selected, bundle, setSelectedId)}
            </pre>
          </>
        ) : (
          <div className="p-10 text-center text-ph-gray-400 text-sm">Select a resource</div>
        )}
      </div>
    </div>
  );
}

function ResourceTreeNode({
  resource,
  isSelected,
  onSelect,
}: {
  resource: FhirResource;
  isSelected: boolean;
  onSelect: (id: string) => void;
  bundle: FhirBundle;
}) {
  const [expanded, setExpanded] = useState(true);
  const summary = summarize(resource);

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onSelect(resource.id);
          setExpanded((e) => !e);
        }}
        className={cn(
          "group w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-ph-paper transition-colors",
          isSelected && "bg-ph-paper border-l-2 border-ph-burgundy",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-ph-gray-400 mt-1 shrink-0" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3 w-3 text-ph-gray-400 mt-1 shrink-0" strokeWidth={2} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <ResourceBadge type={resource.resourceType} />
            <span className="font-mono text-[10px] text-ph-gray-400 truncate">
              {resource.id}
            </span>
          </div>
          {summary && (
            <div className="text-[11px] text-ph-gray-700 leading-snug truncate">{summary}</div>
          )}
        </div>
      </button>
    </li>
  );
}

// Summarize a resource to show under the tree node
function summarize(r: FhirResource): string | null {
  switch (r.resourceType) {
    case "Composition":
      return (r.title as string) ?? null;
    case "Organization":
      return (r.name as string) ?? null;
    case "Measure":
      return (r.title as string) ?? (r.name as string);
    case "MeasureReport": {
      const m = (r.measure as string) ?? "";
      const subj = (r.subject as { display?: string } | undefined)?.display ?? "";
      return `${m} → ${subj}`;
    }
    case "CarePlan":
      return (r.title as string) ?? null;
    case "DocumentReference":
      return (
        ((r.content as { attachment?: { title?: string } }[] | undefined)?.[0]?.attachment?.title) ?? null
      );
    case "Binary":
      return r.contentType as string;
    case "Provenance":
      return "Conversion provenance";
    case "DetectedIssue":
      return ((r.severity as string) ?? "") + " · " + ((r.detail as string) ?? "").slice(0, 50);
    default:
      return null;
  }
}

// JSON renderer with clickable references
function renderJson(
  obj: unknown,
  bundle: FhirBundle,
  onClickRef: (id: string) => void,
  indent = 0,
): React.ReactNode {
  if (obj === null) return <span className="ph-json-null">null</span>;
  if (typeof obj === "string") {
    // Detect FHIR reference strings like "Organization/123" and make them clickable
    if (/^[A-Z][a-zA-Z]+\/[\w\-]+$/.test(obj)) {
      const id = obj.split("/")[1]!;
      const found = bundle.entry.some((e) => e.resource.id === id);
      if (found) {
        return (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              onClickRef(id);
            }}
            className="ph-json-string underline decoration-dotted underline-offset-2 hover:text-ph-burgundy inline-flex items-center gap-1"
          >
            <Link2 className="h-2.5 w-2.5" />
            &quot;{obj}&quot;
          </button>
        );
      }
    }
    return <span className="ph-json-string">&quot;{obj}&quot;</span>;
  }
  if (typeof obj === "number") return <span className="ph-json-number">{obj}</span>;
  if (typeof obj === "boolean") return <span className="ph-json-boolean">{String(obj)}</span>;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return <span>[]</span>;
    return (
      <span>
        [{"\n"}
        {obj.map((v, i) => (
          <span key={i}>
            {"  ".repeat(indent + 1)}
            {renderJson(v, bundle, onClickRef, indent + 1)}
            {i < obj.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"  ".repeat(indent)}]
      </span>
    );
  }

  if (typeof obj === "object" && obj !== null) {
    const entries = Object.entries(obj);
    if (entries.length === 0) return <span>{"{}"}</span>;
    return (
      <span>
        {"{"}
        {"\n"}
        {entries.map(([k, v], i) => (
          <span key={k}>
            {"  ".repeat(indent + 1)}
            <span className="ph-json-key">&quot;{k}&quot;</span>: {renderJson(v, bundle, onClickRef, indent + 1)}
            {i < entries.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"  ".repeat(indent)}
        {"}"}
      </span>
    );
  }
  return null;
}
