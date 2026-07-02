import type { Citation } from "@/lib/types";
import { FileText, ExternalLink } from "lucide-react";

interface CitationListProps {
  citations: Citation[];
  showSimilarity?: boolean;
}

export function CitationList({ citations, showSimilarity = false }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="mb-2 text-xs font-medium text-gray-500">Sources</p>
      <div className="space-y-2">
        {citations.map((c) => (
          <div
            key={c.chunkId}
            className="rounded-lg bg-gray-50 p-2 text-xs"
          >
            <div className="flex items-start gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ncl-blue/10 text-[10px] font-bold text-ncl-blue">
                {c.index}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-medium text-gray-700">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{c.documentTitle}</span>
                  {c.pageNumber && (
                    <span className="text-gray-400">p.{c.pageNumber}</span>
                  )}
                  {showSimilarity && c.similarity !== undefined && (
                    <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-normal text-emerald-700">
                      {(c.similarity * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-gray-500 italic">&ldquo;{c.excerpt}&rdquo;</p>
                {c.sourceUrl && c.sourceUrl.startsWith("http") && (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-0.5 text-ncl-blue hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View source
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
