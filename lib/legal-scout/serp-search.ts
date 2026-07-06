import type { SerpResult } from "./types";

export function isSerpApiConfigured(): boolean {
  return Boolean(process.env.SERPAPI_TOKEN);
}

export async function searchWeb(query: string, num = 5): Promise<SerpResult[]> {
  const token = process.env.SERPAPI_TOKEN;
  if (!token) return [];

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: token,
    num: String(num),
    hl: "en",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    organic_results?: { title?: string; link?: string; snippet?: string }[];
  };

  return (data.organic_results ?? [])
    .filter((r) => r.link)
    .slice(0, num)
    .map((r) => ({
      title: r.title ?? "Untitled",
      link: r.link!,
      snippet: r.snippet ?? "",
    }));
}
