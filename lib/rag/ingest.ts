import { withClient } from "@/lib/db/client";
import { embedText } from "@/lib/openai";
import { cosineSimilarity } from "@/lib/rag/similarity";
import type { KnowledgeBase, RetrievedChunk } from "@/lib/types";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export interface RetrieveOptions {
  topK?: number;
  minSimilarity?: number;
}

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks.length > 0 ? chunks : [text];
}

export async function ingestDocument(params: {
  title: string;
  content: string;
  kb: KnowledgeBase;
  sourceUrl?: string;
  fileType?: string;
  pageTexts?: { page: number; text: string }[];
}): Promise<string> {
  const { title, content, kb, sourceUrl, fileType = "text", pageTexts } = params;

  return withClient(async (client) => {
    const docResult = await client.query(
      `INSERT INTO documents (title, source_url, kb, file_type) VALUES ($1, $2, $3, $4) RETURNING id`,
      [title, sourceUrl ?? null, kb, fileType]
    );
    const documentId = docResult.rows[0].id as string;

    let chunksToEmbed: { content: string; page: number | null; index: number }[] = [];

    if (pageTexts && pageTexts.length > 0) {
      let index = 0;
      for (const { page, text } of pageTexts) {
        for (const chunk of chunkText(text)) {
          chunksToEmbed.push({ content: chunk, page, index: index++ });
        }
      }
    } else {
      chunksToEmbed = chunkText(content).map((c, index) => ({
        content: c,
        page: null,
        index,
      }));
    }

    for (const chunk of chunksToEmbed) {
      const embedding = await embedText(chunk.content);
      await client.query(
        `INSERT INTO chunks (document_id, content, page_number, chunk_index, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [documentId, chunk.content, chunk.page, chunk.index, JSON.stringify(embedding)]
      );
    }

    return documentId;
  });
}

export async function retrieveChunks(
  query: string,
  kb: KnowledgeBase,
  topK = 5,
  options?: RetrieveOptions
): Promise<RetrievedChunk[]> {
  const minSimilarity = options?.minSimilarity ?? 0;
  const queryEmbedding = await embedText(query);

  return withClient(async (client) => {
    const result = await client.query(
      `SELECT
        c.id,
        c.content,
        c.page_number,
        c.embedding,
        d.title AS document_title,
        d.id AS document_id,
        d.source_url
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE d.kb = $1 AND c.embedding IS NOT NULL`,
      [kb]
    );

    const scored = result.rows
      .map((row) => {
        const embedding = row.embedding as number[];
        return {
          id: row.id as string,
          content: row.content as string,
          pageNumber: row.page_number as number | null,
          documentTitle: row.document_title as string,
          documentId: row.document_id as string,
          sourceUrl: row.source_url as string | null,
          similarity: cosineSimilarity(queryEmbedding, embedding),
        };
      })
      .filter((chunk) => chunk.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return scored;
  });
}

export async function listDocuments(kb: KnowledgeBase) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT d.id, d.title, d.file_type, d.created_at,
        (SELECT COUNT(*)::int FROM chunks c WHERE c.document_id = d.id) AS chunk_count
       FROM documents d
       WHERE d.kb = $1
       ORDER BY d.created_at DESC`,
      [kb]
    );
    return result.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      fileType: row.file_type as string,
      createdAt: row.created_at as string,
      chunkCount: row.chunk_count as number,
    }));
  });
}

export async function clearKnowledgeBase(kb: KnowledgeBase): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query(
      `DELETE FROM documents WHERE kb = $1 RETURNING id`,
      [kb]
    );
    return result.rowCount ?? 0;
  });
}

export async function getDocumentCount(kb?: KnowledgeBase): Promise<number> {
  return withClient(async (client) => {
    if (kb) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS count FROM documents WHERE kb = $1`,
        [kb]
      );
      return result.rows[0].count as number;
    }
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM documents`);
    return result.rows[0].count as number;
  });
}

export async function getChunkCount(): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM chunks WHERE embedding IS NOT NULL`
    );
    return result.rows[0].count as number;
  });
}
