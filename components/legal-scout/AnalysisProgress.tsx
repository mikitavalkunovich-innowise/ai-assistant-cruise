"use client";

import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisStep } from "@/lib/legal-scout/types";

const STEPS: { id: AnalysisStep; label: string }[] = [
  { id: "parsing_document", label: "Parse document" },
  { id: "analyzing_document", label: "Analyze clauses" },
  { id: "researching_web", label: "Research statutes" },
  { id: "synthesizing", label: "Draft conclusion" },
  { id: "generating_docx", label: "Generate DOCX" },
];

const STEP_ORDER: AnalysisStep[] = STEPS.map((s) => s.id);

function stepIndex(step: AnalysisStep): number {
  if (step === "done") return STEPS.length;
  if (step === "error") return -1;
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 ? idx : 0;
}

interface AnalysisProgressProps {
  currentStep: AnalysisStep | null;
  logs: string[];
  offlineMode?: boolean;
}

export function AnalysisProgress({ currentStep, logs, offlineMode }: AnalysisProgressProps) {
  const currentIdx = currentStep ? stepIndex(currentStep) : -1;
  const isDone = currentStep === "done";
  const isError = currentStep === "error";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Analysis Progress
        </p>
        {offlineMode && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400">
            Offline demo mode
          </span>
        )}
      </div>

      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = isDone || i < currentIdx;
          const active = !isDone && !isError && i === currentIdx;
          const pending = !done && !active;

          return (
            <div key={step.id} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-400" />
              ) : isError && i === currentIdx ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <Circle className={cn("h-4 w-4 shrink-0", pending ? "text-slate-700" : "text-slate-500")} />
              )}
              <span
                className={cn(
                  "text-sm",
                  done && "text-emerald-300",
                  active && "font-medium text-indigo-300",
                  pending && "text-slate-600"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-900/80 border border-slate-800 p-3 font-mono text-xs text-slate-500 space-y-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
