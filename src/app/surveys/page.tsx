"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { Lock } from "lucide-react";
import { SURVEYS_BY_DATE_DESC, getFacility, FACILITIES, FTAGS } from "@/lib/mock-data";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { usePersona } from "@/components/layout/persona-context";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open only" },
  { value: "submitted", label: "Submitted only" },
] as const;

const SEVERITY_OPTIONS: { value: Severity | "all"; label: string }[] = [
  { value: "all", label: "All severity" },
  { value: "Immediate jeopardy", label: "Immediate jeopardy" },
  { value: "Actual harm", label: "Actual harm" },
  { value: "Minimal harm or potential for actual harm", label: "Minimal harm" },
  { value: "No actual harm with potential for minimal harm", label: "No actual harm" },
];

export default function SurveysPage() {
  return (
    <Suspense fallback={null}>
      <SurveysPageImpl />
    </Suspense>
  );
}

function SurveysPageImpl() {
  const router = useRouter();
  const params = useSearchParams();
  const { persona } = usePersona();
  const scopeFacility = persona.facilityId; // null = regional, sees all
  const facility = params.get("facility") ?? "";
  const ftag = params.get("ftag") ?? "";
  const status = params.get("status") ?? "all";
  const severity = params.get("severity") ?? "all";

  const filtered = useMemo(() => {
    return SURVEYS_BY_DATE_DESC.filter((s) => {
      if (scopeFacility && s.facilityId !== scopeFacility) return false; // RBAC scope
      if (facility && s.facilityId !== facility) return false;
      if (ftag && !s.deficiencies.some((d) => d.ftag === ftag)) return false;
      if (status === "open" && s.pocStatus === "POC submitted") return false;
      if (status === "submitted" && s.pocStatus !== "POC submitted") return false;
      if (severity !== "all" && s.worstSeverity !== severity) return false;
      return true;
    });
  }, [scopeFacility, facility, ftag, status, severity]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`/surveys${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const activeFilterCount = [facility, ftag, status !== "all" ? status : "", severity !== "all" ? severity : ""].filter(Boolean).length;

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-6 ph-reveal">
        <p className="text-base text-ph-gray-500 max-w-2xl leading-relaxed">
          Every CMS-2567 ingested across the division. Click a row to see the full FHIR Bundle,
          drafted POC, and the original PDF.
        </p>
      </div>

      {/* Filter bar */}
      <div className="ph-card mb-6 p-4 flex flex-wrap items-center gap-3">
        <span className="ph-eyebrow text-ph-gray-400">Filter</span>
        {scopeFacility ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ph-primary-soft bg-ph-primary-soft px-3 py-1.5 text-xs text-ph-primary font-medium">
            <Lock className="h-3 w-3" /> {persona.facilityLabel} · your facility
          </span>
        ) : (
          <FilterSelect
            ariaLabel="Facility"
            value={facility}
            options={[
              { value: "", label: "All facilities" },
              ...FACILITIES.map((f) => ({ value: f.id, label: f.name.replace("Pruitthealth ", "") })),
            ]}
            onChange={(v) => setParam("facility", v)}
          />
        )}
        <FilterSelect
          ariaLabel="F-tag"
          value={ftag}
          options={[
            { value: "", label: "All F-tags" },
            ...FTAGS.map((t) => ({ value: t.code, label: `${t.code} — ${t.shortTitle}` })),
          ]}
          onChange={(v) => setParam("ftag", v)}
        />
        <FilterSelect
          ariaLabel="POC status"
          value={status}
          options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => setParam("status", v)}
        />
        <FilterSelect
          ariaLabel="Severity"
          value={severity}
          options={SEVERITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => setParam("severity", v)}
        />
        <div className="flex-1" />
        <span className="text-xs text-ph-gray-500 tabular-nums">
          {filtered.length} of {SURVEYS_BY_DATE_DESC.length}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => router.replace("/surveys", { scroll: false })}
            className="inline-flex items-center gap-1 text-xs text-ph-burgundy hover:underline"
          >
            <X className="h-3 w-3" /> Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="ph-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ph-gray-200 bg-ph-gray-50">
              <th className="ph-eyebrow text-left px-6 py-3">Survey date</th>
              <th className="ph-eyebrow text-left px-6 py-3">Facility</th>
              <th className="ph-eyebrow text-left px-6 py-3">F-tags</th>
              <th className="ph-eyebrow text-left px-6 py-3">Worst severity</th>
              <th className="ph-eyebrow text-left px-6 py-3">POC status</th>
              <th className="ph-eyebrow text-right px-6 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-ph-gray-500">
                  No surveys match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => {
                const f = getFacility(s.facilityId)!;
                const dueIn = daysUntil(s.pocDueDate);
                return (
                  <tr
                    key={s.id}
                    className="ph-reveal border-b border-ph-gray-100 last:border-b-0 hover:bg-ph-gray-50 transition-colors"
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-6 py-3 text-sm text-ph-gray-700 align-middle">
                      <Link href={`/surveys/${s.id}`} className="block">{formatDate(s.surveyDate)}</Link>
                    </td>
                    <td className="px-6 py-3 text-sm align-middle">
                      <Link href={`/surveys/${s.id}`} className="block">
                        <div className="font-display">{f.name}</div>
                        <div className="text-[11px] text-ph-gray-400">{f.state} · {f.bu}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-3 align-middle">
                      <Link href={`/surveys/${s.id}`} className="flex flex-wrap gap-1">
                        {s.deficiencies.slice(0, 4).map((d, di) => (
                          <span
                            key={`${d.ftag}-${di}`}
                            className="inline-flex items-center rounded bg-ph-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-ph-gray-700"
                          >
                            {d.ftag}
                          </span>
                        ))}
                        {s.deficiencies.length > 4 && (
                          <span className="text-[10px] text-ph-gray-400 self-center">+{s.deficiencies.length - 4}</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-3 align-middle">
                      <Link href={`/surveys/${s.id}`} className="block">
                        <SeverityBadge severity={s.worstSeverity} compact />
                      </Link>
                    </td>
                    <td className="px-6 py-3 align-middle">
                      <Link href={`/surveys/${s.id}`} className="block">
                        <span
                          className={cn(
                            "text-xs",
                            s.pocStatus === "POC submitted" && "text-ph-primary",
                            s.pocStatus === "draft pending review" && "text-ph-amber font-medium",
                            s.pocStatus === "in extraction" && "text-ph-gray-500",
                          )}
                        >
                          {s.pocStatus}
                        </span>
                        {s.pocStatus !== "POC submitted" && (
                          <div className={cn(
                            "text-[10px] mt-0.5",
                            dueIn < 0 && "text-ph-burgundy",
                            dueIn >= 0 && dueIn <= 3 && "text-ph-amber",
                            dueIn > 3 && "text-ph-gray-400",
                          )}>
                            {dueIn < 0 ? `${Math.abs(dueIn)}d overdue` : `due in ${dueIn}d`}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-right align-middle">
                      <Link href={`/surveys/${s.id}`} className="text-ph-gray-400 hover:text-ph-primary inline-block">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer rounded-lg border border-ph-gray-200 bg-ph-paper px-3 py-1.5 pr-8 text-xs hover:border-ph-burgundy transition-colors focus:outline-none focus:ring-2 focus:ring-ph-burgundy/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ph-gray-400 pointer-events-none" />
    </div>
  );
}
