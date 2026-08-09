/*
 * The six personas — ported from the vendor demo as typed data. Persona is the
 * demo's RBAC story: it changes scope, visible views, KPI values, narrative,
 * exception cards, roster, and alert filtering. Content is authored (it encodes
 * the Chesapeake / Coastal Pines storyline), not derived from the dataset.
 *
 * Unlike the vendor, suggested actions ARE persona-specific here — the vendor
 * showed one static list under a "ranked for your persona" label.
 */
import type { PersonaDef } from "./types";

const OWNER = (s: string) => `<span class="text-ph-primary font-medium">${s}</span>`;
const ROSE = (s: string) => `<strong class="text-ph-burgundy">${s}</strong>`;
const AMBER = (s: string) => `<strong class="text-ph-amber">${s}</strong>`;
const GREEN = (s: string) => `<strong class="text-[#2E7D5B]">${s}</strong>`;
const B = (s: string) => `<strong>${s}</strong>`;

export const PERSONAS: Record<string, PersonaDef> = {
  exec: {
    key: "exec",
    name: "Executive Leader",
    role: "CEO / COO / CFO · all locations",
    scopeChip: "180 locations · 6 states",
    mode: "Executive",
    rbac: "Executive Leader → Command Center, Finance (read), Survey (read), Alerts. All 180 locations.",
    tabs: ["command", "insights", "survey-risk", "alerts", "platform"],
    finScope: "enterprise",
    surveyScope: "all",
    alertScope: "all",
    roster: "all",
    command: {
      title:
        "Margin pressure concentrating in skilled nursing and Maryland; one immediate-jeopardy citation open",
      body: `Blended operating margin is ${AMBER("8.9%")} TTM (–120bps YoY), but the May exit rate slipped to ${ROSE("7.9%")} — driven by skilled-nursing labor at ${B("60.3%")} of revenue and agency dependency concentrated in Maryland. Occupancy improved to ${GREEN("84.8%")} (+1.4pts) and agency hours fell to ${B("6.5%")} (–1.9pts). On compliance: ${ROSE("42")} survey citations in the last 90 days with Clinical/Quality-of-Care trending up; ${B("17")} open Plans of Correction, 89% on-time.`,
      stats: [
        { val: "$2.89B", lab: "TTM revenue", cls: "neu" },
        { val: "8.9%", lab: "Op margin (TTM)", cls: "neg" },
        { val: "84.8%", lab: "Occupancy", cls: "pos" },
      ],
      kpiLabel: "Enterprise KPIs · May 2026",
      kpis: [
        { accent: "teal", status: "amber", label: "TTM Revenue", value: "$2.89B", delta: "▲ +6.1% YoY", deltaTone: "good", sub: "180 locations", drill: "/financial/insights" },
        { accent: "burgundy", status: "red", label: "Operating Margin", value: "8.9%", delta: "▼ –120bps YoY", deltaTone: "bad", sub: "May exit 7.9% · 9.0% target", drill: "/financial/insights" },
        { accent: "green", status: "green", label: "Avg Occupancy", value: "84.8%", delta: "▲ +1.4pts", deltaTone: "good", sub: "SNF 84.1% · AL 88.7%" },
        { accent: "amber", status: "amber", label: "Agency Hours", value: "6.5%", delta: "▼ –1.9pts", deltaTone: "good", sub: "of nursing hours" },
        { accent: "verdigris", status: "amber", label: "Open Survey Citations", value: "42", delta: "▲ vs prior 90d", deltaTone: "bad", sub: "trailing 90 days", drill: "/financial/survey-risk" },
        { accent: "sage", status: "green", label: "POC On-Time Rate", value: "89%", delta: "17 open · 10-day window", deltaTone: "neutral", sub: "to submission SLA", drill: "/poc-review" },
      ],
      excFin: {
        title: "Financial exceptions",
        sub: "Locations breaching margin / labor thresholds",
        pill: "3 critical",
        pillTone: "r",
        items: [
          { sev: "crit", title: "Chesapeake [Illustrative] — Baltimore, MD", meta: `Operating margin 2.4% · labor 66.1% · agency 14.2% · ${OWNER("R. Owens (Reg. CFO)")}`, val: "2.4%", valTone: "r" },
          { sev: "crit", title: "Coastal Pines [Illustrative] — Savannah, GA", meta: `Operating margin 3.1% · agency 12.7% · occupancy 78.4% · ${OWNER("R. Owens (Reg. CFO)")}`, val: "3.1%", valTone: "r" },
          { sev: "warn", title: "Piedmont Manor [Illustrative] — Charlotte, NC", meta: `Operating margin 5.9% · labor 62.2% · ${OWNER("D. Hale (Reg. CFO)")}`, val: "5.9%", valTone: "a" },
          { sev: "info", title: "Skilled Nursing — portfolio labor variance", meta: "Labor 60.3% of revenue · 96 SNF locations", val: "60.3%", valTone: "a" },
        ],
      },
      excComp: {
        title: "Compliance exceptions",
        sub: "High-risk citation areas & POC backlog",
        pill: "rising",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake — F689 (immediate jeopardy, severity J)", meta: `Accident hazards · 4 open POCs · ${OWNER("M. Tran (Reviewer)")}`, val: "Sev J", valTone: "r" },
          { sev: "warn", title: "Clinical / Quality of Care — trending up", meta: "66 citations (12m), +18% QoQ · top F-tag F684", val: "↑18%", valTone: "a" },
          { sev: "warn", title: "Coastal Pines — recurring infection control", meta: `F880 · 9 citations (12m) · ${OWNER("M. Tran (Reviewer)")}`, val: "F880", valTone: "a" },
          { sev: "info", title: "2 POC drafts below confidence threshold", meta: "Flagged for human validation before submission", val: "review", valTone: "a" },
        ],
      },
      actions: [
        { action: "Review the Chesapeake margin + immediate-jeopardy citation jointly before Thursday's regional call.", signal: "only location breaching both finance and compliance critical thresholds" },
        { action: "Approve the 2 POC drafts in the review queue ahead of the 10-day window.", signal: "SLA risk · 89% on-time vs 90% target" },
        { action: "Generate the board-ready briefing on skilled-nursing labor variance.", signal: "SNF labor +130bps vs budget, largest driver of margin slip" },
      ],
    },
  },

  finance: {
    key: "finance",
    name: "Finance Leader",
    role: "Regional CFO / controller · region-scoped",
    scopeChip: "Maryland · 6 locations",
    mode: "Finance",
    rbac: "Finance Leader → Command Center, Financial Insights, Alerts. Region-scoped (Entra group: PH-Finance-MD).",
    tabs: ["command", "insights", "alerts"],
    finScope: "md",
    surveyScope: "all",
    alertScope: "md",
    roster: "MD",
    command: {
      title:
        "Maryland is the most margin-pressured region — agency premium and occupancy drag at the Baltimore-corridor SNFs",
      body: `Maryland operating margin is ${ROSE("5.5%")} versus the 8.9% blended portfolio, on agency staffing at ${B("12.9%")} of nursing hours and occupancy of just ${AMBER("78.8%")}. ${B("Chesapeake")} and ${B("Annapolis")} are both below 2.5% margin. The state carries ${ROSE("28")} citations (12m) and ${B("7")} open Plans of Correction at 79% on-time — the lowest in the portfolio.`,
      stats: [
        { val: "$98.5M", lab: "Maryland TTM rev", cls: "neu" },
        { val: "5.5%", lab: "Operating margin", cls: "neg" },
        { val: "78.8%", lab: "Occupancy", cls: "neg" },
      ],
      kpiLabel: "Maryland KPIs · May 2026",
      kpis: [
        { accent: "teal", status: "amber", label: "Region Revenue", value: "$98.5M", delta: "Maryland · 6 locations", deltaTone: "neutral", sub: "trailing twelve months", drill: "/financial/insights" },
        { accent: "burgundy", status: "red", label: "Operating Margin", value: "5.5%", delta: "▼ –340bps vs portfolio", deltaTone: "bad", sub: "below 9.0% target", drill: "/financial/insights" },
        { accent: "amber", status: "red", label: "Avg Occupancy", value: "78.8%", delta: "▼ vs 84.8% portfolio", deltaTone: "bad", sub: "SNF-weighted" },
        { accent: "green", status: "red", label: "Agency Hours", value: "12.9%", delta: "▲ vs 6.5% portfolio", deltaTone: "bad", sub: "of nursing hours" },
        { accent: "verdigris", status: "amber", label: "Open Survey Citations", value: "28", delta: "Maryland", deltaTone: "bad", sub: "trailing 12 months" },
        { accent: "sage", status: "amber", label: "POC On-Time Rate", value: "79%", delta: "7 open · 10-day window", deltaTone: "bad", sub: "vs 89% portfolio", drill: "/poc-review" },
      ],
      excFin: {
        title: "Financial exceptions — Maryland",
        sub: "Locations breaching margin / labor thresholds",
        pill: "3 critical",
        pillTone: "r",
        items: [
          { sev: "crit", title: "Chesapeake [Illustrative] — Baltimore, MD", meta: `Operating margin 2.4% · labor 66.1% · agency 14.2% · ${OWNER("R. Owens (Reg. CFO)")}`, val: "2.4%", valTone: "r" },
          { sev: "crit", title: "Annapolis [Illustrative] — Annapolis, MD", meta: `Operating margin 2.3% · labor 65.9% · agency 14.8% · ${OWNER("R. Owens (Reg. CFO)")}`, val: "2.3%", valTone: "r" },
          { sev: "warn", title: "Hagerstown [Illustrative] — Hagerstown, MD", meta: `Operating margin 4.7% · labor 67.4% · agency 15.1% · ${OWNER("R. Owens (Reg. CFO)")}`, val: "4.7%", valTone: "a" },
          { sev: "warn", title: "Silver Spring [Illustrative] — Silver Spring, MD", meta: "Operating margin 6.6% · agency 14.6% · occupancy 76.0%", val: "6.6%", valTone: "a" },
        ],
      },
      excComp: {
        title: "Compliance exceptions — Maryland",
        sub: "High-risk citation areas in region",
        pill: "rising",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake — F689 (immediate jeopardy, severity J)", meta: "Accident hazards · 11 citations (12m) · 4 open POCs", val: "Sev J", valTone: "r" },
          { sev: "crit", title: "Silver Spring — actual harm (severity H)", meta: "5 citations (12m) · 1 open POC", val: "Sev H", valTone: "r" },
          { sev: "warn", title: "Annapolis — actual harm (severity G)", meta: "4 citations (12m) · 1 open POC", val: "Sev G", valTone: "a" },
          { sev: "info", title: "Maryland — 28 citations / 79% on-time", meta: "Lowest POC on-time rate in the portfolio", val: "79%", valTone: "a" },
        ],
      },
      actions: [
        { action: "Take the Chesapeake + Annapolis agency premium to a joint review with regional staffing.", signal: "–78bps — the single largest Maryland variance driver" },
        { action: "Stand up the Baltimore-corridor occupancy recovery plan with admissions.", signal: "78.8% occupancy vs 84.8% portfolio — a –30bps revenue drag" },
        { action: "Escalate Maryland's POC on-time rate with the compliance leader.", signal: "79% on-time — lowest in the portfolio" },
      ],
    },
  },

  compliance: {
    key: "compliance",
    name: "Compliance Leader",
    role: "Corporate compliance · all surveys",
    scopeChip: "All surveys · 180 locations",
    mode: "Survey",
    rbac: "Compliance Leader → Survey Intelligence, POC Workspace, Alerts, Governance (read). All facilities.",
    tabs: ["command", "survey-risk", "alerts", "platform"],
    finScope: "enterprise",
    surveyScope: "all",
    alertScope: "all",
    roster: "all",
    command: {
      title: "Clinical / Quality-of-Care citations rising enterprise-wide; one immediate-jeopardy open",
      body: `${ROSE("42")} citations in the last 90 days across 180 locations, with Clinical / Quality-of-Care up ${B("18% QoQ")} (66 in 12m) and one open ${B("immediate-jeopardy (F689)")} at Chesapeake. Infection control is improving (39 in 12m, down QoQ). ${B("17")} Plans of Correction are open at 89% on-time; ${B("2")} AI-drafted POCs are below confidence threshold and held for review.`,
      stats: [
        { val: "42", lab: "Open citations (90d)", cls: "neg" },
        { val: "66", lab: "Clinical/QoC (12m)", cls: "neu" },
        { val: "89%", lab: "POC on-time", cls: "pos" },
      ],
      kpiLabel: "Compliance KPIs · May 2026",
      kpis: [
        { accent: "verdigris", status: "amber", label: "Open Survey Citations", value: "42", delta: "▲ vs prior 90d", deltaTone: "bad", sub: "trailing 90 days", drill: "/financial/survey-risk" },
        { accent: "burgundy", status: "red", label: "Immediate Jeopardy", value: "1", delta: "F689 · Chesapeake", deltaTone: "neutral", sub: "open", drill: "/financial/survey-risk" },
        { accent: "amber", status: "amber", label: "Clinical / QoC (12m)", value: "66", delta: "▲ +18% QoQ", deltaTone: "bad", sub: "top tag F684", drill: "/financial/survey-risk" },
        { accent: "green", status: "green", label: "Infection Control", value: "39", delta: "▼ improving", deltaTone: "good", sub: "F880 · 12m", drill: "/financial/survey-risk" },
        { accent: "sage", status: "green", label: "POC On-Time Rate", value: "89%", delta: "17 open · 10-day window", deltaTone: "neutral", sub: "to submission SLA", drill: "/poc-review" },
        { accent: "teal", status: "amber", label: "Needs Validation", value: "3", delta: "low-confidence extracts", deltaTone: "neutral", sub: "queue", drill: "/financial/survey-risk" },
      ],
      excFin: {
        title: "High-risk facilities",
        sub: "Recurring or severe citations",
        pill: "review",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake [Illustrative] — F689 (Sev J)", meta: "Immediate jeopardy · 11 citations (12m) · POC due 4d", val: "Sev J", valTone: "r" },
          { sev: "crit", title: "Silver Spring [Illustrative] — actual harm (Sev H)", meta: "Maryland · 5 citations (12m) · 1 open POC", val: "Sev H", valTone: "r" },
          { sev: "warn", title: "Coastal Pines [Illustrative] — recurring F880", meta: "Infection control · 9 citations (12m) · severity G", val: "F880", valTone: "a" },
          { sev: "info", title: "Cumberland [Illustrative] — F656 needs validation", meta: "Low-confidence extraction · held for review", val: "0.88", valTone: "a" },
        ],
      },
      excComp: {
        title: "POC backlog & SLA risk",
        sub: "Plans of Correction status",
        pill: "rising",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake F689 — POC due in 4 days", meta: "Immediate jeopardy · 4 open POCs · M. Tran", val: "4d", valTone: "r" },
          { sev: "warn", title: "2 POC drafts below confidence threshold", meta: "Flagged for human validation before submission", val: "review", valTone: "a" },
          { sev: "info", title: "On-time rate 89% vs 90% target", meta: "17 open across assigned reviewers", val: "89%", valTone: "a" },
        ],
      },
      actions: [
        { action: "Approve the Chesapeake F689 immediate-jeopardy POC before the 4-day deadline.", signal: "the portfolio's only open IJ · 10-day window" },
        { action: "Review the Clinical/QoC uptrend with the F684 top-tag facilities.", signal: "+18% QoQ — fastest-rising category" },
        { action: "Validate the 2 low-confidence AI drafts held in the queue.", signal: "extraction confidence below threshold" },
      ],
    },
  },

  reviewer: {
    key: "reviewer",
    name: "Compliance Reviewer",
    role: "POC author / approver · assigned facilities",
    scopeChip: "Assigned facilities · 14",
    mode: "POC",
    rbac: "Compliance Reviewer → POC Workspace, Survey (read). Assigned facilities + surveys only.",
    tabs: ["command", "survey-risk", "alerts"],
    finScope: "enterprise",
    surveyScope: "assigned",
    alertScope: "assigned",
    roster: "none",
    command: {
      title: "Six surveys in your queue; two POC drafts below confidence threshold",
      body: `You have ${B("14")} assigned facilities with ${ROSE("9")} open citations. ${B("3")} Plans of Correction are in your queue — ${B("2")} are AI-drafted below the confidence threshold and require your validation before submission. One ${B("immediate-jeopardy (F689)")} POC at Chesapeake is due in 4 days.`,
      stats: [
        { val: "14", lab: "Assigned facilities", cls: "neu" },
        { val: "3", lab: "POC in queue", cls: "neg" },
        { val: "86%", lab: "On-time", cls: "pos" },
      ],
      kpiLabel: "Reviewer queue · May 2026",
      kpis: [
        { accent: "teal", status: "green", label: "Assigned Facilities", value: "14", delta: "with open surveys", deltaTone: "neutral", sub: "assigned scope" },
        { accent: "verdigris", status: "amber", label: "Open Survey Citations", value: "9", delta: "assigned scope", deltaTone: "neutral", sub: "trailing 90 days", drill: "/financial/survey-risk" },
        { accent: "sage", status: "amber", label: "POC In Queue", value: "3", delta: "2 need review", deltaTone: "neutral", sub: "10-day window", drill: "/poc-review" },
        { accent: "burgundy", status: "red", label: "Immediate Jeopardy", value: "1", delta: "F689 · due 4d", deltaTone: "neutral", sub: "Chesapeake", drill: "/poc-review" },
        { accent: "green", status: "green", label: "POC On-Time Rate", value: "86%", delta: "to SLA", deltaTone: "neutral", sub: "assigned" },
        { accent: "amber", status: "green", label: "Avg Extraction Conf.", value: "0.93", delta: "2 below threshold", deltaTone: "neutral", sub: "document AI" },
      ],
      excFin: {
        title: "POC queue",
        sub: "Drafts awaiting your action",
        pill: "2 to review",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake [Illustrative] — F689 POC", meta: "Immediate jeopardy · due in 4 days · not started", val: "4d", valTone: "r" },
          { sev: "warn", title: "Coastal Pines [Illustrative] — F880 POC", meta: "Drafting · recurring infection control", val: "draft", valTone: "a" },
          { sev: "warn", title: "2 drafts below confidence threshold", meta: "Require validation before submission", val: "review", valTone: "a" },
        ],
      },
      excComp: {
        title: "Assigned high-risk facilities",
        sub: "Recurring or severe in your scope",
        pill: "rising",
        pillTone: "a",
        items: [
          { sev: "crit", title: "Chesapeake [Illustrative] — F689 (Sev J)", meta: "Accident hazards · 11 citations (12m) · 4 open POCs", val: "Sev J", valTone: "r" },
          { sev: "warn", title: "Coastal Pines [Illustrative] — F880 recurring", meta: "Infection control · 9 citations (12m) · severity G", val: "F880", valTone: "a" },
          { sev: "info", title: "Cumberland [Illustrative] — needs validation", meta: "F656 low-confidence extraction", val: "0.88", valTone: "a" },
        ],
      },
      actions: [
        { action: "Start the Chesapeake F689 POC draft now.", signal: "immediate jeopardy · due in 4 days · not started" },
        { action: "Validate the 2 AI drafts flagged below the confidence threshold.", signal: "cannot submit without human validation" },
        { action: "Finish the Coastal Pines F880 draft with the recurring-citation context.", signal: "cited in 3 of the last 4 surveys" },
      ],
    },
  },

  facility: {
    key: "facility",
    name: "Facility Administrator",
    role: "Single facility · scoped",
    scopeChip: "Chesapeake, MD · 1 location",
    mode: "Finance",
    rbac: "Facility Admin → Command Center (scoped), Finance/Survey (scoped), Alerts. Single facility only.",
    tabs: ["command", "insights", "survey-risk", "alerts"],
    finScope: "chesapeake",
    surveyScope: "chesapeake",
    alertScope: "chesapeake",
    roster: "none",
    command: {
      title: "Chesapeake breaching both margin and immediate-jeopardy thresholds",
      body: `Chesapeake (Baltimore, MD) operating margin is ${ROSE("2.4%")} — the lowest in the portfolio, far below the 9.0% target — driven by agency staffing at ${B("14.2%")} of nursing hours and labor at ${B("66.1%")} of revenue. Occupancy is ${ROSE("76.9%")}, below the 84.8% portfolio average. Of ${B("11")} citations in the last 12 months, one is an open ${B("immediate-jeopardy (F689, severity J)")}; ${B("4")} Plans of Correction are open, one due in 4 days.`,
      stats: [
        { val: "$23.8M", lab: "Facility TTM rev", cls: "neu" },
        { val: "2.4%", lab: "Operating margin", cls: "neg" },
        { val: "76.9%", lab: "Occupancy", cls: "neg" },
      ],
      kpiLabel: "Chesapeake, MD · May 2026",
      kpis: [
        { accent: "teal", status: "amber", label: "Facility Revenue", value: "$23.8M", delta: "Baltimore, MD", deltaTone: "neutral", sub: "trailing twelve months", drill: "/financial/insights" },
        { accent: "burgundy", status: "red", label: "Operating Margin", value: "2.4%", delta: "▼ lowest in portfolio", deltaTone: "bad", sub: "below 9.0% target", drill: "/financial/insights" },
        { accent: "amber", status: "red", label: "Agency Hours", value: "14.2%", delta: "▲ vs 6.5% portfolio", deltaTone: "bad", sub: "RN vacancies" },
        { accent: "green", status: "red", label: "Occupancy", value: "76.9%", delta: "▼ vs 84.8% portfolio", deltaTone: "bad", sub: "skilled nursing" },
        { accent: "verdigris", status: "red", label: "Open Survey Citations", value: "11", delta: "F689 Sev J open", deltaTone: "bad", sub: "trailing 12 months", drill: "/financial/survey-risk" },
        { accent: "sage", status: "amber", label: "POC Due", value: "4d", delta: "4 open", deltaTone: "neutral", sub: "10-day window", drill: "/poc-review" },
      ],
      excFin: {
        title: "Cost pressures — Chesapeake",
        sub: "Drivers of the margin breach",
        pill: "critical",
        pillTone: "r",
        items: [
          { sev: "crit", title: "Agency premium", meta: "14.2% of nursing hours vs 6.5% portfolio · RN vacancies", val: "14.2%", valTone: "r" },
          { sev: "crit", title: "Labor cost", meta: "66.1% of revenue · highest in the portfolio", val: "66.1%", valTone: "r" },
          { sev: "warn", title: "Occupancy below plan", meta: "76.9% vs 84.8% portfolio · revenue drag", val: "76.9%", valTone: "a" },
        ],
      },
      excComp: {
        title: "Compliance — Chesapeake",
        sub: "Open citations & POC",
        pill: "critical",
        pillTone: "r",
        items: [
          { sev: "crit", title: "F689 — immediate jeopardy (Sev J)", meta: "Accident hazards · POC due in 4 days", val: "Sev J", valTone: "r" },
          { sev: "warn", title: "11 citations in last 12 months", meta: "Highest-severity in the portfolio · 4 open POCs", val: "11", valTone: "a" },
          { sev: "info", title: "POC drafts pending review", meta: "AI-drafted · require reviewer approval", val: "review", valTone: "a" },
        ],
      },
      actions: [
        { action: "Confirm F689 abatement actions and get the POC drafted today.", signal: "immediate jeopardy · POC due in 4 days" },
        { action: "Work the RN agency-reduction plan with regional staffing.", signal: "14.2% agency vs 6.5% portfolio — top cost driver" },
        { action: "Kick off the census recovery push with admissions.", signal: "76.9% occupancy vs 84.8% portfolio" },
      ],
    },
  },

  it: {
    key: "it",
    name: "IT / Data-AI Operations",
    role: "Platform health · cross-cutting admin",
    scopeChip: "Platform · cross-cutting",
    mode: "Admin",
    rbac: "IT / Data-AI Ops → Platform & Governance, Alerts. Cross-cutting admin.",
    tabs: ["command", "alerts", "platform"],
    finScope: "enterprise",
    surveyScope: "all",
    alertScope: "all",
    roster: "none",
    command: {
      title: "Platform healthy; one lakehouse stage delayed and the KPI anomaly model on drift watch",
      body: `All source systems are connected. ${B("1")} lakehouse stage (Silver→Gold) is delayed and Census/EMR is stale for ${B("2")} sites (last refresh 02:40 ET). Extraction confidence averages ${GREEN("0.93")}. The KPI anomaly detector is on ${AMBER("drift watch")} (0.11 vs 0.15 threshold); all other models healthy.`,
      stats: [
        { val: "99.4%", lab: "Data completeness", cls: "pos" },
        { val: "1", lab: "Stage delayed", cls: "neg" },
        { val: "0.11", lab: "Max model drift", cls: "neu" },
      ],
      kpiLabel: "Platform health · May 2026",
      kpis: [
        { accent: "green", status: "green", label: "Pipelines Healthy", value: "4/5", delta: "1 stage delayed", deltaTone: "neutral", sub: "source→index", drill: "/financial/platform" },
        { accent: "amber", status: "amber", label: "Stale Sources", value: "2", delta: "Census / EMR", deltaTone: "neutral", sub: "sites pending", drill: "/financial/platform" },
        { accent: "sage", status: "green", label: "Extraction Conf.", value: "0.93", delta: "avg · 2567", deltaTone: "neutral", sub: "document AI", drill: "/financial/platform" },
        { accent: "verdigris", status: "amber", label: "Max Model Drift", value: "0.11", delta: "KPI anomaly", deltaTone: "neutral", sub: "vs 0.15 thr.", drill: "/financial/platform" },
        { accent: "teal", status: "green", label: "Docs Indexed", value: "1,284", delta: "AI Search", deltaTone: "neutral", sub: "per-doc RBAC", drill: "/financial/platform" },
        { accent: "burgundy", status: "green", label: "Uptime (30d)", value: "99.9%", delta: "platform", deltaTone: "neutral", sub: "SLA met" },
      ],
      excFin: {
        title: "Pipeline issues",
        sub: "Sources & stages needing attention",
        pill: "watch",
        pillTone: "a",
        items: [
          { sev: "warn", title: "Lakehouse Silver→Gold delayed", meta: "1 stage behind schedule · backfill running", val: "delayed", valTone: "a" },
          { sev: "warn", title: "Census / EMR stale — 2 sites", meta: "Last refresh 02:40 ET · next 14:00 ET", val: "2 sites", valTone: "a" },
          { sev: "info", title: "KPI anomaly model — drift watch", meta: "Input drift 0.11 vs 0.15 threshold", val: "0.11", valTone: "a" },
        ],
      },
      excComp: {
        title: "Governance & audit",
        sub: "Identity, PHI, retention",
        pill: "healthy",
        pillTone: "g",
        items: [
          { sev: "info", title: "Finance pipeline — 0 PHI fields", meta: "Field-level security enforced", val: "0 PHI", valTone: "g" },
          { sev: "info", title: "Survey pipeline — masked at output", meta: "PHI minimized · Purview labels on export", val: "masked", valTone: "g" },
          { sev: "info", title: "Audit log — 6-yr retention", meta: "Every AI interaction & export logged", val: "on", valTone: "g" },
        ],
      },
      actions: [
        { action: "Confirm the Silver→Gold backfill completes before the 14:00 ET refresh.", signal: "1 lakehouse stage behind schedule" },
        { action: "Keep the KPI anomaly detector on drift watch; stage the retraining trigger.", signal: "input drift 0.11 vs 0.15 threshold" },
        { action: "Chase the 2 stale Census/EMR sites with the integration owner.", signal: "last refresh 02:40 ET" },
      ],
    },
  },
};

export const PERSONA_KEYS = Object.keys(PERSONAS) as (keyof typeof PERSONAS)[];
export const DEFAULT_PERSONA = "exec";
