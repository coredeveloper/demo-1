# PruittHealth — State Survey Automation · Local Prototype

Local-only Next.js prototype for **RFP Objective 2 — State Survey & Plan-of-Correction Automation**. Mock data, no Azure, no real LLM calls. Mirrors the production architecture spec in `architecture/proposed/02-state-survey-poc.md` (kept in the project's Google Drive folder) so the same UI shells will be re-used by the Azure-wired implementation that follows.

## Quickstart

```bash
npm install
npm run dev
```

App opens at **http://localhost:3000** (or :3001 if 3000 is busy).

## What's in this prototype

| Route | Purpose |
|---|---|
| `/` | Dashboard home — KPI cards (open surveys, POCs due ≤7 days, total deficiencies, IJ count) + recent surveys + F-tag frequency snapshot |
| `/surveys` | All 30 mock surveys, filterable list table |
| `/surveys/[id]` | Per-survey detail with tabs: **Summary** · **FHIR Bundle** (the marquee — clickable resource tree) · **Drafted POC** · **Original PDF** |
| `/trends` | F-tag heatmap (5 facilities × top-12 F-tags), severity distribution, NLQ chat with cite-or-refuse grounding |
| `/facilities` | 5 facility cards |
| `/facilities/[id]` | Per-facility survey history + top F-tags |
| `/pipeline` | The marquee — animated 4-step ingestion of the Fleming Island sample (Document Intelligence → Content Understanding → FHIR Bundle → drafted POC) |
| `/poc-review` | Compliance review queue: pick a draft, accept/reject/export to Word |

## What's NOT in this prototype (held for the Azure-wired implementation)

- ❌ No real Document Intelligence — the "extraction" panel reveals pre-staged JSON
- ❌ No real LLM calls — POC drafts and NLQ answers are pre-canned
- ❌ No real FHIR server — Bundles are constructed in-process by `src/lib/mock-fhir.ts`
- ❌ No authentication — open localhost
- ❌ No database — mock data lives in memory; deterministic seed in `src/lib/mock-data.ts`
- ❌ No production deploy — only `npm run dev` and `npm run build`

## Brand decisions

PruittHealth's identity (extracted from their official logo):

| Token | Hex | Use |
|---|---|---|
| `--ph-primary` (teal) | `#0E5752` | Chrome, primary buttons, KPI numbers, headings |
| `--ph-burgundy` | `#7B2D3F` | Marquee accent — FHIR bundle stripe, IJ severity, "Synthetic" disclaimers |
| `--ph-sage` | `#9FB8B0` | Soft accents, secondary text |
| `--ph-sage-tint` | `#E8F0EE` | Section background bands |

**Typography** — Public Sans (body) + Fraunces (display, variable axes opsz/SOFT) + JetBrains Mono (FHIR JSON). Deliberately NOT Inter/Roboto/Arial per the [anthropics/skills frontend-design](https://skills.sh/anthropics/skills/frontend-design) skill's "no overused fonts" rule.

**Layout** — Editorial healthcare. Asymmetric 12-col grids (5/3/2/2 KPI split, 8/4 body split). Generous negative space. Persistent burgundy banner across the top of every page reading `MOCK DATA · NOT REAL FACILITY OUTCOMES · LOCAL PROTOTYPE`.

## Mock data scheme

Generated deterministically once at module load (so server + client renders are identical). Lives in `src/lib/mock-data.ts`.

- **5 facilities** — Pruitthealth Fleming Island (FL), Lafayette (GA), Macon (GA), Marietta (GA), Panama City (FL). Each maps 1:1 to a FHIR `Organization` resource.
- **30 surveys** distributed across the 12 trailing months, F-tag distribution weights matching published LTC patterns (F0677 ~25%, F0689 ~18%, F0686 ~12%, etc.).
- **POC activities** (2–3 per deficiency) drawn from hand-written templates per F-tag in `src/lib/mock-poc.ts`. Each cites a fictional historical accepted-POC exemplar.
- **FHIR Bundles** — `src/lib/mock-fhir.ts` produces a valid-shape R4 Bundle per survey: Composition + Organization (facility + surveyor) + Measure × N + MeasureReport × N + DetectedIssue × N + CarePlan + Binary + DocumentReference + Provenance.
- **Real source PDFs** — only the latest Fleming Island survey carries `pdfPath = "/samples/fleming-island-f0677.pdf"`; the other 29 surveys keep `pdfPath = null` and surface a "synthetic placeholder" card on the PDF tab.

## Tech stack

- **Next.js 16.2.6** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 4** (CSS-only config in `src/app/globals.css`)
- **shadcn/ui** components via Radix primitives (`@radix-ui/*` already installed)
- `motion` for animations · `recharts` available (currently unused — visualizations are CSS-driven)
- `docx` + `file-saver` for the Plan-of-Correction Word export
- `zod` for type-safe mock data schemas
- `lucide-react` icons

## File map

```
src/
├── app/
│   ├── layout.tsx              ← root layout (sidebar + header + demo banner + fonts)
│   ├── globals.css             ← Tailwind + PruittHealth design tokens
│   ├── page.tsx                ← / dashboard home
│   ├── surveys/page.tsx        ← /surveys list
│   ├── surveys/[id]/page.tsx   ← /surveys/[id] detail (tabbed shell)
│   ├── trends/page.tsx         ← /trends with NLQ chat
│   ├── facilities/page.tsx     ← /facilities list
│   ├── facilities/[id]/page.tsx
│   ├── pipeline/page.tsx       ← marquee 4-step ingestion
│   └── poc-review/page.tsx     ← compliance review queue
├── components/
│   ├── layout/                 ← sidebar, header, demo-banner
│   ├── dashboard/              ← KPI card, severity badge, recent surveys, trend snapshot
│   ├── pipeline/               ← stepper
│   ├── fhir/                   ← FhirTreeView (marquee component)
│   ├── trends/                 ← NlqChat
│   └── surveys/                ← SurveyTabbedView
└── lib/
    ├── types.ts                ← Zod schemas: Survey, Facility, etc.
    ├── mock-data.ts            ← 5 facilities + 30 surveys deterministic
    ├── mock-fhir.ts            ← FHIR R4 Bundle builder
    ├── mock-poc.ts             ← POC drafting templates per F-tag
    ├── nlq-canned.ts           ← pre-canned Q&A for the trends-page chat
    ├── word-export.ts          ← docx exporter for the Plan of Correction
    └── utils.ts                ← cn(), formatDate, daysUntil, etc.
public/
├── pruitthealth-logo.png       ← official PruittHealth logo
└── samples/                    ← real CMS-2567 PDFs from the RFP project
    ├── fleming-island-f0677.pdf
    └── arabella-grand-bay.pdf
```

## What's next (after this prototype)

A separate **Azure-wired implementation plan** (in the project's Google Drive at `demo/02-state-survey-poc/scripts/`) provisions Azure (Document Intelligence + Azure OpenAI + AHDS FHIR via Container Apps + App Service hosting + Application Insights + Key Vault) via `provision-azure.ps1`, then incrementally swaps the mock API routes for real service calls behind the same UI components in this prototype.

The Word export, FHIR Bundle structure, NLQ citations, and PDF viewer remain unchanged — they're already shaped to match what the production agents produce.

## Cross-references

- Production architecture spec — `architecture/proposed/02-state-survey-poc.md` (Drive)
- Shared platform — `architecture/proposed/01-shared-platform.md` (Drive)
- Cross-cutting concerns — `architecture/proposed/04-cross-cutting.md` (Drive)
- Azure provisioning script — `demo/02-state-survey-poc/scripts/provision-azure.ps1` (Drive)
- Demo plan — `demo/02-state-survey-poc/plan.md` (Drive)
