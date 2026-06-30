import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag/ingest";
import type { KnowledgeBase } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kb = formData.get("kb") as KnowledgeBase | null;
    const title = formData.get("title") as string | null;

    if (!file || !kb) {
      return NextResponse.json({ error: "file and kb are required" }, { status: 400 });
    }

    if (!["hr", "compliance"].includes(kb)) {
      return NextResponse.json({ error: "kb must be hr or compliance" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = "";
    const docTitle = title || file.name.replace(/\.[^.]+$/, "");

    if (file.name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      content = parsed.text;
    } else if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      content = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Supported formats: PDF, MD, TXT" },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "File appears to be empty" }, { status: 400 });
    }

    const documentId = await ingestDocument({
      title: docTitle,
      content,
      kb,
      fileType: file.name.split(".").pop() ?? "text",
    });

    return NextResponse.json({
      success: true,
      documentId,
      title: docTitle,
      kb,
      contentLength: content.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
