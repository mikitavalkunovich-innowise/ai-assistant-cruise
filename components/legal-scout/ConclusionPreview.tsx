"use client";

import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalConclusion } from "@/lib/legal-scout/types";

const riskStyles = {
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

interface ConclusionPreviewProps {
  conclusion: LegalConclusion;
  docxBase64: string | null;
  onDownloadJson: () => void;
}

export function ConclusionPreview({ conclusion, docxBase64, onDownloadJson }: ConclusionPreviewProps) {
  const downloadDocx = () => {
    if (!docxBase64) return;
    const bytes = Uint8Array.from(atob(docxBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "legal-conclusion.docx";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{conclusion.conclusion_title}</h3>
          <div className="mt-2 flex gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase",
                riskStyles[conclusion.overall_risk]
              )}
            >
              Risk: {conclusion.overall_risk}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
              Success: {conclusion.success_likelihood}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {docxBase64 && (
            <button
              onClick={downloadDocx}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Download DOCX
            </button>
          )}
          <button
            onClick={onDownloadJson}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
          Executive Summary
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{conclusion.executive_summary}</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          Findings ({conclusion.findings.length})
        </p>
        {conclusion.findings.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-200">
                {f.id}. {f.title}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-xs uppercase",
                  riskStyles[f.risk_level]
                )}
              >
                {f.risk_level}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">{f.analysis}</p>

            {f.document_citations.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-500 mb-1">Document citations</p>
                {f.document_citations.map((c, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-indigo-500/50 pl-3 text-xs text-slate-400 italic"
                  >
                    <span className="text-indigo-400 not-italic">{c.location}: </span>
                    &ldquo;{c.excerpt}&rdquo;
                  </blockquote>
                ))}
              </div>
            )}

            {f.statute_citations.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Statutory citations</p>
                {f.statute_citations.map((s, i) => (
                  <div key={i} className="rounded-lg bg-slate-800/50 p-2 text-xs text-slate-400">
                    <p className="font-medium text-slate-300">{s.reference}</p>
                    <p className="mt-1">{s.full_text.slice(0, 300)}{s.full_text.length > 300 ? "…" : ""}</p>
                    {s.source_url && (
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-indigo-400 hover:underline truncate"
                      >
                        {s.source_url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {conclusion.recommended_actions.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
            Recommended Actions
          </p>
          <ul className="list-inside list-decimal space-y-1 text-sm text-slate-400">
            {conclusion.recommended_actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-600 italic">{conclusion.disclaimer}</p>
    </div>
  );
}
