export type RiskLevel = "high" | "medium" | "low";
export type SuccessLikelihood = "high" | "medium" | "low" | "uncertain";

export interface DocumentCitation {
  excerpt: string;
  location: string;
}

export interface StatuteCitation {
  reference: string;
  full_text: string;
  source_url: string;
}

export interface LegalFinding {
  id: number;
  title: string;
  risk_level: RiskLevel;
  analysis: string;
  document_citations: DocumentCitation[];
  statute_citations: StatuteCitation[];
}

export interface LegalConclusion {
  conclusion_title: string;
  executive_summary: string;
  overall_risk: RiskLevel;
  success_likelihood: SuccessLikelihood;
  findings: LegalFinding[];
  recommended_actions: string[];
  disclaimer: string;
}

export interface DocumentAnalysis {
  summary: string;
  core_question: string;
  parties: { role: string; name: string }[];
  key_clauses: { title: string; excerpt: string; location: string }[];
  potential_issues: { issue: string; clause_location: string; severity: RiskLevel }[];
  search_topics: string[];
  jurisdiction_hint: string;
}

export interface StatuteExcerpt {
  title: string;
  jurisdiction: string;
  article_reference: string;
  excerpt_full_text: string;
  source_url: string;
  relevance_score: number;
  search_query: string;
}

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
}

export type AnalysisStep =
  | "transcribing"
  | "parsing_document"
  | "analyzing_document"
  | "researching_web"
  | "synthesizing"
  | "generating_docx"
  | "done"
  | "error";

export interface ProgressEvent {
  step: AnalysisStep;
  message: string;
  offlineMode?: boolean;
}

export interface AnalysisResult {
  conclusion: LegalConclusion;
  docxBase64: string;
  offlineMode: boolean;
  documentText: string;
  ocrUsed: boolean;
  documentAnalysis: DocumentAnalysis;
  statuteExcerpts: StatuteExcerpt[];
}
