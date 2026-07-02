import fs from "fs";
import path from "path";
import { runMigrations } from "./migrate";
import { withClient } from "./client";
import { ingestDocument, getDocumentCount, getChunkCount } from "@/lib/rag/ingest";

async function seedMarkdownFiles(dir: string, kb: "hr" | "compliance") {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  let count = 0;
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const title = content.split("\n")[0].replace(/^#\s*/, "") || file;
    await ingestDocument({
      title,
      content,
      kb,
      sourceUrl: `file://${file}`,
      fileType: "markdown",
    });
    console.log(`  Ingested: ${title} (${kb})`);
    count++;
  }
  return count;
}

export async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[db] DATABASE_URL not set — skipping seed");
    return;
  }

  await runMigrations();

  const existingHr = await getDocumentCount("hr");
  const existingCompliance = await getDocumentCount("compliance");
  const chunkCount = await getChunkCount();

  if (chunkCount === 0 && (existingHr > 0 || existingCompliance > 0)) {
    console.log("[db] Documents exist but no embeddings — clearing and re-seeding...");
    await withClient((client) => client.query("DELETE FROM documents"));
  } else if (chunkCount > 0) {
    console.log(
      `[db] KB already seeded (${existingHr} HR, ${existingCompliance} compliance, ${chunkCount} chunks). Skipping.`
    );
    return;
  }

  console.log("[db] Seeding knowledge base documents...");
  const root = process.cwd();

  const hrCount = await seedMarkdownFiles(
    path.join(root, "data/mock/hr-policies"),
    "hr"
  );
  const complianceCount = await seedMarkdownFiles(
    path.join(root, "data/mock/compliance-regulations"),
    "compliance"
  );

  console.log(`[db] Seed complete: ${hrCount} HR docs, ${complianceCount} compliance docs.`);
}

export async function initializeDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[db] DATABASE_URL not set — skipping database initialization");
    return;
  }

  try {
    console.log("[db] Initializing database...");
    await runSeed();
    console.log("[db] Database ready.");
  } catch (err) {
    console.error("[db] Database initialization failed:", err);
    throw err;
  }
}
