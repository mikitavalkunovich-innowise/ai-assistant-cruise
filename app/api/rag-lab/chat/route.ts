import { NextRequest, NextResponse } from "next/server";
import { streamRagLabResponse } from "@/lib/agents/rag-lab";
import { DEFAULT_RAG_SETTINGS, type RagSearchSettings } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseSettings(raw: Partial<RagSearchSettings> | undefined): RagSearchSettings {
  const topK = Math.min(20, Math.max(1, Number(raw?.topK ?? DEFAULT_RAG_SETTINGS.topK)));
  const minSimilarity = Math.min(
    0.9,
    Math.max(0, Number(raw?.minSimilarity ?? DEFAULT_RAG_SETTINGS.minSimilarity))
  );
  return { topK, minSimilarity };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, settings } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      settings?: Partial<RagSearchSettings>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const searchSettings = parseSettings(settings);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamRagLabResponse({
            message,
            history,
            settings: searchSettings,
          })) {
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", data: error }) + "\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
