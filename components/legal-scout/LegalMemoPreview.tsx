"use client";

import type { LegalConclusion } from "@/lib/legal-scout/types";
import { cn } from "@/lib/utils";

const riskLabel: Record<string, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const riskBadge: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface LegalMemoPreviewProps {
  conclusion: LegalConclusion;
}

export function LegalMemoPreview({ conclusion }: LegalMemoPreviewProps) {
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative rounded-xl border border-slate-700 bg-slate-800/30 p-1 shadow-inner">
      <div className="max-h-[min(72vh,900px)] overflow-y-auto rounded-lg bg-white shadow-lg">
        <article className="mx-auto max-w-3xl px-8 py-10 sm:px-12 sm:py-14 font-serif text-slate-800">
          <header className="border-b border-slate-200 pb-8 text-center">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-slate-400">
              Legal Memorandum
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {conclusion.conclusion_title}
            </h1>
            <p className="mt-3 font-sans text-sm text-slate-500">Generated {generatedDate}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-sans">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  riskBadge[conclusion.overall_risk]
                )}
              >
                Overall Risk: {riskLabel[conclusion.overall_risk]}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Success Likelihood: {conclusion.success_likelihood.toUpperCase()}
              </span>
            </div>
          </header>

          <section className="mt-8">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Executive Summary
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              {conclusion.executive_summary}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Findings
            </h2>
            <div className="mt-4 space-y-8">
              {conclusion.findings.map((finding) => (
                <div key={finding.id} className="border-l-2 border-indigo-200 pl-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {finding.id}. {finding.title}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide",
                        riskBadge[finding.risk_level]
                      )}
                    >
                      {riskLabel[finding.risk_level]}
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{finding.analysis}</p>

                  {finding.document_citations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Document Citations
                      </p>
                      {finding.document_citations.map((citation, i) => (
                        <blockquote
                          key={i}
                          className="border-l-2 border-slate-300 bg-slate-50 px-4 py-2 text-sm italic text-slate-600"
                        >
                          <span className="not-italic font-medium text-slate-500">
                            {citation.location}:{" "}
                          </span>
                          &ldquo;{citation.excerpt}&rdquo;
                        </blockquote>
                      ))}
                    </div>
                  )}

                  {finding.statute_citations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Statutory Citations
                      </p>
                      {finding.statute_citations.map((statute, i) => (
                        <div
                          key={i}
                          className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                        >
                          <p className="font-semibold text-slate-800">{statute.reference}</p>
                          <p className="mt-1 leading-relaxed">{statute.full_text}</p>
                          {statute.source_url && (
                            <a
                              href={statute.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block font-sans text-xs text-indigo-600 hover:underline"
                            >
                              {statute.source_url}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {conclusion.recommended_actions.length > 0 && (
            <section className="mt-10">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Recommended Actions
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-slate-700">
                {conclusion.recommended_actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </section>
          )}

          <footer className="mt-12 border-t border-slate-200 pt-6">
            <p className="text-xs italic leading-relaxed text-slate-400">{conclusion.disclaimer}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
