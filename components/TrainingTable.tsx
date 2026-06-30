"use client";

import { useState } from "react";
import type { TrainingRecord } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { Bell, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TrainingTableProps {
  records: TrainingRecord[];
}

export function TrainingTable({ records }: TrainingTableProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const showManagerPreview = async (managerEmail: string, managerName: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manager_preview", managerEmail }),
      });
      const data = await res.json();
      setPreview(data.preview);
      setPreviewTitle(`Teams Notification → ${managerName}`);
    } finally {
      setLoading(false);
    }
  };

  const showEmployeePreview = async (record: TrainingRecord) => {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "employee_preview", recordId: record.id }),
      });
      const data = await res.json();
      setPreview(data.preview);
      setPreviewTitle(`Teams Reminder → ${record.employeeName}`);
    } finally {
      setLoading(false);
    }
  };

  const managers = [...new Set(records.map((r) => r.managerEmail))];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {managers.map((email) => {
          const manager = records.find((r) => r.managerEmail === email);
          return (
            <button
              key={email}
              onClick={() => showManagerPreview(email, manager?.managerName ?? email)}
              className="btn-secondary text-xs"
              disabled={loading}
            >
              <Bell className="h-3.5 w-3.5" />
              Notify {manager?.managerName}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Certification</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{record.employeeName}</td>
                <td className="px-4 py-3">{record.certification}</td>
                <td className="px-4 py-3">{formatDate(record.dueDate)}</td>
                <td className="px-4 py-3">
                  <SeverityBadge
                    severity={record.daysOverdue > 14 ? "critical" : record.daysOverdue > 0 ? "warning" : "info"}
                  />
                  <span className="ml-2 text-xs text-gray-500">
                    {record.daysOverdue > 0 ? `${record.daysOverdue}d overdue` : "expiring"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{record.managerName}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => showEmployeePreview(record)}
                    className="text-xs text-ncl-blue hover:underline"
                    disabled={loading}
                  >
                    Preview reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#6264A7] text-white text-xs font-bold">
                  T
                </div>
                <span className="font-medium text-sm">{previewTitle}</span>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs text-gray-400">Preview — Microsoft Teams message (not sent)</p>
              <div className="rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {preview.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
