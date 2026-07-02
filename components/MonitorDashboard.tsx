"use client";

import { useEffect, useState } from "react";
import type { RegulatoryAlert, ScanRun } from "@/lib/types";
import { AlertCard } from "./AlertCard";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MonitorDashboardProps {
  initialAlerts: RegulatoryAlert[];
  initialScanRuns: ScanRun[];
}

export function MonitorDashboard({ initialAlerts, initialScanRuns }: MonitorDashboardProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [scanRuns, setScanRuns] = useState(initialScanRuns);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanErrors, setScanErrors] = useState<{ source: string; error: string }[]>([]);

  useEffect(() => {
    setAlerts(initialAlerts);
    setScanRuns(initialScanRuns);
  }, [initialAlerts, initialScanRuns]);

  const runScan = async (demo = false) => {
    setScanning(true);
    setError(null);
    setScanErrors([]);
    try {
      const res = await fetch("/api/compliance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo ? { demo: true } : { demo: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setAlerts((prev) => [...data.alerts, ...prev]);
      setScanRuns((prev) => [data.scanRun, ...prev]);
      if (data.errors?.length > 0 && !data.usedMock) setScanErrors(data.errors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Regulatory Monitor</h2>
          <p className="text-sm text-gray-500">
            Agent 1A — scans IMO, USCG, CDC VSP RSS feeds daily
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => runScan(true)} className="btn-secondary" disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Demo Alerts"
            )}
          </button>
          <button onClick={() => runScan(false)} className="btn-primary" disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run Scan Now
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        Prototype demo — use &ldquo;Load Demo Alerts&rdquo; for sample data, or &ldquo;Run Scan Now&rdquo; for live RSS feeds.
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {scanErrors.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Some feeds unavailable:</p>
          <ul className="mt-1 list-inside list-disc">
            {scanErrors.map((e) => (
              <li key={e.source}>
                {e.source}: {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scanRuns.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-ncl-blue">{scanRuns[0].itemsFetched}</p>
            <p className="text-xs text-gray-500">Items analyzed (last scan)</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">{scanRuns[0].alertsCreated}</p>
            <p className="text-xs text-gray-500">Alerts created</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-600">
              {scanRuns[0].completedAt ? formatDate(scanRuns[0].completedAt) : "—"}
            </p>
            <p className="text-xs text-gray-500">Last scan</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p>
              No alerts yet. Click &ldquo;Load Demo Alerts&rdquo; for sample data or &ldquo;Run Scan
              Now&rdquo; to scan live RSS feeds.
            </p>
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
