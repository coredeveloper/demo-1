import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SURVEYS_BY_DATE_DESC, getFacility } from "@/lib/mock-data";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { formatDate, daysUntil, cn } from "@/lib/utils";

export default function SurveysPage() {
  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-8 ph-reveal">
        <p className="text-base text-ph-gray-500 max-w-2xl leading-relaxed">
          Every CMS-2567 ingested across the division. Click a row to see the
          full FHIR Bundle, drafted POC, and the original PDF.
        </p>
      </div>

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
            {SURVEYS_BY_DATE_DESC.map((s, i) => {
              const facility = getFacility(s.facilityId)!;
              const dueIn = daysUntil(s.pocDueDate);
              return (
                <tr
                  key={s.id}
                  className="ph-reveal border-b border-ph-gray-100 last:border-b-0 hover:bg-ph-gray-50 transition-colors"
                  style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                >
                  <td className="px-6 py-3 text-sm text-ph-gray-700 align-middle">
                    <Link href={`/surveys/${s.id}`} className="block">
                      {formatDate(s.surveyDate)}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm align-middle">
                    <Link href={`/surveys/${s.id}`} className="block">
                      <div className="font-display">{facility.name}</div>
                      <div className="text-[11px] text-ph-gray-400">{facility.state} · {facility.bu}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <Link href={`/surveys/${s.id}`} className="flex flex-wrap gap-1">
                      {s.deficiencies.slice(0, 4).map((d) => (
                        <span
                          key={d.ftag}
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
