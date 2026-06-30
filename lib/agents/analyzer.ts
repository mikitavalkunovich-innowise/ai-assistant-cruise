import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import type { Severity } from "@/lib/types";

export interface RSSItem {
  title: string;
  link: string;
  content: string;
  pubDate: string | null;
  sourceName: string;
}

export interface AnalysisResult {
  change_detected: boolean;
  severity: Severity;
  summary: string;
  title: string;
  reasoning: string;
}

export async function analyzeRegulatoryItem(item: RSSItem): Promise<AnalysisResult> {
  const openai = getOpenAI();

  const prompt = `You are a maritime regulatory compliance analyst for Norwegian Cruise Lines.
Analyze this news item from a regulatory source and determine if it represents a genuine regulatory change, update, or compliance-relevant development.

Source: ${item.sourceName}
Title: ${item.title}
Published: ${item.pubDate ?? "unknown"}
Content: ${item.content.slice(0, 2000)}
URL: ${item.link}

Respond with JSON only:
{
  "change_detected": boolean,
  "severity": "info" | "warning" | "critical",
  "title": "concise alert title",
  "summary": "2-3 sentence summary for compliance officers",
  "reasoning": "brief explanation of classification"
}

Severity guide:
- critical: mandatory compliance change, safety issue, deadline, enforcement action
- warning: policy update, new guidance, upcoming requirement
- info: general news, awareness item, no immediate action needed

Set change_detected to false for routine news, press releases, or items with no compliance impact.`;

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as AnalysisResult;
    return {
      change_detected: Boolean(parsed.change_detected),
      severity: (["info", "warning", "critical"].includes(parsed.severity)
        ? parsed.severity
        : "info") as Severity,
      title: parsed.title || item.title,
      summary: parsed.summary || item.content.slice(0, 300),
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return {
      change_detected: false,
      severity: "info",
      title: item.title,
      summary: item.content.slice(0, 300),
      reasoning: "Analysis failed — item skipped",
    };
  }
}
