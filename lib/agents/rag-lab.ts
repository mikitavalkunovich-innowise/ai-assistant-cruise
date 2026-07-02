import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { retrieveChunks } from "@/lib/rag/ingest";
import { buildContextFromChunks, chunksToCitations, filterUsedCitations } from "@/lib/rag/citations";
import type { Citation, RagSearchSettings } from "@/lib/types";

const RAG_LAB_SYSTEM_PROMPT = `You are a helpful document Q&A assistant for a RAG testing sandbox.

Rules:
- Answer ONLY using the provided context excerpts. If the answer is not supported by the context, say "I could not find enough information in the uploaded documents to answer that."
- Always cite sources using [1], [2], etc. matching the context reference numbers.
- Only cite source numbers you actually used in your answer. Do not reference unused context blocks.
- Context may include loosely related passages — synthesize an answer when the meaning is implied, but do not invent facts.
- Respond in the same language as the user's question.
- Be clear and concise.`;

export async function* streamRagLabResponse(params: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  settings: RagSearchSettings;
}): AsyncGenerator<{
  type: "content" | "citations" | "meta";
  data: string | Citation[] | { chunksRetrieved: number };
}> {
  const { message, history = [], settings } = params;
  const chunks = await retrieveChunks(message, "sandbox", settings.topK, {
    minSimilarity: settings.minSimilarity,
  });

  if (chunks.length === 0) {
    yield {
      type: "content",
      data:
        "No matching passages were found. Try lowering the similarity threshold, increasing Top K, or upload more documents.",
    };
    yield { type: "citations", data: [] };
    yield { type: "meta", data: { chunksRetrieved: 0 } };
    return;
  }

  yield { type: "meta", data: { chunksRetrieved: chunks.length } };

  const context = buildContextFromChunks(chunks);
  const allCitations = chunksToCitations(chunks);

  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: RAG_LAB_SYSTEM_PROMPT },
      { role: "system", content: `Context excerpts:\n\n${context}` },
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
    temperature: 0.25,
    max_tokens: 1500,
    stream: true,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      yield { type: "content", data: delta };
    }
  }

  yield { type: "citations", data: filterUsedCitations(allCitations, fullContent) };
}
