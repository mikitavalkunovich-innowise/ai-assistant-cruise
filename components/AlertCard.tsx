"use client";

import type { RegulatoryAlert } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { ExternalLink, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function AlertCard({ alert }: { alert: RegulatoryAlert }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <span className="text-xs text-gray-500">{alert.sourceName}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
        </div>
      </div>
      <p className="mb-3 text-sm text-gray-600 leading-relaxed">{alert.summary}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {alert.publishedAt ? formatDate(alert.publishedAt) : formatDate(alert.createdAt)}
        </div>
        {alert.sourceUrl && (
          <a
            href={alert.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-ncl-blue hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        )}
      </div>
    </div>
  );
}
