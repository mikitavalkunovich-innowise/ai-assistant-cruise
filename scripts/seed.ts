import fs from "fs";
import path from "path";
import { runMigrations } from "../lib/db/migrate";
import { withClient } from "../lib/db/client";
import { ingestDocument, getDocumentCount, getChunkCount } from "../lib/rag/ingest";

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

async function main() {
  console.log("Running migrations...");
  await runMigrations();

  const existingHr = await getDocumentCount("hr");
  const existingCompliance = await getDocumentCount("compliance");
  const chunkCount = await getChunkCount();

  if (chunkCount === 0 && (existingHr > 0 || existingCompliance > 0)) {
    console.log("Documents exist but no embeddings — clearing and re-seeding...");
    await withClient((client) => client.query("DELETE FROM documents"));
  } else if (chunkCount > 0) {
    console.log(
      `KB already seeded (${existingHr} HR, ${existingCompliance} compliance docs, ${chunkCount} chunks). Skipping.`
    );
    process.exit(0);
  }

  console.log("Seeding knowledge base documents...");
  const root = path.join(__dirname, "..");

  const hrCount = await seedMarkdownFiles(
    path.join(root, "data/mock/hr-policies"),
    "hr"
  );
  const complianceCount = await seedMarkdownFiles(
    path.join(root, "data/mock/compliance-regulations"),
    "compliance"
  );

  console.log(`\nSeed complete: ${hrCount} HR docs, ${complianceCount} compliance docs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
