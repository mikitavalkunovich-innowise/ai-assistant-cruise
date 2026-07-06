import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const contractPath = path.join(
    process.cwd(),
    "data/mock/legal-scout/sample-employment-contract.md"
  );

  if (!fs.existsSync(contractPath)) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  const content = fs.readFileSync(contractPath, "utf-8");
  const buffer = Buffer.from(content, "utf-8");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": 'attachment; filename="sample-employment-contract.md"',
    },
  });
}
