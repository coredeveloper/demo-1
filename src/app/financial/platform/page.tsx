"use client";

/*
 * /financial/platform — Platform & Governance: the "PruittHealth IT operates
 * it day one" admin surface. Data & refresh, model lifecycle (RFP Scope F),
 * identity / PHI / audit (RFP Scope B/D). RBAC inspector is live-bound to the
 * active persona.
 */
import { useFinPersona } from "@/components/financial/persona-provider";
import {
  Card,
  Pill,
  SectionLabel,
  TheaterNote,
} from "@/components/financial/primitives";
import { fireToast } from "@/components/financial/chrome";
import {
  AUDIT_LOG,
  BUSINESS_IMPACT,
  DRIFT_BARS,
  FEEDBACK_LINE,
  IDENTITY_ITEMS,
  LINEAGE,
  MODEL_REGISTRY,
  PHI_ROWS,
  QUALITY_CHECKS,
  SOURCE_CHIPS,
} from "@/lib/financial/platform";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function PlatformPage() {
  const { persona } = useFinPersona();

  return (
    <div className="flex flex-col gap-6">
      <TheaterNote>
        Admin surface — built as if PruittHealth IT operates it day one. Data pipelines, model
        health, and governance/audit in one place. (Demo: representative view.)
      </TheaterNote>

      {/* ── Data & refresh ─────────────────────────────────────────── */}
      <section>
        <SectionLabel>Data &amp; refresh</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 mb-4">
          {SOURCE_CHIPS.map((c) => (
            <div key={c.label} className="ph-card px-3.5 py-2.5 flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  c.tone === "green" ? "bg-[#2E7D5B]" : "bg-ph-amber",
                )}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ph-ink">{c.label}</div>
                <div className="text-[11px] text-ph-gray-500 leading-snug">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card
            title="Pipeline lineage"
            sub="Source → Fabric → Lakehouse medallion → semantic model / AI Search index"
          >
            <div className="flex flex-col gap-2">
              {LINEAGE.map((n, i) => (
                <div key={n.name} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      n.status === "green" ? "bg-[#2E7D5B]" : "bg-ph-amber",
                    )}
                  />
                  <span className="text-ph-ink">{n.name}</span>
                  {"note" in n && n.note && (
                    <span className="text-[10.5px] text-ph-amber">· {n.note}</span>
                  )}
                  {i < LINEAGE.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-ph-gray-300 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card title="Data-quality checks" sub="vs thresholds · pass / warn / fail">
            <table className="w-full text-[12px]">
              <tbody className="divide-y divide-ph-gray-100">
                {QUALITY_CHECKS.map((q) => (
                  <tr key={q.check + q.domain}>
                    <td className="py-1.5 pr-2 font-medium text-ph-ink">{q.check}</td>
                    <td className="py-1.5 pr-2 text-ph-gray-500">{q.domain}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{q.score}</td>
                    <td className="py-1.5 text-right">
                      <Pill tone={q.status === "pass" ? "g" : "a"}>{q.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Business-impact summary" sub="Plain language for non-technical users">
            <div className="flex flex-col gap-2.5">
              {BUSINESS_IMPACT.map((b) => (
                <p
                  key={b.text}
                  className={cn(
                    "rounded-r-md border-l-4 px-3 py-2 text-[12px] leading-relaxed",
                    b.tone === "amber"
                      ? "border-ph-amber bg-ph-amber/5 text-ph-gray-700"
                      : "border-[#2E7D5B] bg-[#E7F0EB]/50 text-ph-gray-700",
                  )}
                >
                  {b.text}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── Model & pipeline health ────────────────────────────────── */}
      <section>
        <SectionLabel hint="RFP Scope F — model monitoring & lifecycle">
          Model &amp; pipeline health
        </SectionLabel>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card title="Model registry" sub="Production models · version · environment · last evaluation">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                    <th className="py-1.5 pr-3 font-semibold">Model</th>
                    <th className="py-1.5 pr-3 font-semibold">Version</th>
                    <th className="py-1.5 pr-3 font-semibold">Env</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Accuracy</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Drift (7d)</th>
                    <th className="py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ph-gray-100">
                  {MODEL_REGISTRY.map((m) => (
                    <tr key={m.model}>
                      <td className="py-2 pr-3 font-medium text-ph-ink whitespace-nowrap">{m.model}</td>
                      <td className="py-2 pr-3 tabular-nums">{m.version}</td>
                      <td className="py-2 pr-3">
                        <Pill tone={m.env === "PROD" ? "s" : "m"}>{m.env}</Pill>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.accuracy}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.drift}</td>
                      <td className="py-2">
                        <Pill tone={m.status === "healthy" ? "g" : m.status === "staging" ? "m" : "a"}>
                          {m.status}
                        </Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <Card title="Drift — KPI anomaly detector" sub="Input / output / label drift vs threshold">
              <div className="flex flex-col gap-3">
                {DRIFT_BARS.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-baseline justify-between text-[11.5px] mb-1">
                      <span className="text-ph-gray-700">{d.label}</span>
                      <span className="tabular-nums text-ph-gray-500">
                        {d.value} / {d.threshold}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ph-gray-100 overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(d.value / d.threshold) * 100}%`,
                          background: d.tone === "amber" ? "#B8862B" : "#2E7D5B",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10.5px] text-ph-gray-400">
                Drift &gt; threshold raises an alert to the Action Center and a retraining trigger.
              </p>
            </Card>
            <Card title="CI/CD & feedback" sub="Azure DevOps environments · reviewer corrections">
              <div className="flex items-center gap-2 text-[12px] font-medium text-ph-ink mb-2.5">
                {["DEV", "QA", "PROD"].map((env, i) => (
                  <span key={env} className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-ph-gray-200 px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B]" />
                      {env}
                    </span>
                    {i < 2 && <ArrowRight className="h-3 w-3 text-ph-gray-300" />}
                  </span>
                ))}
              </div>
              <p className="text-[11.5px] leading-relaxed text-ph-gray-500">{FEEDBACK_LINE}</p>
              <button
                type="button"
                onClick={() => fireToast("Rollback requires approver role — request logged (demo)")}
                className="mt-3 rounded-md border border-ph-gray-200 px-2.5 py-1 text-[11px] font-medium text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
              >
                Request rollback
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Governance & audit ─────────────────────────────────────── */}
      <section>
        <SectionLabel hint="RFP Scope B/D — identity, PHI minimization, audit">
          Governance &amp; audit
        </SectionLabel>
        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <Card title="Identity & access" sub="Entra ID groups → app roles">
            <ul className="flex flex-col gap-1.5 text-[12px] text-ph-gray-700 list-disc list-inside marker:text-ph-sage">
              {IDENTITY_ITEMS.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </Card>
          <Card title="PHI exposure" sub="Minimized + visible to admins">
            <div className="flex flex-col divide-y divide-ph-gray-100">
              {PHI_ROWS.map((r) => (
                <div key={r.label} className="flex items-center justify-between py-1.5 text-[12px]">
                  <span className="text-ph-gray-700">{r.label}</span>
                  <Pill tone={r.tone === "green" ? "g" : "a"}>{r.value}</Pill>
                </div>
              ))}
            </div>
          </Card>
          <Card title="RBAC inspector" sub="Effective permissions (active persona)">
            <p className="rounded-md bg-ph-primary-soft px-3 py-2.5 text-[12px] leading-relaxed text-ph-primary font-medium">
              {persona.rbac}
            </p>
          </Card>
        </div>
        <Card
          title="Audit log explorer"
          sub="Every AI interaction, export, POC action, and threshold change is logged · 6-yr retention"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-ph-gray-400">
                  <th className="py-1.5 pr-3 font-semibold">Time</th>
                  <th className="py-1.5 pr-3 font-semibold">Actor</th>
                  <th className="py-1.5 pr-3 font-semibold">Event</th>
                  <th className="py-1.5 pr-3 font-semibold">Detail</th>
                  <th className="py-1.5 font-semibold">Audit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ph-gray-100">
                {AUDIT_LOG.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 tabular-nums text-ph-gray-500">{row.time}</td>
                    <td className="py-2 pr-3 font-medium text-ph-ink whitespace-nowrap">{row.actor}</td>
                    <td className="py-2 pr-3">
                      <Pill tone={row.tone}>{row.event}</Pill>
                    </td>
                    <td className="py-2 pr-3 text-ph-gray-500">{row.detail}</td>
                    <td className="py-2 tabular-nums text-ph-gray-400">{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
