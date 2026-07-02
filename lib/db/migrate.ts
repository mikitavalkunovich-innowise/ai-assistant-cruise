import { withClient } from "./client";

export async function runMigrations(): Promise<void> {
  await withClient(async (client) => {
    // Standard Railway Postgres has no pgvector — embeddings stored as JSONB
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        source_url TEXT,
        kb TEXT NOT NULL CHECK (kb IN ('hr', 'compliance')),
        file_type TEXT NOT NULL DEFAULT 'text',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Recreate chunks if upgrading from pgvector schema
    const chunksCheck = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'chunks' AND column_name = 'embedding'
    `);

    const needsRecreate =
      chunksCheck.rows.length > 0 &&
      chunksCheck.rows[0].data_type !== "jsonb";

    if (needsRecreate) {
      await client.query("DROP TABLE IF EXISTS chunks CASCADE");
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_number INTEGER,
        chunk_index INTEGER NOT NULL,
        embedding JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks(document_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_run_id UUID,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
        source_name TEXT NOT NULL,
        source_url TEXT,
        change_detected BOOLEAN NOT NULL DEFAULT true,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scan_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status TEXT NOT NULL DEFAULT 'running',
        items_fetched INTEGER NOT NULL DEFAULT 0,
        alerts_created INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS demo_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('employee', 'newhire', 'officer', 'manager')),
        display_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email TEXT NOT NULL,
        step_id TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMPTZ,
        UNIQUE(user_email, step_id)
      )
    `);
  });
}
