import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FACILITIES, surveysByFacility } from "@/lib/mock-data";

export default function FacilitiesPage() {
  return (
    <div className="px-10 pt-6 pb-16 max-w-[1500px]">
      <div className="mb-10 ph-reveal grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 md:col-span-7">
          <p className="text-[20px] leading-[1.3] tracking-tight font-display text-ph-ink">
            Five skilled-nursing facilities across the
            <span className="text-ph-burgundy"> Southeast division</span>,
            tracked at the F-tag and severity level.
          </p>
        </div>
        <div className="col-span-12 md:col-span-5">
          <hr className="ph-rule mb-3" />
          <p className="text-xs text-ph-gray-500 leading-relaxed">
            Each facility maps 1:1 to a FHIR <code className="font-mono text-[10px]">Organization</code> resource — the same identifier propagates through MeasureReports, CarePlans, and audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FACILITIES.map((f, i) => {
          const surveys = surveysByFacility(f.id);
          const open = surveys.filter((s) => s.pocStatus !== "POC submitted").length;
          const totalDef = surveys.reduce((acc, s) => acc + s.deficiencies.length, 0);
          return (
            <Link
              key={f.id}
              href={`/facilities/${f.id}`}
              className="ph-card p-6 hover:shadow-lg transition-shadow ph-reveal group"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="ph-eyebrow text-ph-gray-400 mb-2">{f.state} · {f.bu}</div>
              <h3 className="text-lg tracking-tight font-display mb-1 leading-snug">
                {f.name.replace("Pruitthealth ", "")}
              </h3>
              <p className="text-[11px] text-ph-gray-500 mb-5 leading-relaxed">
                {f.address}
              </p>
              <hr className="ph-rule mb-4" />
              <dl className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <dd className="font-display text-2xl text-ph-primary leading-none">{surveys.length}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Surveys</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl text-ph-amber leading-none">{open}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Open</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl text-ph-burgundy leading-none">{totalDef}</dd>
                  <dt className="ph-eyebrow text-ph-gray-400 mt-1">Citations</dt>
                </div>
              </dl>
              <div className="mt-5 inline-flex items-center gap-1 text-[11px] text-ph-primary group-hover:translate-x-0.5 transition-transform">
                Drill in <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
