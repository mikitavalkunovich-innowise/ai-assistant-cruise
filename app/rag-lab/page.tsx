import type { Metadata } from "next";
import { RagLabPage } from "@/components/RagLabPage";

export const metadata: Metadata = {
  title: "RAG Lab — Document Q&A Sandbox",
  description: "Upload documents and test retrieval-augmented generation with adjustable search settings.",
};

export default function Page() {
  return <RagLabPage />;
}
