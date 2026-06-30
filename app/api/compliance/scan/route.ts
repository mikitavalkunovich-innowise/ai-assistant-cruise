import { NextResponse } from "next/server";
import { runComplianceScan, getAlerts, getScanRuns } from "@/lib/compliance/scan";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  try {
    const [alerts, scanRuns] = await Promise.all([getAlerts(), getScanRuns()]);
    return NextResponse.json({ alerts, scanRuns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch alerts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const result = await runComplianceScan(8);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
