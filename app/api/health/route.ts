import { NextResponse } from "next/server";

export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (!hasDb) {
    return NextResponse.json({
      status: "degraded",
      hrDocs: 0,
      complianceDocs: 0,
      openai: hasOpenAI,
      database: false,
      message: "DATABASE_URL not configured",
    });
  }

  try {
    const { getDocumentCount } = await import("@/lib/rag/ingest");
    const [hrDocs, complianceDocs] = await Promise.all([
      getDocumentCount("hr"),
      getDocumentCount("compliance"),
    ]);
    return NextResponse.json({
      status: "ok",
      hrDocs,
      complianceDocs,
      openai: hasOpenAI,
      database: true,
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      hrDocs: 0,
      complianceDocs: 0,
      openai: hasOpenAI,
      database: true,
      message: "Database connection failed",
    });
  }
}
