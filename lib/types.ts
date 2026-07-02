export type KnowledgeBase = "hr" | "compliance" | "sandbox";

export interface RagSearchSettings {
  topK: number;
  minSimilarity: number;
}

export const DEFAULT_RAG_SETTINGS: RagSearchSettings = {
  topK: 8,
  minSimilarity: 0.12,
};

export interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber: number | null;
  documentTitle: string;
  documentId: string;
  sourceUrl: string | null;
  similarity: number;
}

export interface Citation {
  index: number;
  documentTitle: string;
  pageNumber: number | null;
  excerpt: string;
  sourceUrl: string | null;
  chunkId: string;
  similarity?: number;
}

export type Severity = "info" | "warning" | "critical";

export interface RegulatoryAlert {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  sourceName: string;
  sourceUrl: string | null;
  changeDetected: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface ScanRun {
  id: string;
  status: string;
  itemsFetched: number;
  alertsCreated: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  certification: string;
  dueDate: string;
  daysOverdue: number;
  managerId: string;
  managerName: string;
  managerEmail: string;
  status: "overdue" | "expiring";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface DemoUser {
  email: string;
  password: string;
  role: "employee" | "newhire" | "officer" | "manager";
  displayName: string;
}

export const ONBOARDING_STEPS = [
  { id: "welcome", title: "Complete welcome orientation", description: "Attend ship/hotel orientation session" },
  { id: "documents", title: "Submit required documents", description: "Passport copy, medical certificate, bank details" },
  { id: "uniform", title: "Collect uniform and ID badge", description: "Visit crew services on embarkation day" },
  { id: "safety", title: "Complete mandatory safety training", description: "Fire safety, muster drill, emergency procedures" },
  { id: "it_setup", title: "Set up IT accounts", description: "Email, crew portal, timekeeping system" },
  { id: "department", title: "Meet your department head", description: "Introduction meeting within first 48 hours" },
  { id: "payroll", title: "Review payroll and benefits", description: "Confirm salary, deductions, and benefit elections" },
] as const;
