"use client";

/*
 * AgentDock — the "Ask the Assistant" slide-in panel.
 *
 * ⚠ STUB (deliberate, per plan): this dock is NOT wired to the live agent yet.
 * The agentic layer itself is live and untouched — POST /api/agent serves both
 * toolsets and Teams uses the same brain via /api/messages. Wiring this dock
 * is the swap of `respond()` below for `useChat` from @ai-sdk/react pointed at
 * /api/agent (plus markdown + ```chart fence rendering + tool source chips).
 * Nothing else in this file changes.
 */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinPersona } from "./persona-provider";

type Msg = { role: "user" | "assistant"; text: string };

const SEED =
  "I'm the PruittHealth AI Insight Assistant. I answer from the platform's finance and survey data and cite every source — or I refuse if I can't ground the answer. I explain in plain terms for any audience and can reply with charts, not just text.";

const STUB_REPLY =
  "Stub mode — this panel isn't wired to the live agent yet. The agent itself is already running: the same brain answers at POST /api/agent and in Microsoft Teams once the bot is installed. The dock wiring lands in the next pass.";

const SUGGESTIONS = [
  "Chart operating margin by service line",
  "Show the survey citation trend by category",
  "Which states carry the most survey citation risk?",
  "Explain this month's posture in plain terms (no jargon)",
];

const MODE_BY_PATH: [string, string][] = [
  ["/financial/insights", "Finance"],
  ["/financial/survey-risk", "Survey"],
  ["/financial/alerts", "Admin"],
  ["/financial/platform", "Admin"],
];

export function AgentDock() {
  const { persona } = useFinPersona();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mode = MODE_BY_PATH.find(([p]) => path.startsWith(p))?.[1] ?? persona.mode;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 300);
    };
    window.addEventListener("ph-open-dock", onOpen);
    return () => window.removeEventListener("ph-open-dock", onOpen);
  }, []);

  // STUB: replace with useChat({ api: "/api/agent" }) — see file header.
  const respond = (question: string) => {
    setMessages((m) => [...m, { role: "user", text: question }, { role: "assistant", text: STUB_REPLY }]);
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    respond(q);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ph-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-ph-primary-dark"
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        Ask the Assistant
      </button>

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-ph-gray-200 bg-ph-paper shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center gap-2.5 border-b border-ph-gray-200 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ph-primary text-white">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ph-ink">AI Insight Assistant</span>
              <span className="rounded-full bg-ph-primary-soft px-2 py-0.5 text-[10px] font-semibold text-ph-primary">
                {mode}
              </span>
              <span className="rounded-full bg-ph-amber/10 px-2 py-0.5 text-[10px] font-semibold text-ph-amber">
                stub
              </span>
            </div>
            <div className="text-[10.5px] text-ph-gray-500">
              Source-grounded · cite-or-refuse · audit-logged
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="rounded p-1 text-ph-gray-400 hover:bg-ph-gray-100 hover:text-ph-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <Bubble role="assistant" text={SEED} />
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
        </div>

        <div className="border-t border-ph-gray-200 px-4 pt-3 pb-4">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => respond(s)}
                className="rounded-full border border-ph-gray-200 bg-ph-gray-50 px-2.5 py-1 text-[11px] text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask a question…"
              className="max-h-28 flex-1 resize-none rounded-lg border border-ph-gray-200 bg-ph-paper px-3 py-2 text-sm outline-none focus:border-ph-primary"
            />
            <button
              type="button"
              onClick={send}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ph-primary text-white hover:bg-ph-primary-dark"
            >
              <Send className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-ph-gray-400">
            Every reply cites sources &amp; refresh metadata · interactions are audit-logged · demo
            data is illustrative
          </p>
        </div>
      </aside>
    </>
  );
}

function Bubble({ role, text }: Msg) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold",
          isUser ? "bg-ph-gray-200 text-ph-gray-700" : "bg-ph-primary text-white",
        )}
      >
        {isUser ? "U" : "AI"}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-ph-primary-soft text-ph-ink"
            : "rounded-tl-sm border border-ph-gray-200 bg-ph-gray-50 text-ph-gray-700",
        )}
      >
        {text}
      </div>
    </div>
  );
}
