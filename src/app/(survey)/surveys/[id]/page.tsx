import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSurvey, getFacility } from "@/lib/mock-data";
import { buildBundle } from "@/lib/mock-fhir";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { SurveyTabbedView } from "@/components/surveys/survey-tabbed-view";
import { formatDate, daysUntil, cn } from "@/lib/utils";

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = getSurvey(id);
  if (!survey) return notFound();
  const facility = getFacility(survey.facilityId)!;
  const bundle = buildBundle(survey);
  const dueIn = daysUntil(survey.pocDueDate);

  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <Link
        href="/surveys"
        className="inline-flex items-center gap-1.5 text-xs text-ph-gray-500 hover:text-ph-primary mb-6"
      >
        <ArrowLeft className="h-3 w-3" /> All surveys
      </Link>

      {/* Editorial header */}
      <header className="mb-10 ph-reveal grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-7">
          <div className="ph-eyebrow mb-2">
            {survey.surveyType === "health-inspection" ? "Health inspection" : "Complaint inspection"}
          </div>
          <h2 className="text-3xl tracking-tight font-display leading-tight">{facility.name}</h2>
          <div className="mt-2 text-sm text-ph-gray-500">{facility.address}</div>
        </div>
        <div className="col-span-12 md:col-span-5">
          <hr className="ph-rule mb-3" />
          <dl className="grid grid-cols-2 gap-y-3 text-xs">
            <dt className="ph-eyebrow text-ph-gray-400">Survey date</dt>
            <dd className="text-ph-ink text-right">{formatDate(survey.surveyDate)}</dd>
            <dt className="ph-eyebrow text-ph-gray-400">Surveyor</dt>
            <dd className="text-ph-ink text-right text-[11px]">{survey.surveyorOrg}</dd>
            <dt className="ph-eyebrow text-ph-gray-400">POC status</dt>
            <dd className="text-right">
              <span
                className={cn(
                  "text-xs",
                  survey.pocStatus === "POC submitted" && "text-ph-primary",
                  survey.pocStatus === "draft pending review" && "text-ph-amber font-medium",
                )}
              >
                {survey.pocStatus}
              </span>
              {survey.pocStatus !== "POC submitted" && (
                <div
                  className={cn(
                    "text-[10px] mt-0.5",
                    dueIn < 0 && "text-ph-burgundy",
                    dueIn >= 0 && dueIn <= 3 && "text-ph-amber",
                  )}
                >
                  {dueIn < 0 ? `${Math.abs(dueIn)}d overdue` : `due in ${dueIn}d`}
                </div>
              )}
            </dd>
            <dt className="ph-eyebrow text-ph-gray-400">Worst severity</dt>
            <dd className="text-right">
              <SeverityBadge severity={survey.worstSeverity} compact />
            </dd>
          </dl>
        </div>
      </header>

      <SurveyTabbedView survey={survey} facility={facility} bundle={bundle} />
    </div>
  );
}
