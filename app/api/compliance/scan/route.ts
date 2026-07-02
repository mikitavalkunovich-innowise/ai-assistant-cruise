import { NextResponse } from "next/server";
import {
  runComplianceScan,
  getAlerts,
  getScanRuns,
  seedMockAlertsIfEmpty,
} from "@/lib/compliance/scan";
import { runMockComplianceScan } from "@/lib/compliance/mock-monitor";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  try {
    await seedMockAlertsIfEmpty();
    const [alerts, scanRuns] = await Promise.all([getAlerts(), getScanRuns()]);
    return NextResponse.json({ alerts, scanRuns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch alerts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const demoOnly = body?.demo === true;

    if (demoOnly) {
      const result = await runMockComplianceScan({ showFeedErrors: false });
      return NextResponse.json(result);
    }

    if (!process.env.OPENAI_API_KEY) {
      const result = await runMockComplianceScan({ showFeedErrors: false });
      return NextResponse.json(result);
    }

    const result = await runComplianceScan(8);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
