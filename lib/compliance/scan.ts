import { withClient } from "@/lib/db/client";
import { analyzeRegulatoryItem } from "@/lib/agents/analyzer";
import { fetchAllFeeds } from "@/lib/rss/fetch";
import type { RegulatoryAlert, ScanRun } from "@/lib/types";

export async function runComplianceScan(maxItems = 8): Promise<{
  scanRun: ScanRun;
  alerts: RegulatoryAlert[];
  errors: { source: string; error: string }[];
}> {
  const scanRunId = await withClient(async (client) => {
    const result = await client.query(
      `INSERT INTO scan_runs (status) VALUES ('running') RETURNING id`
    );
    return result.rows[0].id as string;
  });

  try {
    const { items, errors } = await fetchAllFeeds(5);
    const itemsToAnalyze = items.slice(0, maxItems);
    const alerts: RegulatoryAlert[] = [];

    for (const item of itemsToAnalyze) {
      const analysis = await analyzeRegulatoryItem(item);
      if (!analysis.change_detected) continue;

      const alert = await withClient(async (client) => {
        const result = await client.query(
          `INSERT INTO alerts (scan_run_id, title, summary, severity, source_name, source_url, change_detected, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, $7)
           RETURNING id, title, summary, severity, source_name, source_url, change_detected, published_at, created_at`,
          [
            scanRunId,
            analysis.title,
            analysis.summary,
            analysis.severity,
            item.sourceName,
            item.link,
            item.pubDate ? new Date(item.pubDate).toISOString() : null,
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
        [itemsToAnalyze.length, alerts.length, scanRunId]
      );
    });

    const scanRun = await getScanRun(scanRunId);
    return { scanRun: scanRun!, alerts, errors };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    await withClient(async (client) => {
      await client.query(
        `UPDATE scan_runs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
        [message, scanRunId]
      );
    });
    throw err;
  }
}

async function getScanRun(id: string): Promise<ScanRun | null> {
  return withClient(async (client) => {
    const result = await client.query(`SELECT * FROM scan_runs WHERE id = $1`, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      status: row.status,
      itemsFetched: row.items_fetched,
      alertsCreated: row.alerts_created,
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  });
}

export async function getAlerts(limit = 50): Promise<RegulatoryAlert[]> {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT id, title, summary, severity, source_name, source_url, change_detected, published_at, created_at
       FROM alerts ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      severity: row.severity,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      changeDetected: row.change_detected,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    }));
  });
}

export async function getScanRuns(limit = 10): Promise<ScanRun[]> {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      itemsFetched: row.items_fetched,
      alertsCreated: row.alerts_created,
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }));
  });
}
