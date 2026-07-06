import type { Metadata } from "next";
import { LegalScoutPage } from "@/components/LegalScoutPage";

export const metadata: Metadata = {
  title: "AI Lawyer Scout",
  description: "Upload a legal document, describe your case by voice, and receive a cited legal conclusion as DOCX.",
};

export default function Page() {
  return <LegalScoutPage />;
}
