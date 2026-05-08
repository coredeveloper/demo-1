import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SURVEYS_BY_DATE_DESC, getFacility } from "@/lib/mock-data";
import { SeverityBadge } from "./severity-badge";
import { formatDate, formatRelative, daysUntil, cn } from "@/lib/utils";

export function RecentSurveys() {
  const recent = SURVEYS_BY_DATE_DESC.slice(0, 6);

  return (
    <section className="ph-card overflow-hidden">
      <header className="flex items-baseline justify-between border-b border-ph-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl tracking-tight">Recent surveys</h2>
          <p className="text-xs text-ph-gray-500 mt-0.5">
            Last six CMS-2567 forms ingested across the division.
          </p>
        </div>
        <Link href="/surveys" className="text-xs text-ph-primary hover:text-ph-primary-dark inline-flex items-center gap-1">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>
      <ul className="divide-y divide-ph-gray-200">
        {recent.map((s, i) => {
          const facility = getFacility(s.facilityId)!;
          const dueIn = daysUntil(s.pocDueDate);
          const dueOverdue = s.pocStatus !== "POC submitted" && dueIn < 0;
          const dueSoon = s.pocStatus !== "POC submitted" && dueIn >= 0 && dueIn <= 3;
          return (
            <li
              key={s.id}
              className="ph-reveal"
              style={{ animationDelay: `${100 + i * 60}ms` }}
            >
              <Link
                href={`/surveys/${s.id}`}
                className="flex items-center gap-6 px-6 py-4 hover:bg-ph-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-display text-base text-ph-ink truncate">
                      {facility.name}
                    </span>
                    <span className="ph-eyebrow text-ph-gray-400">
                      {facility.state}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.deficiencies.slice(0, 3).map((d) => (
                      <span
                        key={d.ftag}
                        className="inline-flex items-center rounded bg-ph-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-ph-gray-700"
                      >
                        {d.ftag}
                      </span>
                    ))}
                    {s.deficiencies.length > 3 && (
                      <span className="text-[10px] text-ph-gray-400">
                        +{s.deficiencies.length - 3}
                      </span>
                    )}
                    <SeverityBadge severity={s.worstSeverity} compact />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-ph-gray-500">{formatDate(s.surveyDate)}</div>
                  <div className="text-[11px] text-ph-gray-400 mt-0.5">
                    {formatRelative(s.surveyDate)}
                  </div>
                </div>
                <div className="text-right shrink-0 min-w-[110px]">
                  <div
                    className={cn(
                      "text-xs font-medium",
                      s.pocStatus === "POC submitted" && "text-ph-primary",
                      s.pocStatus === "draft pending review" && "text-ph-amber",
                      s.pocStatus === "in extraction" && "text-ph-gray-500",
                    )}
                  >
                    {s.pocStatus === "POC submitted" ? "Submitted" : s.pocStatus === "draft pending review" ? "Draft pending" : "Extracting"}
                  </div>
                  {s.pocStatus !== "POC submitted" && (
                    <div
                      className={cn(
                        "text-[11px] mt-0.5",
                        dueOverdue && "text-ph-burgundy font-medium",
                        dueSoon && "text-ph-amber",
                        !dueOverdue && !dueSoon && "text-ph-gray-400",
                      )}
                    >
                      {dueOverdue
                        ? `${Math.abs(dueIn)}d overdue`
                        : `due in ${dueIn}d`}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
