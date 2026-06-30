import { ONBOARDING_STEPS } from "@/lib/types";

const STORAGE_KEY = "ncl_onboarding_progress";

export function getOnboardingProgress(email: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(`${STORAGE_KEY}_${email}`);
  if (!raw) {
    const initial: Record<string, boolean> = {};
    ONBOARDING_STEPS.forEach((s) => {
      initial[s.id] = false;
    });
    return initial;
  }
  return JSON.parse(raw);
}

export function setOnboardingStep(email: string, stepId: string, completed: boolean): void {
  const progress = getOnboardingProgress(email);
  progress[stepId] = completed;
  localStorage.setItem(`${STORAGE_KEY}_${email}`, JSON.stringify(progress));
}

export function getOnboardingCompletionRate(email: string): number {
  const progress = getOnboardingProgress(email);
  const total = ONBOARDING_STEPS.length;
  const completed = Object.values(progress).filter(Boolean).length;
  return Math.round((completed / total) * 100);
}
