import { NextRequest, NextResponse } from "next/server";
import { ingestDocument, listDocuments, clearKnowledgeBase } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

const SANDBOX_KB = "sandbox" as const;

export async function GET() {
  try {
    const documents = await listDocuments(SANDBOX_KB);
    return NextResponse.json({ documents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
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
      kb: SANDBOX_KB,
      fileType: file.name.split(".").pop() ?? "text",
    });

    return NextResponse.json({
      success: true,
      documentId,
      title: docTitle,
      contentLength: content.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const deleted = await clearKnowledgeBase(SANDBOX_KB);
    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clear failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
