"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type StepState = "pending" | "active" | "complete";

export type Step = {
  num: number;
  label: string;
  description: string;
  state: StepState;
};

export function PipelineStepper({
  steps,
  onStepClick,
}: {
  steps: Step[];
  onStepClick?: (num: number) => void;
}) {
  return (
    <ol className="grid grid-cols-4 gap-0 border border-ph-gray-200 rounded-lg overflow-hidden bg-ph-paper">
      {steps.map((s, i) => {
        const interactive = onStepClick && s.state !== "pending";
        const Tag = interactive ? "button" : "div";
        return (
          <Tag
            key={s.num}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onStepClick!(s.num) : undefined}
            className={cn(
              "relative flex items-start gap-3 px-5 py-4 text-left",
              i < steps.length - 1 && "border-r border-ph-gray-200",
              s.state === "active" && "bg-ph-burgundy-soft/40",
              s.state === "pending" && "opacity-50",
              interactive && "hover:bg-ph-gray-50 cursor-pointer transition-colors",
            )}
          >
            <span
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-medium shrink-0 transition-colors",
                s.state === "complete" &&
                  "bg-ph-primary text-white",
                s.state === "active" &&
                  "bg-ph-burgundy text-white ph-pulse",
                s.state === "pending" &&
                  "bg-ph-gray-100 text-ph-gray-400",
              )}
            >
              {s.state === "complete" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.num}
            </span>
            <div className="flex-1 min-w-0">
              <div className="ph-eyebrow text-ph-gray-400 mb-0.5">Step {s.num}</div>
              <div className="text-sm font-medium tracking-tight">{s.label}</div>
              <div className="text-[11px] text-ph-gray-500 mt-0.5 leading-snug">{s.description}</div>
            </div>
            {s.state === "active" && (
              <span className="absolute bottom-0 left-0 h-0.5 bg-ph-burgundy w-full" />
            )}
          </Tag>
        );
      })}
    </ol>
  );
}
