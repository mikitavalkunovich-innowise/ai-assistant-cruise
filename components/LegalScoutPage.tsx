"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Scale,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceInput } from "./legal-scout/VoiceInput";
import { AnalysisProgress } from "./legal-scout/AnalysisProgress";
import { ConclusionPreview } from "./legal-scout/ConclusionPreview";
import type { AnalysisStep, LegalConclusion } from "@/lib/legal-scout/types";

export function LegalScoutPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<LegalConclusion | null>(null);
  const [docxBase64, setDocxBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setConclusion(null);
      setDocxBase64(null);
      setError(null);
    }
  }, []);

  const loadSample = async () => {
    const res = await fetch("/api/legal-scout/sample");
    const blob = await res.blob();
    const sampleFile = new File([blob], "sample-employment-contract.md", {
      type: "text/markdown",
    });
    setFile(sampleFile);
    setQuery(
      "My employer wants to terminate me with only 14 days notice and enforce a 24-month non-compete. Is this legal?"
    );
    setConclusion(null);
    setDocxBase64(null);
    setError(null);
  };

  const runAnalysis = async () => {
    if (!file || !query.trim()) return;

    setAnalyzing(true);
    setError(null);
    setConclusion(null);
    setDocxBase64(null);
    setLogs([]);
    setCurrentStep("parsing_document");
    setOfflineMode(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query.trim());

    try {
      const res = await fetch("/api/legal-scout/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error("Analysis request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as
            | { step: AnalysisStep; message: string; offlineMode?: boolean }
            | { type: "result"; data: { conclusion: LegalConclusion; docxBase64: string; offlineMode: boolean } }
            | { type: "error"; message: string };

          if ("type" in payload) {
            if (payload.type === "error") {
              setError(payload.message);
              setCurrentStep("error");
            } else if (payload.type === "result") {
              setConclusion(payload.data.conclusion);
              setDocxBase64(payload.data.docxBase64);
              setOfflineMode(payload.data.offlineMode);
              setCurrentStep("done");
              addLog("Analysis complete");
            }
          } else {
            setCurrentStep(payload.step);
            if (payload.offlineMode) setOfflineMode(true);
            addLog(payload.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setCurrentStep("error");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadJson = () => {
    if (!conclusion) return;
    const blob = new Blob([JSON.stringify(conclusion, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "legal-conclusion.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600/20 p-2">
              <Scale className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold">AI Lawyer Scout</h1>
              <p className="text-xs text-slate-400">
                Upload a document · describe your case · get a cited legal conclusion
              </p>
            </div>
          </div>
          <button
            onClick={loadSample}
            disabled={analyzing}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Load sample contract
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: inputs */}
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
              1 · Upload document
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
                isDragging
                  ? "border-indigo-400 bg-indigo-500/10"
                  : file
                  ? "border-emerald-600 bg-emerald-500/5 cursor-default"
                  : "border-slate-700 bg-slate-900 hover:border-slate-500"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) {
                    setFile(picked);
                    setConclusion(null);
                    setError(null);
                  }
                }}
              />
              {file ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-300 truncate max-w-[240px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-2 h-7 w-7 text-slate-600" />
                  <p className="text-sm text-slate-400">Drop contract PDF/DOCX or click to browse</p>
                </>
              )}
            </div>
          </div>

          <VoiceInput value={query} onChange={setQuery} disabled={analyzing} />

          <button
            onClick={runAnalysis}
            disabled={!file || !query.trim() || analyzing}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
              !file || !query.trim() || analyzing
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/30"
            )}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze &amp; Generate Conclusion
              </>
            )}
          </button>

          {analyzing && (
            <p className="text-center text-xs text-slate-500">
              Full pipeline takes 30–90 seconds (document + web research + DOCX)
            </p>
          )}
        </div>

        {/* Right: progress + result */}
        <div className="space-y-5">
          {(analyzing || logs.length > 0) && (
            <AnalysisProgress
              currentStep={currentStep}
              logs={logs}
              offlineMode={offlineMode}
            />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {conclusion ? (
            <ConclusionPreview
              conclusion={conclusion}
              docxBase64={docxBase64}
              onDownloadJson={downloadJson}
            />
          ) : !analyzing && logs.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-600">
              <Scale className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Legal conclusion will appear here</p>
              <p className="mt-1 text-xs">Upload a document and describe your case</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
