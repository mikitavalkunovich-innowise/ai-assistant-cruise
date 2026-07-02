import type { Metadata } from "next";
import { PdfExtractorPage } from "@/components/PdfExtractorPage";

export const metadata: Metadata = {
  title: "PDF Data Extractor",
  description: "Upload a PDF and extract structured data into a custom JSON schema.",
};

export default function Page() {
  return <PdfExtractorPage />;
}
