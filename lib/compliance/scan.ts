import { withClient } from "@/lib/db/client";
import { analyzeRegulatoryItem } from "@/lib/agents/analyzer";
import { fetchAllFeeds } from "@/lib/rss/fetch";
import { runMockComplianceScan, seedMockAlertsIfEmpty } from "@/lib/compliance/mock-monitor";
import { RSS_SOURCES } from "@/lib/rss/sources";
import type { RegulatoryAlert, ScanRun } from "@/lib/types";

export { seedMockAlertsIfEmpty };

function allFeedsFailed(errors: { source: string; error: string }[]): boolean {
  return errors.length >= RSS_SOURCES.length;
}

export async function runComplianceScan(maxItems = 8): Promise<{
  scanRun: ScanRun;
  alerts: RegulatoryAlert[];
  errors: { source: string; error: string }[];
  usedMock?: boolean;
  mode: "live" | "demo";
  message: string;
}> {
  console.log("[compliance-scan] Starting live RSS scan...");
  const startedAt = Date.now();
  const { items, errors } = await fetchAllFeeds(5);

  if (items.length === 0) {
    console.warn("[compliance-scan] No RSS items — falling back to demo alerts");
    const result = await runMockComplianceScan({ showFeedErrors: false });
    return {
      ...result,
      mode: "demo",
      message: "RSS feeds returned no items — demo alerts loaded instead.",
    };
  }

  const scanRunId = await withClient(async (client) => {
    const result = await client.query(
      `INSERT INTO scan_runs (status) VALUES ('running') RETURNING id`
    );
    return result.rows[0].id as string;
  });

  try {
    const itemsToAnalyze = items.slice(0, maxItems);
    const alerts: RegulatoryAlert[] = [];

    console.log(`[compliance-scan] Analyzing ${itemsToAnalyze.length} items with GPT...`);

    for (let i = 0; i < itemsToAnalyze.length; i++) {
      const item = itemsToAnalyze[i];
      console.log(`[compliance-scan] [${i + 1}/${itemsToAnalyze.length}] ${item.sourceName}: ${item.title.slice(0, 60)}`);
      const analysis = await analyzeRegulatoryItem(item);
      console.log(
        `[compliance-scan] [${i + 1}/${itemsToAnalyze.length}] change_detected=${analysis.change_detected}, severity=${analysis.severity}`
      );
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
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    if (alerts.length === 0 && allFeedsFailed(errors)) {
      console.warn("[compliance-scan] All feeds failed — falling back to demo alerts");
      const result = await runMockComplianceScan({ showFeedErrors: false });
      return {
        ...result,
        mode: "demo",
        message: "All RSS feeds failed — demo alerts loaded instead.",
      };
    }

    const message =
      alerts.length > 0
        ? `Live scan complete in ${elapsed}s: ${itemsToAnalyze.length} items analyzed, ${alerts.length} regulatory alert(s) created.`
        : `Live scan complete in ${elapsed}s: ${itemsToAnalyze.length} items analyzed, no regulatory changes detected in latest headlines.`;

    console.log(`[compliance-scan] ${message}`);

    return { scanRun: scanRun!, alerts, errors, usedMock: false, mode: "live", message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    console.error("[compliance-scan] Live scan failed:", message);
    await withClient(async (client) => {
      await client.query(
        `UPDATE scan_runs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
        [message, scanRunId]
      );
    });
    const result = await runMockComplianceScan({ showFeedErrors: false });
    return {
      ...result,
      mode: "demo",
      message: `Live scan error (${message}) — demo alerts loaded instead.`,
    };
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
