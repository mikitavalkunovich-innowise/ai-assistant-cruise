"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MonitorDashboard } from "@/components/MonitorDashboard";
import { Chat } from "@/components/Chat";
import { TrainingTable } from "@/components/TrainingTable";
import type { RegulatoryAlert, ScanRun, TrainingRecord } from "@/lib/types";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/compliance", label: "Monitor", segment: "" },
  { href: "/compliance/qa", label: "Q&A", segment: "qa" },
  { href: "/compliance/training", label: "Training", segment: "training" },
];

export default function CompliancePage() {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const activeTab =
    pathname === "/compliance/qa"
      ? "qa"
      : pathname === "/compliance/training"
        ? "training"
        : "monitor";

  useEffect(() => {
    if (activeTab === "monitor") {
      fetch("/api/compliance/scan")
        .then((r) => r.json())
        .then((data) => {
          setAlerts(data.alerts ?? []);
          setScanRuns(data.scanRuns ?? []);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    } else if (activeTab === "training") {
      fetch("/api/compliance/training")
        .then((r) => r.json())
        .then((data) => {
          setRecords(data.records ?? []);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ncl-navy">Marine Safety & Compliance Auditor</h1>
        <p className="text-sm text-gray-500">
          Agents 1A (regulatory monitor), 1B (training compliance), 2 (Q&A)
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive =
            tab.segment === ""
              ? pathname === "/compliance"
              : pathname === `/compliance/${tab.segment}`;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
                isActive
                  ? "border-ncl-blue text-ncl-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {!loaded ? (
        <div className="card text-center py-12 text-gray-500">Loading...</div>
      ) : activeTab === "monitor" ? (
        <MonitorDashboard initialAlerts={alerts} initialScanRuns={scanRuns} />
      ) : activeTab === "qa" ? (
        <div className="card h-[calc(100vh-16rem)] overflow-hidden p-0">
          <Chat
            kb="compliance"
            placeholder="Ask about regulations, certifications, inspection requirements..."
            suggestions={[
              "What are USPH galley inspection requirements?",
              "Which STCW certifications are required for all seafarers?",
              "What are USCG Port State Control deficiency codes?",
              "What temperature must hot foods be held at?",
            ]}
          />
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Training Compliance</h2>
            <p className="text-sm text-gray-500">
              Agent 1B — mock SAP SuccessFactors data. Preview Teams notifications.
            </p>
          </div>
          <TrainingTable records={records} />
        </div>
      )}
    </div>
  );
}
