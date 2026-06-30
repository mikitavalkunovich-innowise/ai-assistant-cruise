import { runMigrations } from "../lib/db/migrate";

async function main() {
  console.log("Running database migrations...");
  await runMigrations();
  console.log("Migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
