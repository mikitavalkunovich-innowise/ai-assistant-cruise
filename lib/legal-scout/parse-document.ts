import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    const text = parsed.text.trim();
    if (!text) throw new Error("No readable text in PDF");
    return text;
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    if (!text) throw new Error("No readable text in DOCX");
    return text;
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = buffer.toString("utf-8").trim();
    if (!text) throw new Error("Empty text file");
    return text;
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}
