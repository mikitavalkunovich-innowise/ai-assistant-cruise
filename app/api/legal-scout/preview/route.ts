import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/legal-scout/parse-document";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No document uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, ocrUsed } = await extractTextFromFile(buffer, file.name);

    return NextResponse.json({ text, fileName: file.name, ocrUsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
