"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const [kb, setKb] = useState<"hr" | "compliance">("compliance");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kb", kb);
    if (title) formData.append("title", title);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        success: true,
        message: `Uploaded "${data.title}" to ${data.kb} KB (${data.contentLength} chars indexed)`,
      });
      setFile(null);
      setTitle("");
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-ncl-navy">Upload Documents</h1>
      <p className="mb-6 text-sm text-gray-500">
        Add PDF, Markdown, or TXT files to the HR or Compliance knowledge base.
        Documents are chunked, embedded, and available for Q&A with citations.
      </p>

      <form onSubmit={handleUpload} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Knowledge Base</label>
          <div className="flex gap-3">
            {(["compliance", "hr"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKb(k)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  kb === k
                    ? "border-ncl-blue bg-ncl-blue/10 text-ncl-blue"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {k === "compliance" ? "Compliance Regulations" : "HR Policies"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Document Title (optional)</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-detected from filename"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">File (PDF, MD, TXT)</label>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-ncl-blue"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            {file ? (
              <p className="text-sm font-medium text-ncl-blue">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to select or drag a file</p>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf,.md,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={!file || loading}>
          {loading ? "Uploading & indexing..." : "Upload to Knowledge Base"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg p-4 text-sm ${
            result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          {result.message}
        </div>
      )}
    </div>
  );
}
