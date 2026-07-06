"use client";

import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function renderMarkdownLine(line: string, key: number) {
  const trimmed = line.trimEnd();

  if (!trimmed) {
    return <div key={key} className="h-3" />;
  }

  if (trimmed.startsWith("### ")) {
    return (
      <h3 key={key} className="mt-4 mb-2 text-sm font-semibold text-slate-800">
        {trimmed.slice(4)}
      </h3>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <h2 key={key} className="mt-5 mb-2 text-base font-semibold text-slate-900">
        {trimmed.slice(3)}
      </h2>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <h1 key={key} className="mt-2 mb-3 text-lg font-bold text-slate-900">
        {trimmed.slice(2)}
      </h1>
    );
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return (
      <li key={key} className="ml-4 list-disc text-sm leading-relaxed text-slate-700">
        {trimmed.replace(/^[-*]\s+/, "")}
      </li>
    );
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    return (
      <li key={key} className="ml-4 list-decimal text-sm leading-relaxed text-slate-700">
        {trimmed.replace(/^\d+\.\s+/, "")}
      </li>
    );
  }

  const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="text-sm leading-relaxed text-slate-700">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

interface DocumentViewerProps {
  title: string;
  fileName?: string;
  text: string | null;
  loading?: boolean;
  isMarkdown?: boolean;
  className?: string;
}

export function DocumentViewer({
  title,
  fileName,
  text,
  loading,
  isMarkdown,
  className,
}: DocumentViewerProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40",
          className
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-400">Loading document preview...</span>
      </div>
    );
  }

  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{title}</p>
        {fileName && (
          <span className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-[180px]">
            <FileText className="h-3 w-3 shrink-0" />
            {fileName}
          </span>
        )}
      </div>

      <div className="relative rounded-xl border border-slate-700 bg-slate-800/30 p-1 shadow-inner">
        <div className="max-h-[420px] overflow-y-auto rounded-lg bg-white px-6 py-8 shadow-lg">
          {isMarkdown ? (
            <div className="space-y-1">{lines.map((line, i) => renderMarkdownLine(line, i))}</div>
          ) : (
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800">
              {text}
            </pre>
          )}
        </div>
      </div>

      <p className="text-right text-xs text-slate-600">
        {text.length.toLocaleString()} characters
      </p>
    </div>
  );
}
