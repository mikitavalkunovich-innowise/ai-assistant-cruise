import pdfParse from "pdf-parse";
import { getOpenAI } from "@/lib/openai";

const OCR_MODEL = "gpt-4o-mini";
const MAX_OCR_PAGES = 20;
const OCR_SCALE = 2;

type PdfRenderer = (typeof import("pdf-to-img"))["pdf"];

let pdfRenderer: PdfRenderer | null = null;

async function loadPdfRenderer(): Promise<PdfRenderer> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");

  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const { pdf } = await import("pdf-to-img");
  return pdf;
}

async function getPdfRenderer() {
  if (!pdfRenderer) {
    pdfRenderer = await loadPdfRenderer();
  }
  return pdfRenderer;
}

async function ocrPageImage(
  image: Buffer,
  pageNum: number,
  totalPages: number
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: OCR_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract ALL visible text from this document page (${pageNum} of ${totalPages}). Preserve the original language, spelling, numbers, and paragraph breaks. Output only the extracted text with no commentary.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${image.toString("base64")}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function extractTextFromPdfWithOcr(
  buffer: Buffer,
  onStatus?: (message: string) => void
): Promise<string> {
  onStatus?.("No text layer detected — running OCR on scanned pages...");

  const pdf = await getPdfRenderer();
  const dataUrl = `data:application/pdf;base64,${buffer.toString("base64")}`;
  const doc = await pdf(dataUrl, { scale: OCR_SCALE });

  const pageImages: Buffer[] = [];
  for await (const page of doc) {
    pageImages.push(page);
    if (pageImages.length >= MAX_OCR_PAGES) break;
  }

  if (pageImages.length === 0) {
    throw new Error("Could not render PDF pages for OCR");
  }

  if (pageImages.length === MAX_OCR_PAGES) {
    onStatus?.(`OCR processing first ${MAX_OCR_PAGES} pages...`);
  } else {
    onStatus?.(`OCR processing ${pageImages.length} page(s)...`);
  }

  const pageTexts: string[] = [];
  for (let i = 0; i < pageImages.length; i++) {
    onStatus?.(`OCR: reading page ${i + 1} of ${pageImages.length}...`);
    const text = await ocrPageImage(pageImages[i], i + 1, pageImages.length);
    if (text) pageTexts.push(text);
  }

  const combined = pageTexts.join("\n\n---\n\n").trim();
  if (!combined) {
    throw new Error("OCR could not extract text from this PDF");
  }

  onStatus?.(`OCR complete (${combined.length.toLocaleString()} characters extracted)`);
  return combined;
}

export interface PdfExtractResult {
  text: string;
  ocrUsed: boolean;
}

export async function extractPdfText(
  buffer: Buffer,
  onStatus?: (message: string) => void
): Promise<PdfExtractResult> {
  const parsed = await pdfParse(buffer);
  const directText = parsed.text.trim();

  if (directText) {
    return { text: directText, ocrUsed: false };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to OCR scanned PDFs");
  }

  const ocrText = await extractTextFromPdfWithOcr(buffer, onStatus);
  return { text: ocrText, ocrUsed: true };
}
