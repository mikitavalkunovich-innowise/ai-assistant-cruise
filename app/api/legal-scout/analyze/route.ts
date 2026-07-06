import { runLegalAnalysis } from "@/lib/legal-scout/orchestrator";
import type { ProgressEvent } from "@/lib/legal-scout/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function sseEncode(event: ProgressEvent | { type: "result"; data: unknown } | { type: "error"; message: string }) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent | { type: "result"; data: unknown } | { type: "error"; message: string }) => {
        controller.enqueue(encoder.encode(sseEncode(event)));
      };

      try {
        if (!process.env.OPENAI_API_KEY) {
          send({ type: "error", message: "OPENAI_API_KEY not configured" });
          controller.close();
          return;
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const query = (formData.get("query") as string | null)?.trim();

        if (!file) {
          send({ type: "error", message: "No document uploaded" });
          controller.close();
          return;
        }

        if (!query) {
          send({ type: "error", message: "Please describe your legal question" });
          controller.close();
          return;
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const result = await runLegalAnalysis({
          fileBuffer: buffer,
          fileName: file.name,
          userQuery: query,
          onProgress: (event) => send(event),
        });

        send({
          type: "result",
          data: {
            conclusion: result.conclusion,
            docxBase64: result.docxBase64,
            offlineMode: result.offlineMode,
            documentText: result.documentText,
            ocrUsed: result.ocrUsed,
            documentAnalysis: result.documentAnalysis,
            statuteExcerpts: result.statuteExcerpts,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
