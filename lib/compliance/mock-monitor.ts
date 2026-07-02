import fs from "fs";
import path from "path";
import { withClient } from "@/lib/db/client";
import type { RegulatoryAlert, ScanRun } from "@/lib/types";

interface MockAlertDefinition {
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}

export function getMockAlertDefinitions(): MockAlertDefinition[] {
  const filePath = path.join(process.cwd(), "data/mock/regulatory-alerts.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as MockAlertDefinition[];
}

export async function getAlertCount(): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM alerts`);
    return result.rows[0].count as number;
  });
}

export async function seedMockAlertsIfEmpty(): Promise<number> {
  const count = await getAlertCount();
  if (count > 0) return 0;

  const mocks = getMockAlertDefinitions();
  if (mocks.length === 0) return 0;

  const scanRunId = await withClient(async (client) => {
    const result = await client.query(
      `INSERT INTO scan_runs (status, items_fetched, alerts_created, completed_at)
       VALUES ('completed', $1, $1, NOW()) RETURNING id`,
      [mocks.length]
    );
    return result.rows[0].id as string;
  });

  for (const mock of mocks) {
    await withClient(async (client) => {
      await client.query(
        `INSERT INTO alerts (scan_run_id, title, summary, severity, source_name, source_url, change_detected, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [
          scanRunId,
          mock.title,
          mock.summary,
          mock.severity,
          mock.sourceName,
          mock.sourceUrl,
          mock.publishedAt,
        ]
      );
    });
  }

  console.log(`[db] Seeded ${mocks.length} demo regulatory alerts.`);
  return mocks.length;
}

export async function runMockComplianceScan(options?: {
  showFeedErrors?: boolean;
}): Promise<{
  scanRun: ScanRun;
  alerts: RegulatoryAlert[];
  errors: { source: string; error: string }[];
  usedMock: boolean;
  mode: "demo";
  message: string;
}> {
  const mocks = getMockAlertDefinitions();

  const scanRunId = await withClient(async (client) => {
    const result = await client.query(
      `INSERT INTO scan_runs (status) VALUES ('running') RETURNING id`
    );
    return result.rows[0].id as string;
  });

  const alerts: RegulatoryAlert[] = [];

  for (const mock of mocks) {
    const alert = await withClient(async (client) => {
      const result = await client.query(
        `INSERT INTO alerts (scan_run_id, title, summary, severity, source_name, source_url, change_detected, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)
         RETURNING id, title, summary, severity, source_name, source_url, change_detected, published_at, created_at`,
        [
          scanRunId,
          mock.title,
          mock.summary,
          mock.severity,
          mock.sourceName,
          mock.sourceUrl,
          mock.publishedAt,
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        severity: row.severity,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        changeDetected: row.change_detected,
        publishedAt: row.published_at,
        createdAt: row.created_at,
      } as RegulatoryAlert;
    });
    alerts.push(alert);
  }

  await withClient(async (client) => {
    await client.query(
      `UPDATE scan_runs SET status = 'completed', items_fetched = $1, alerts_created = $2, completed_at = NOW() WHERE id = $3`,
      [mocks.length, alerts.length, scanRunId]
    );
  });

  const scanRun = await withClient(async (client) => {
    const result = await client.query(`SELECT * FROM scan_runs WHERE id = $1`, [scanRunId]);
    const row = result.rows[0];
    return {
      id: row.id,
      status: row.status,
      itemsFetched: row.items_fetched,
      alertsCreated: row.alerts_created,
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    } as ScanRun;
  });

  return {
    scanRun,
    alerts,
    errors:
      options?.showFeedErrors === false
        ? []
        : [{ source: "RSS feeds", error: "Unavailable — demo alerts loaded instead" }],
    usedMock: true,
    mode: "demo" as const,
    message: `Demo scan complete: ${alerts.length} sample alert(s) loaded.`,
  };
}
