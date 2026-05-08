// Slim shared page footer. Visible at the bottom of every page, gives anyone
// reading the URL a one-line confirmation that they're looking at a snapshot,
// not a live system. Mentions the architecture spec the prototype follows.

export function PageFooter() {
  return (
    <footer className="mt-12 px-10 py-5 border-t border-ph-gray-200 bg-ph-paper">
      <div className="max-w-[1500px] flex flex-wrap items-center justify-between gap-3 text-[11px] text-ph-gray-500 italic leading-relaxed">
        <div>
          Local prototype · mock data · no Azure. Modeled on{" "}
          <code className="not-italic font-mono text-[10px] mx-0.5 px-1 py-0.5 rounded bg-ph-gray-100">
            architecture/proposed/02-state-survey-poc.md
          </code>
          .
        </div>
        <div className="font-mono text-[10px] text-ph-gray-400 not-italic">
          v0.1 · seed 2026-05-09 · github.com/coredeveloper/demo-1
        </div>
      </div>
    </footer>
  );
}
