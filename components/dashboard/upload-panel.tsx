"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalysis } from "@/components/dashboard/analysis-context";

export function UploadPanel() {
  const { data, loading, error, fileName, uploaderOpen, openUploader, closeUploader, analyze, loadSample } =
    useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") {
      setLocalError("Please choose a .csv file (a CM360 Path to Conversion export).");
      return;
    }
    setLocalError("");
    setFile(f);
  };

  // Compact source bar once a report is loaded (keeps upload reachable on every tab).
  if (data && !uploaderOpen) {
    return (
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-neon-emerald/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-neon-emerald" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{fileName || "report.csv"}</p>
          <p className="text-xs text-muted-foreground">
            {data.kpis.totalConversions.toLocaleString()} conversions · {data.meta.pathsAnalyzed.toLocaleString()} paths ·
            grouped by{" "}
            {data.meta.grouping === "conversionId"
              ? "Conversion ID"
              : data.meta.grouping === "encryptedUserId"
                ? "encrypted user"
                : "path"}
          </p>
        </div>
        <button
          onClick={openUploader}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] transition-[transform,background-color] active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> New report
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Path to Conversion Report</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a raw Campaign Manager 360 export to model multi-touch attribution.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data && (
            <button
              onClick={closeUploader}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => loadSample()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 hover:bg-neon-cyan/15 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Load sample report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload a CM360 Path to Conversion CSV file"
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 cursor-pointer transition-all duration-200 min-h-[180px]",
            dragging
              ? "border-neon-cyan/60 bg-neon-cyan/5"
              : "border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.03]",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 max-w-full">
              <div className="w-10 h-10 rounded-lg bg-neon-emerald/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-neon-emerald" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · ready to analyze</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-2 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] shrink-0"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground">
                  <span className="text-neon-cyan font-medium">Click to upload</span> or drag &amp; drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">CM360 Path to Conversion · .csv (interaction-level)</p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="touchpoint-filter" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filter by touchpoint
            </label>
            <input
              id="touchpoint-filter"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Optional, e.g. YouTube"
              className="mt-1.5 w-full rounded-lg bg-white/[0.03] border border-white/[0.1] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              Keeps only paths that include a matching site/placement. Leave blank to analyze every path.
            </p>
          </div>
          <button
            onClick={() => file && analyze(file, filter)}
            disabled={!file || loading}
            className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-neon-purple to-neon-cyan hover:opacity-90 transition-[opacity,transform] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
              </>
            ) : (
              "Analyze report"
            )}
          </button>
        </div>
      </div>

      {(error || localError) && <p className="text-xs text-destructive mt-3">{localError || error}</p>}
    </div>
  );
}
