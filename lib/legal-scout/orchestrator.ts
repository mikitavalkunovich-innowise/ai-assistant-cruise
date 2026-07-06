import { extractTextFromFile } from "./parse-document";
import { InMemoryRag } from "./in-memory-rag";
import { analyzeDocument } from "./document-agent";
import { researchLegalNorms } from "./research-agent";
import { synthesizeConclusion } from "./synthesis-agent";
import { generateLegalDocx } from "./generate-docx";
import type { AnalysisResult, ProgressEvent } from "./types";

export async function runLegalAnalysis(params: {
  fileBuffer: Buffer;
  fileName: string;
  userQuery: string;
  onProgress?: (event: ProgressEvent) => void;
}): Promise<AnalysisResult> {
  const { fileBuffer, fileName, userQuery, onProgress } = params;
  const emit = (step: ProgressEvent["step"], message: string, extra?: Partial<ProgressEvent>) => {
    onProgress?.({ step, message, ...extra });
  };

  emit("parsing_document", "Extracting text from uploaded document...");
  const { text: documentText, ocrUsed } = await extractTextFromFile(fileBuffer, fileName, {
    onStatus: (msg) => emit("parsing_document", msg),
  });

  emit("parsing_document", `Indexed document (${documentText.length.toLocaleString()} characters)`);
  const rag = new InMemoryRag();
  const chunkCount = await rag.indexDocument(documentText);
  emit("parsing_document", `Created ${chunkCount} searchable chunks`);

  emit("analyzing_document", "Analyzing document clauses and identifying issues...");
  const documentAnalysis = await analyzeDocument({
    userQuery,
    documentText,
    rag,
  });
  emit(
    "analyzing_document",
    `Found ${documentAnalysis.potential_issues.length} potential issues, ${documentAnalysis.key_clauses.length} key clauses`
  );

  emit("researching_web", "Searching applicable statutes and regulations...");
  const { excerpts: statuteExcerpts, offlineMode } = await researchLegalNorms({
    userQuery,
    docAnalysis: documentAnalysis,
    onLog: (msg) => emit("researching_web", msg),
  });
  emit(
    "researching_web",
    offlineMode
      ? `Using offline sample statutes (${statuteExcerpts.length} provisions)`
      : `Found ${statuteExcerpts.length} relevant statutory excerpts`,
    { offlineMode }
  );

  emit("synthesizing", "Drafting legal conclusion with citations...");
  const conclusion = await synthesizeConclusion({
    userQuery,
    docAnalysis: documentAnalysis,
    statuteExcerpts,
  });
  emit("synthesizing", `Conclusion ready: ${conclusion.findings.length} findings`);

  emit("generating_docx", "Generating DOCX document...");
  const docxBuffer = await generateLegalDocx(conclusion);
  emit("generating_docx", "DOCX document generated");

  emit("done", "Analysis complete");

  return {
    conclusion,
    docxBase64: docxBuffer.toString("base64"),
    offlineMode,
    documentText,
    ocrUsed,
    documentAnalysis,
    statuteExcerpts,
  };
}
