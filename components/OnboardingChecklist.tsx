"use client";

import { useState, useEffect } from "react";
import { ONBOARDING_STEPS } from "@/lib/types";
import {
  getOnboardingProgress,
  setOnboardingStep,
  getOnboardingCompletionRate,
} from "@/lib/hr/onboarding";
import { CheckCircle2, Circle } from "lucide-react";

interface OnboardingChecklistProps {
  userEmail: string;
}

export function OnboardingChecklist({ userEmail }: OnboardingChecklistProps) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    setProgress(getOnboardingProgress(userEmail));
    setCompletionRate(getOnboardingCompletionRate(userEmail));
  }, [userEmail]);

  const toggleStep = (stepId: string) => {
    const newValue = !progress[stepId];
    setOnboardingStep(userEmail, stepId, newValue);
    setProgress(getOnboardingProgress(userEmail));
    setCompletionRate(getOnboardingCompletionRate(userEmail));
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Onboarding Checklist</h3>
        <p className="text-sm text-gray-500">Complete all steps in your first week</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{completionRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-ncl-blue transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {ONBOARDING_STEPS.map((step) => {
          const done = progress[step.id] ?? false;
          return (
            <li key={step.id}>
              <button
                onClick={() => toggleStep(step.id)}
                className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-gray-50"
              >
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />
                )}
                <div>
                  <p className={`text-sm font-medium ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
