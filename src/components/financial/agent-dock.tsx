"use client";

/*
 * AgentDock — LIVE. The same brain as Microsoft Teams: useChat → /api/agent
 * (all 12 tools, cite-or-refuse), with the shared "demo-user" thread so a
 * conversation started here continues in Teams and vice versa. Renders
 * markdown-lite, ```chart fences (recharts), and source chips from the actual
 * tool calls the agent made.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { ExternalLink, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartBlock, parseChartSpec } from "./chart-block";
import { useFinPersona } from "./persona-provider";

/** One shared demo thread — Teams joins it via DEMO_USER_AAD_ID mapping. */
const THREAD_KEY = "demo-user";

const TEAMS_DEEP_LINK =
  "https://teams.microsoft.com/l/app/703068f7-78d7-473f-b034-77372733f29a?installAppPackage=true&appTenantId=ba03bbbe-35f5-4256-bef1-449f583b3311";

const SEED =
  "I'm the PruittHealth AI Insight Assistant. I answer from the platform's finance and survey data and cite every source — or I refuse if I can't ground the answer. Same brain as the Teams bot — this conversation continues there.";

const SUGGESTIONS = [
  "Chart operating margin by service line",
  "Show the survey citation trend by category",
  "Which states carry the most survey citation risk?",
  "Draft a POC for the infection-control citation at Fleming Island",
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
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent", body: { threadKey: THREAD_KEY } }),
    [],
  );
  const { messages, sendMessage, status } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const mode = MODE_BY_PATH.find(([p]) => path.startsWith(p))?.[1] ?? persona.mode;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open, status]);

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

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    void sendMessage({ text: q });
  };

  const send = () => {
    ask(input);
    setInput("");
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
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-ph-gray-200 bg-ph-paper shadow-2xl transition-transform duration-300",
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
            </div>
            <div className="text-[10.5px] text-ph-gray-500">
              Source-grounded · cite-or-refuse · audit-logged
            </div>
          </div>
          <a
            href={TEAMS_DEEP_LINK}
            target="_blank"
            rel="noreferrer"
            title="Same conversation, in Microsoft Teams"
            className="inline-flex items-center gap-1 rounded-md border border-ph-gray-200 px-2 py-1 text-[10.5px] font-medium text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary"
          >
            Continue in Teams <ExternalLink className="h-3 w-3" />
          </a>
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
          <AssistantBubble>
            <p dangerouslySetInnerHTML={{ __html: mdLite(SEED) }} />
          </AssistantBubble>
          {messages.map((m) => (
            <MessageView key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <AssistantBubble>
              <span className="inline-flex gap-1">
                <Dot delay={0} /> <Dot delay={150} /> <Dot delay={300} />
              </span>
            </AssistantBubble>
          )}
          {status === "error" && (
            <AssistantBubble>
              <span className="text-ph-burgundy">
                Something went wrong reaching the agent — try again. Details are in the server logs.
              </span>
            </AssistantBubble>
          )}
        </div>

        <div className="border-t border-ph-gray-200 px-4 pt-3 pb-4">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => ask(s)}
                className="rounded-full border border-ph-gray-200 bg-ph-gray-50 px-2.5 py-1 text-[11px] text-ph-gray-700 hover:border-ph-primary hover:text-ph-primary disabled:opacity-50"
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
              disabled={busy}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ph-primary text-white hover:bg-ph-primary-dark disabled:opacity-50"
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

/* ── message rendering ─────────────────────────────────────────────── */

function MessageView({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
    return (
      <div className="flex gap-2 flex-row-reverse">
        <Avatar kind="user" />
        <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-ph-primary-soft px-3 py-2 text-[12.5px] leading-relaxed text-ph-ink whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  const tools = message.parts
    .filter((p) => p.type.startsWith("tool-") || p.type === "dynamic-tool")
    .map((p) => p.type.replace(/^tool-/, "") as string);

  return (
    <AssistantBubble tools={[...new Set(tools)]}>
      {message.parts.map((part, i) =>
        part.type === "text" ? <RichText key={i} text={part.text} /> : null,
      )}
    </AssistantBubble>
  );
}

/** Splits ```chart fences out of the text; fences → recharts, rest → md-lite. */
function RichText({ text }: { text: string }) {
  const segments = useMemo(() => {
    const out: ({ kind: "text"; value: string } | { kind: "chart"; value: string })[] = [];
    const re = /```chart\s*([\s\S]*?)```/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
      out.push({ kind: "chart", value: m[1] });
      last = m.index + m[0].length;
    }
    // An unterminated trailing fence (mid-stream) becomes a placeholder.
    const rest = text.slice(last);
    const open = rest.indexOf("```chart");
    if (open >= 0) {
      if (open > 0) out.push({ kind: "text", value: rest.slice(0, open) });
      out.push({ kind: "text", value: "_▤ building chart…_" });
    } else if (rest) {
      out.push({ kind: "text", value: rest });
    }
    return out;
  }, [text]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "chart") {
          const spec = parseChartSpec(seg.value);
          return spec ? (
            <ChartBlock key={i} spec={spec} />
          ) : (
            <pre key={i} className="mt-1 overflow-x-auto rounded bg-ph-gray-100 p-2 text-[10.5px]">
              {seg.value}
            </pre>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: mdLite(seg.value) }} />;
      })}
    </>
  );
}

/** Minimal, escape-first markdown: bold / italic / inline code / bullets / breaks. */
function mdLite(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong class='text-ph-primary'>$1</strong>")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|[.,;:!?]|$)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code class='rounded bg-ph-gray-100 px-1 text-[11px]'>$1</code>")
    .replace(/^[-•] (.+)$/gm, "<span class='block pl-3'>• $1</span>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

function AssistantBubble({
  children,
  tools = [],
}: {
  children: React.ReactNode;
  tools?: string[];
}) {
  return (
    <div className="flex gap-2">
      <Avatar kind="ai" />
      <div className="max-w-[88%] min-w-0 rounded-xl rounded-tl-sm border border-ph-gray-200 bg-ph-gray-50 px-3 py-2 text-[12.5px] leading-relaxed text-ph-gray-700">
        {children}
        {tools.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-dotted border-ph-gray-200 pt-1.5">
            <span className="text-[9px] uppercase tracking-wide font-semibold text-ph-gray-400">
              Sources
            </span>
            {tools.map((t) => (
              <Fragment key={t}>
                <span className="rounded-full bg-ph-primary-soft px-1.5 py-0.5 text-[9.5px] font-semibold text-ph-primary">
                  {t}
                </span>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ kind }: { kind: "ai" | "user" }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold",
        kind === "user" ? "bg-ph-gray-200 text-ph-gray-700" : "bg-ph-primary text-white",
      )}
    >
      {kind === "user" ? "U" : "AI"}
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ph-gray-400"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
