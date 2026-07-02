import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { retrieveChunks } from "@/lib/rag/ingest";
import { buildContextFromChunks, chunksToCitations, filterUsedCitations } from "@/lib/rag/citations";
import type { Citation, KnowledgeBase } from "@/lib/types";

const COMPLIANCE_SYSTEM_PROMPT = `You are the NCL Marine Safety & Compliance Q&A Assistant (Agent 2).
You help compliance officers and managers answer questions about maritime regulations, policies, and certification requirements.

Rules:
- Answer ONLY using the provided context documents. If the answer is not in the context, say "I don't have sufficient information in the compliance knowledge base to answer that."
- Always cite sources using [1], [2], etc. matching the context reference numbers.
- Only cite source numbers you actually used in your answer. Do not reference unused context blocks.
- Be precise and professional. Include specific requirements, thresholds, and procedures when available.
- For certification questions, mention validity periods and renewal requirements if stated in context.
- Respond in the same language the user writes in.`;

const HR_SYSTEM_PROMPT = `You are the NCL HR Policy & Knowledge Hub assistant.
You help employees with HR questions about policies, benefits, leave, conduct, and onboarding.

Rules:
- Answer ONLY using the provided HR policy documents. If the answer is not in the context, say "I don't have that information in the HR knowledge base. Please contact HR directly."
- Always cite sources using [1], [2], etc. matching the context reference numbers.
- Only cite source numbers you actually used in your answer. Do not reference unused context blocks.
- Be friendly, clear, and supportive. Cruise ship and hotel staff may be new to maritime HR policies.
- For onboarding questions, provide step-by-step guidance when available in context.
- Respond in the same language the user writes in (NCL crew speaks 30+ languages).`;

export async function generateRAGResponse(params: {
  message: string;
  kb: KnowledgeBase;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<{ content: string; citations: Citation[] }> {
  const { message, kb, history = [] } = params;
  const chunks = await retrieveChunks(message, kb, 5);

  if (chunks.length === 0) {
    return {
      content:
        kb === "compliance"
          ? "The compliance knowledge base is empty or has no relevant documents. Please upload regulation documents or run the seed script."
          : "The HR knowledge base is empty or has no relevant documents. Please upload HR policy documents or run the seed script.",
      citations: [],
    };
  }

  const context = buildContextFromChunks(chunks);
  const allCitations = chunksToCitations(chunks);
  const systemPrompt = kb === "compliance" ? COMPLIANCE_SYSTEM_PROMPT : HR_SYSTEM_PROMPT;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "system",
        content: `Context documents:\n\n${context}`,
      },
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  });

  const content =
    response.choices[0]?.message?.content ??
    "I was unable to generate a response. Please try again.";

  const citations = filterUsedCitations(allCitations, content);

  return { content, citations };
}

export async function* streamRAGResponse(params: {
  message: string;
  kb: KnowledgeBase;
  history?: { role: "user" | "assistant"; content: string }[];
}): AsyncGenerator<{ type: "content" | "citations"; data: string | Citation[] }> {
  const { message, kb, history = [] } = params;
  const chunks = await retrieveChunks(message, kb, 5);

  if (chunks.length === 0) {
    yield {
      type: "content",
      data:
        kb === "compliance"
          ? "The compliance knowledge base is empty or has no relevant documents."
          : "The HR knowledge base is empty or has no relevant documents.",
    };
    yield { type: "citations", data: [] };
    return;
  }

  const context = buildContextFromChunks(chunks);
  const allCitations = chunksToCitations(chunks);
  const systemPrompt = kb === "compliance" ? COMPLIANCE_SYSTEM_PROMPT : HR_SYSTEM_PROMPT;

  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Context documents:\n\n${context}` },
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
    temperature: 0.2,
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
