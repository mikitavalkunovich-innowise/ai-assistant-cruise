import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { DOCUMENT_AGENT_PROMPT } from "./prompts";
import type { DocumentAnalysis } from "./types";
import type { InMemoryRag } from "./in-memory-rag";

export async function analyzeDocument(params: {
  userQuery: string;
  documentText: string;
  rag: InMemoryRag;
}): Promise<DocumentAnalysis> {
  const { userQuery, documentText, rag } = params;
  const openai = getOpenAI();

  const relevantChunks = await rag.retrieve(userQuery, 8);
  const context =
    relevantChunks.length > 0
      ? relevantChunks.map((c, i) => `[${i + 1}] (relevance ${c.similarity.toFixed(2)})\n${c.content}`).join("\n\n")
      : documentText.slice(0, 12000);

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: DOCUMENT_AGENT_PROMPT },
      {
        role: "user",
        content: `USER QUESTION:\n${userQuery}\n\nDOCUMENT EXCERPTS:\n${context}\n\nFULL DOCUMENT (truncated):\n${documentText.slice(0, 8000)}`,
      },
    ],
    temperature: 0.15,
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as DocumentAnalysis;

  return {
    summary: parsed.summary ?? "",
    parties: parsed.parties ?? [],
    key_clauses: parsed.key_clauses ?? [],
    potential_issues: parsed.potential_issues ?? [],
    search_topics: parsed.search_topics ?? [],
    jurisdiction_hint: parsed.jurisdiction_hint ?? "Unknown",
  };
}
