import type { Citation, RetrievedChunk } from "@/lib/types";
import { truncate } from "@/lib/utils";

export function buildContextFromChunks(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, i) => {
      const page = chunk.pageNumber ? ` (page ${chunk.pageNumber})` : "";
      return `[${i + 1}] Source: "${chunk.documentTitle}"${page}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

export function chunksToCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((chunk, i) => ({
    index: i + 1,
    documentTitle: chunk.documentTitle,
    pageNumber: chunk.pageNumber,
    excerpt: truncate(chunk.content, 200),
    sourceUrl: chunk.sourceUrl,
    chunkId: chunk.id,
  }));
}

export function parseCitationReferences(text: string): number[] {
  const matches = text.matchAll(/\[(\d+)\]/g);
  const indices = new Set<number>();
  for (const match of matches) {
    indices.add(parseInt(match[1], 10));
  }
  return Array.from(indices).sort((a, b) => a - b);
}

export function filterUsedCitations(
  citations: Citation[],
  answerText: string
): Citation[] {
  const used = new Set(parseCitationReferences(answerText));
  return citations.filter((c) => used.has(c.index));
}
