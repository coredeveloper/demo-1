"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { answerFor, REFUSAL, SUGGESTIONS, type NlqAnswer } from "@/lib/nlq-canned";
import { cn } from "@/lib/utils";

type Message =
  | { role: "user"; text: string }
  | { role: "agent"; text: string; citations: { surveyId: string; label: string }[]; refused?: boolean; streaming?: boolean };

const STREAM_MS_PER_CHAR = 8;

export function NlqChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text:
        "Ask about F-tag distribution, severity trends, or how a facility compares to peers. Every answer cites the underlying survey records — click a citation to drill in.",
      citations: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(query: string) {
    const trimmed = query.trim();
    if (!trimmed || streaming) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setStreaming(true);

    const ans: NlqAnswer | null = answerFor(trimmed);
    const fullText = ans?.text ?? REFUSAL;
    const citations = ans?.citations ?? [];

    // Push empty agent message and stream chars in
    setMessages((prev) => [
      ...prev,
      { role: "agent", text: "", citations: [], refused: !ans, streaming: true },
    ]);

    let i = 0;
    const interval = setInterval(() => {
      i += 4; // 4 chars per tick for snappier feel
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1] as Extract<Message, { role: "agent" }>;
        next[next.length - 1] = {
          ...last,
          text: fullText.slice(0, i),
          streaming: i < fullText.length,
        };
        return next;
      });
      if (i >= fullText.length) {
        clearInterval(interval);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1] as Extract<Message, { role: "agent" }>;
          next[next.length - 1] = { ...last, text: fullText, citations, streaming: false };
          return next;
        });
        setStreaming(false);
      }
    }, STREAM_MS_PER_CHAR * 4);
  }

  return (
    <div className="ph-card overflow-hidden flex flex-col min-h-[480px] h-full max-h-[720px]">
      <header className="px-5 py-4 border-b border-ph-gray-200 shrink-0">
        <div className="ph-eyebrow text-ph-burgundy">Natural language</div>
        <h3 className="text-lg tracking-tight">Ask the corpus</h3>
        <p className="text-[11px] text-ph-gray-500 mt-0.5">
          Foundry agent (mocked) — cite-or-refuse grounded against the trailing-12-months survey
          set. Citations link to the source MeasureReport.
        </p>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="border-t border-ph-gray-100 px-5 py-3 flex flex-wrap gap-2 shrink-0">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="text-[11px] inline-flex items-center gap-1.5 rounded-full border border-ph-gray-200 hover:border-ph-burgundy hover:text-ph-burgundy px-3 py-1.5 text-ph-gray-700 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="border-t border-ph-gray-200 px-5 py-3 flex items-center gap-2 shrink-0 bg-ph-gray-50"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about F-tags, severity, or facility trends…"
          disabled={streaming}
          className="flex-1 bg-transparent text-sm placeholder:text-ph-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className={cn(
            "inline-flex items-center justify-center rounded-md h-8 w-8 transition-colors",
            input.trim() && !streaming
              ? "bg-ph-burgundy text-white hover:bg-ph-burgundy/90"
              : "bg-ph-gray-200 text-ph-gray-400 cursor-not-allowed",
          )}
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-ph-primary text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
          {message.text}
        </div>
        <div className="h-7 w-7 rounded-full bg-ph-gray-100 text-ph-gray-500 flex items-center justify-center shrink-0">
          <UserIcon className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-full bg-ph-burgundy-soft text-ph-burgundy flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="text-sm leading-relaxed text-ph-ink">
          {message.text}
          {message.streaming && (
            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-ph-burgundy align-middle animate-pulse" />
          )}
        </div>
        {message.refused && (
          <div className="mt-1 text-[10px] uppercase tracking-wider text-ph-gray-400 font-mono">
            Refused — no grounding match
          </div>
        )}
        {message.citations.length > 0 && (
          <div className="mt-3">
            <div className="ph-eyebrow text-ph-gray-400 mb-1.5">Citations</div>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c) => (
                <Link
                  key={c.surveyId}
                  href={`/surveys/${c.surveyId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded bg-ph-primary-soft text-ph-primary px-2 py-1 text-[10px] font-mono hover:bg-ph-primary hover:text-white transition-colors"
                >
                  ↗ {c.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
