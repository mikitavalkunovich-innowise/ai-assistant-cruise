"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Copy,
  Check,
  Download,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Built-in schema templates ─────────────────────────────────────────────────

const TEMPLATES: { label: string; description: string; schema: object }[] = [
  {
    label: "Invoice",
    description: "Vendor name, amounts, line items, dates",
    schema: {
      invoice_number: "",
      date: "",
      due_date: "",
      vendor: { name: "", address: "", tax_id: "" },
      bill_to: { name: "", address: "" },
      line_items: [{ description: "", quantity: 0, unit_price: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: "",
      payment_terms: "",
      notes: "",
    },
  },
  {
    label: "Contract",
    description: "Parties, dates, obligations, signatures",
    schema: {
      contract_title: "",
      contract_type: "",
      effective_date: "",
      expiry_date: "",
      parties: [{ role: "", name: "", address: "", representative: "" }],
      governing_law: "",
      key_obligations: [],
      payment_terms: { amount: 0, currency: "", schedule: "" },
      termination_conditions: [],
      signatures: [{ party: "", signatory: "", date: "" }],
    },
  },
  {
    label: "Crew Manifest",
    description: "Ship, voyage, crew members and roles",
    schema: {
      vessel_name: "",
      imo_number: "",
      voyage_number: "",
      departure_port: "",
      departure_date: "",
      arrival_port: "",
      arrival_date: "",
      crew: [
        {
          rank: "",
          full_name: "",
          nationality: "",
          passport_number: "",
          seaman_book_number: "",
          date_of_birth: "",
          sign_on_date: "",
          sign_off_date: "",
        },
      ],
    },
  },
  {
    label: "Medical Certificate",
    description: "Patient, doctor, diagnoses, medications",
    schema: {
      certificate_number: "",
      issue_date: "",
      valid_until: "",
      patient: { full_name: "", date_of_birth: "", id_number: "" },
      issuing_doctor: { name: "", license_number: "", institution: "" },
      diagnoses: [],
      medications: [{ name: "", dosage: "", frequency: "" }],
      fitness_for_duty: "",
      restrictions: [],
      remarks: "",
    },
  },
  {
    label: "Custom (blank)",
    description: "Start from scratch",
    schema: {
      field_one: "",
      field_two: "",
      nested_object: { key: "" },
      array_of_items: [{ item_name: "", value: "" }],
    },
  },
];

// ── JSON syntax highlighting ──────────────────────────────────────────────────

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-blue-600";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "text-violet-600 font-medium" : "text-emerald-600";
        } else if (/true|false/.test(match)) {
          cls = "text-amber-600";
        } else if (/null/.test(match)) {
          cls = "text-red-500";
        } else {
          cls = "text-blue-600";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PdfExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(TEMPLATES[0].schema, null, 2)
  );
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<{
    extracted: unknown;
    meta: { pdfChars: number; pdfPages: number; model: string; tokensUsed: number | null };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      setResult(null);
      setError(null);
    }
  };

  // ── Schema handling ────────────────────────────────────────────────────────

  const validateSchema = (text: string) => {
    try {
      JSON.parse(text);
      setSchemaError(null);
      return true;
    } catch (e) {
      setSchemaError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  };

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    const text = JSON.stringify(tpl.schema, null, 2);
    setSchemaText(text);
    setSchemaError(null);
    setShowTemplates(false);
  };

  // ── Extraction ─────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!file) return;
    if (!validateSchema(schemaText)) return;

    setExtracting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("schema", schemaText);

    try {
      const res = await fetch("/api/pdf-extractor", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  // ── Copy / download ────────────────────────────────────────────────────────

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.extracted, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.extracted, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.name.replace(/\.pdf$/i, "") ?? "extracted"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="rounded-lg bg-violet-600/20 p-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold">PDF Data Extractor</h1>
            <p className="text-xs text-slate-400">
              Upload a PDF · define a JSON schema · get structured data
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left panel ── */}
        <div className="space-y-5">
          {/* PDF upload */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
              1 · Upload PDF
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition",
                isDragging
                  ? "border-violet-400 bg-violet-500/10"
                  : file
                  ? "border-emerald-600 bg-emerald-500/5 cursor-default"
                  : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/60"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-300 truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(null); }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">
                    Drop PDF here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Text-based PDFs only (not scanned images)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Schema editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                2 · JSON Schema
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowTemplates((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  Templates
                  <ChevronDown className={cn("h-3 w-3 transition", showTemplates && "rotate-180")} />
                </button>

                {showTemplates && (
                  <div className="absolute right-0 top-9 z-20 w-64 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        onClick={() => applyTemplate(tpl)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 transition border-b border-slate-700/60 last:border-0"
                      >
                        <p className="text-sm font-medium text-slate-200">{tpl.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              <textarea
                value={schemaText}
                onChange={(e) => {
                  setSchemaText(e.target.value);
                  validateSchema(e.target.value);
                }}
                className={cn(
                  "w-full resize-none bg-slate-900 px-4 py-3 font-mono text-xs text-slate-200 outline-none h-72",
                  schemaError && "border-red-500"
                )}
                spellCheck={false}
                placeholder='{"field": "", "nested": {"key": ""}, "items": []}'
              />
            </div>

            {schemaError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {schemaError}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-600">
              Define any JSON shape — strings, numbers, nested objects, arrays. The model will
              fill values from the PDF content.             Use <code className="text-slate-400">&quot;&quot;</code> for
              text fields, <code className="text-slate-400">0</code> for numbers,{" "}
              <code className="text-slate-400">[]</code> for lists.
            </p>
          </div>

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={!file || !!schemaError || extracting}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
              !file || !!schemaError || extracting
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/30"
            )}
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract Structured Data
              </>
            )}
          </button>

          {extracting && (
            <p className="text-center text-xs text-slate-500">
              Parsing PDF and running GPT extraction — may take 10–30 s…
            </p>
          )}
        </div>

        {/* ── Right panel: result ── */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
            3 · Extracted Result
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {result ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    <span className="text-slate-300 font-medium">{result.meta.pdfPages}</span> page
                    {result.meta.pdfPages !== 1 ? "s" : ""}
                  </span>
                  <span>·</span>
                  <span>
                    <span className="text-slate-300 font-medium">
                      {(result.meta.pdfChars / 1000).toFixed(1)}k
                    </span>{" "}
                    chars
                  </span>
                  {result.meta.tokensUsed && (
                    <>
                      <span>·</span>
                      <span>
                        <span className="text-slate-300 font-medium">{result.meta.tokensUsed.toLocaleString()}</span>{" "}
                        tokens
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy JSON
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              </div>

              {/* JSON output */}
              <pre
                className="overflow-auto p-4 text-xs leading-relaxed max-h-[calc(100vh-22rem)]"
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(JSON.stringify(result.extracted, null, 2)),
                }}
              />
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 text-center text-slate-600">
              <FileText className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Extracted JSON will appear here</p>
              <p className="mt-1 text-xs">Upload a PDF and define a schema to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
