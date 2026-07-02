import Parser from "rss-parser";
import { RSS_SOURCES } from "./sources";
import type { RSSItem } from "@/lib/agents/analyzer";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export interface FetchResult {
  items: RSSItem[];
  errors: { source: string; error: string }[];
}

export async function fetchAllFeeds(maxPerFeed = 5): Promise<FetchResult> {
  const items: RSSItem[] = [];
  const errors: { source: string; error: string }[] = [];

  console.log(`[rss] Fetching ${RSS_SOURCES.length} feeds (max ${maxPerFeed} items each)...`);

  await Promise.all(
    RSS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        const feedItems = (feed.items ?? []).slice(0, maxPerFeed);
        console.log(`[rss] ${source.name}: ${feedItems.length} items`);
        for (const item of feedItems) {
          items.push({
            title: item.title ?? "Untitled",
            link: item.link ?? source.url,
            content: stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? ""),
            pubDate: item.pubDate ?? item.isoDate ?? null,
            sourceName: source.name,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.warn(`[rss] ${source.name} failed: ${message}`);
        errors.push({ source: source.name, error: message });
      }
    })
  );

  console.log(`[rss] Total: ${items.length} items, ${errors.length} feed errors`);
  return { items, errors };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
