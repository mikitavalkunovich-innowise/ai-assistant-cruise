import { chunkText } from "@/lib/rag/ingest";
import { embedText } from "@/lib/openai";
import { cosineSimilarity } from "@/lib/rag/similarity";

export interface MemoryChunk {
  content: string;
  index: number;
  embedding: number[];
}

export class InMemoryRag {
  private chunks: MemoryChunk[] = [];

  async indexDocument(text: string): Promise<number> {
    const parts = chunkText(text, 400, 50);
    this.chunks = [];
    for (let i = 0; i < parts.length; i++) {
      const embedding = await embedText(parts[i]);
      this.chunks.push({ content: parts[i], index: i, embedding });
    }
    return this.chunks.length;
  }

  async retrieve(query: string, topK = 6): Promise<{ content: string; similarity: number }[]> {
    if (this.chunks.length === 0) return [];
    const queryEmbedding = await embedText(query);
    return this.chunks
      .map((c) => ({
        content: c.content,
        similarity: cosineSimilarity(queryEmbedding, c.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  get fullText(): string {
    return this.chunks.map((c) => c.content).join("\n\n");
  }

  get chunkCount(): number {
    return this.chunks.length;
  }
}
