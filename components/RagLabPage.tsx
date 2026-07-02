"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Send,
  Loader2,
  FileText,
  Settings2,
  FlaskConical,
} from "lucide-react";
import { CitationList } from "./CitationList";
import {
  DEFAULT_RAG_SETTINGS,
  type ChatMessage,
  type Citation,
  type RagSearchSettings,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface SandboxDocument {
  id: string;
  title: string;
  fileType: string;
  createdAt: string;
  chunkCount: number;
}

export function RagLabPage() {
  const [documents, setDocuments] = useState<SandboxDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<RagSearchSettings>(DEFAULT_RAG_SETTINGS);
  const [lastRetrieved, setLastRetrieved] = useState<number | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadDocuments = useCallback(async () => {
    const res = await fetch("/api/rag-lab/documents");
    const data = await res.json();
    setDocuments(data.documents ?? []);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadTitle) formData.append("title", uploadTitle);

      const res = await fetch("/api/rag-lab/documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedFile(null);
      setUploadTitle("");
      await loadDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Delete all uploaded documents from this sandbox?")) return;
    await fetch("/api/rag-lab/documents", { method: "DELETE" });
    setMessages([]);
    setLastRetrieved(null);
    await loadDocuments();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setLastRetrieved(null);
    setMessages((prev) => [...prev, { role: "assistant", content: "", citations: [] }]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/rag-lab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, settings }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let citations: Citation[] = [];
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.type === "content") {
                content += chunk.data;
              } else if (chunk.type === "citations") {
                citations = chunk.data;
              } else if (chunk.type === "meta") {
                setLastRetrieved(chunk.data.chunksRetrieved);
              }
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content, citations };
                return updated;
              });
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <FlaskConical className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">RAG Lab</h1>
            <p className="text-sm text-slate-500">
              Upload documents, tune retrieval, and test grounded answers with citations
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-12">
        {/* Left: upload + settings */}
        <div className="space-y-4 lg:col-span-3">
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Upload className="h-4 w-4" />
              Upload document
            </h2>
            <form onSubmit={handleUpload} className="space-y-3">
              <input
                className="input text-xs"
                placeholder="Title (optional)"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
              <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-200 p-4 text-center hover:border-violet-400">
                <Upload className="mb-1 h-5 w-5 text-slate-400" />
                <span className="text-xs text-slate-600">
                  {selectedFile ? selectedFile.name : "PDF, MD, or TXT"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.md,.txt"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="submit"
                className="btn-primary w-full bg-violet-600 hover:bg-violet-700"
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Indexing..." : "Upload & index"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Settings2 className="h-4 w-4" />
              Search settings
            </h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>Top K chunks</span>
                  <span className="font-medium">{settings.topK}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={settings.topK}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, topK: Number(e.target.value) }))
                  }
                  className="w-full accent-violet-600"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  More chunks = broader context for the model
                </p>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>Min similarity</span>
                  <span className="font-medium">{(settings.minSimilarity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={Math.round(settings.minSimilarity * 100)}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      minSimilarity: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-violet-600"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Lower = include looser semantic matches (more fuzzy)
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Indexed documents</h2>
              {documents.length > 0 && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400">No documents yet</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                  >
                    <div className="flex items-start gap-1.5 font-medium text-slate-700">
                      <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="line-clamp-2">{doc.title}</span>
                    </div>
                    <p className="mt-1 text-slate-400">
                      {doc.chunkCount} chunks · {formatDate(doc.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: chat */}
        <div className="lg:col-span-9">
          <div className="card flex h-[calc(100vh-8rem)] flex-col overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
              Ask a question about your uploaded documents. Only sources cited in the answer are
              shown below the response.
              {lastRetrieved !== null && (
                <span className="ml-2 text-violet-600">
                  · {lastRetrieved} chunk{lastRetrieved !== 1 ? "s" : ""} retrieved
                </span>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">
                  <p className="mb-4">
                    Upload a document, then ask anything about its content.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Summarize the main points",
                      "What are the key requirements?",
                      "List any deadlines mentioned",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={documents.length === 0}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-violet-400 hover:text-violet-700 disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <CitationList citations={msg.citations} showSimilarity />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="border-t border-slate-200 p-4"
            >
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  disabled={loading || documents.length === 0}
                />
                <button
                  type="submit"
                  className="btn-primary bg-violet-600 hover:bg-violet-700"
                  disabled={loading || !input.trim() || documents.length === 0}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
