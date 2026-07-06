import mammoth from "mammoth";
import { extractPdfText } from "@/lib/pdf/extract-pdf-text";

export interface ExtractTextResult {
  text: string;
  ocrUsed: boolean;
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  options?: { onStatus?: (message: string) => void }
): Promise<ExtractTextResult> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    return extractPdfText(buffer, options?.onStatus);
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    if (!text) throw new Error("No readable text in DOCX");
    return { text, ocrUsed: false };
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = buffer.toString("utf-8").trim();
    if (!text) throw new Error("Empty text file");
    return { text, ocrUsed: false };
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}
