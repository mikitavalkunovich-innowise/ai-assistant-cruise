import fs from "fs";
import path from "path";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { RESEARCH_PLANNER_PROMPT, STATUTE_EXTRACTION_PROMPT } from "./prompts";
import { searchWeb, isSerpApiConfigured } from "./serp-search";
import type { DocumentAnalysis, StatuteExcerpt } from "./types";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LegalScoutBot/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html).slice(0, 8000);
  } catch {
    return "";
  }
}

async function extractStatutesFromPage(
  query: string,
  url: string,
  pageText: string,
  snippet: string
): Promise<StatuteExcerpt[]> {
  if (!pageText && !snippet) return [];

  const openai = getOpenAI();
  const content = pageText || snippet;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: STATUTE_EXTRACTION_PROMPT },
      {
        role: "user",
        content: `SEARCH QUERY: ${query}\nSOURCE URL: ${url}\n\nPAGE CONTENT:\n${content.slice(0, 6000)}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as {
    extractions?: {
      title: string;
      jurisdiction: string;
      article_reference: string;
      excerpt_full_text: string;
      relevance_score: number;
    }[];
  };

  return (parsed.extractions ?? [])
    .filter((e) => e.excerpt_full_text?.length > 40)
    .map((e) => ({
      title: e.title,
      jurisdiction: e.jurisdiction,
      article_reference: e.article_reference,
      excerpt_full_text: e.excerpt_full_text,
      source_url: url,
      relevance_score: e.relevance_score ?? 0.5,
      search_query: query,
    }));
}

export async function planResearchQueries(
  userQuery: string,
  docAnalysis: DocumentAnalysis
): Promise<{ queries: string[]; language: string }> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: RESEARCH_PLANNER_PROMPT },
      {
        role: "user",
        content: `USER QUESTION: ${userQuery}\n\nDOCUMENT ANALYSIS:\n${JSON.stringify(docAnalysis, null, 2)}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as {
    queries?: string[];
    language?: string;
  };

  const fromPlanner = (parsed.queries ?? []).slice(0, 3);
  const language = parsed.language ?? "en";

  if (fromPlanner.length > 0) {
    return { queries: fromPlanner, language };
  }

  return {
    queries: (docAnalysis.search_topics ?? []).slice(0, 3),
    language,
  };
}

function loadOfflineStatutes(): StatuteExcerpt[] {
  const filePath = path.join(process.cwd(), "data/mock/legal-scout/sample-labor-code-excerpt.md");
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  const sections = content.split(/^## /m).filter(Boolean);

  return sections.slice(0, 4).map((section, i) => {
    const lines = section.trim().split("\n");
    const title = lines[0]?.trim() ?? `Provision ${i + 1}`;
    const body = lines.slice(1).join("\n").trim();
    return {
      title: "Sample Labor Code (offline demo)",
      jurisdiction: "Demo jurisdiction",
      article_reference: title,
      excerpt_full_text: body.slice(0, 1500),
      source_url: "https://example.com/offline-demo",
      relevance_score: 0.7,
      search_query: "offline demo",
    };
  });
}

export async function researchLegalNorms(params: {
  userQuery: string;
  docAnalysis: DocumentAnalysis;
  onLog?: (message: string) => void;
}): Promise<{ excerpts: StatuteExcerpt[]; offlineMode: boolean }> {
  const { userQuery, docAnalysis, onLog } = params;

  if (!isSerpApiConfigured()) {
    onLog?.("SERPAPI_TOKEN not set — using offline sample statutes");
    return { excerpts: loadOfflineStatutes(), offlineMode: true };
  }

  const { queries, language } = await planResearchQueries(userQuery, docAnalysis);
  onLog?.(`Planning ${queries.length} search queries (language: ${language})`);

  const allExcerpts: StatuteExcerpt[] = [];

  await Promise.all(
    queries.map(async (query) => {
      onLog?.(`Searching: "${query}"`);
      let results;
      try {
        results = await searchWeb(query, 5, language);
      } catch (err) {
        onLog?.(`Search failed: ${err instanceof Error ? err.message : "unknown"}`);
        return;
      }

      onLog?.(`Found ${results.length} results for "${query}"`);

      const topResults = results.slice(0, 3);
      for (const result of topResults) {
        onLog?.(`Fetching: ${result.link}`);
        const pageText = await fetchPageText(result.link);
        const extracted = await extractStatutesFromPage(
          query,
          result.link,
          pageText,
          result.snippet
        );
        allExcerpts.push(...extracted);
      }
    })
  );

  if (allExcerpts.length === 0) {
    onLog?.("No web results — falling back to offline sample statutes");
    return { excerpts: loadOfflineStatutes(), offlineMode: true };
  }

  const ranked = allExcerpts
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 8);

  return { excerpts: ranked, offlineMode: false };
}
