import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { SYNTHESIS_PROMPT } from "./prompts";
import type { DocumentAnalysis, LegalConclusion, StatuteExcerpt } from "./types";

export async function synthesizeConclusion(params: {
  userQuery: string;
  docAnalysis: DocumentAnalysis;
  statuteExcerpts: StatuteExcerpt[];
}): Promise<LegalConclusion> {
  const { userQuery, docAnalysis, statuteExcerpts } = params;
  const openai = getOpenAI();

  const statuteContext = statuteExcerpts
    .map(
      (s, i) =>
        `[${i + 1}] ${s.article_reference} (${s.jurisdiction})\nURL: ${s.source_url}\n${s.excerpt_full_text}`
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYNTHESIS_PROMPT },
      {
        role: "user",
        content: `USER QUESTION:\n${userQuery}\n\nDOCUMENT ANALYSIS:\n${JSON.stringify(docAnalysis, null, 2)}\n\nSTATUTORY RESEARCH:\n${statuteContext || "No statutes found"}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as LegalConclusion;

  return {
    conclusion_title: parsed.conclusion_title ?? "Legal Analysis Conclusion",
    executive_summary: parsed.executive_summary ?? "",
    overall_risk: parsed.overall_risk ?? "medium",
    success_likelihood: parsed.success_likelihood ?? "uncertain",
    findings: parsed.findings ?? [],
    recommended_actions: parsed.recommended_actions ?? [],
    disclaimer:
      parsed.disclaimer ??
      "This is an AI-generated preliminary analysis and does not constitute legal advice. Consult a qualified attorney.",
  };
}
