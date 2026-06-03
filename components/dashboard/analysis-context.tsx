"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AnalyzeResponse } from "@/lib/analyze-types";

interface AnalysisState {
  data: AnalyzeResponse | null;
  loading: boolean;
  error: string;
  fileName: string;
  /** Whether the full uploader is open (vs the compact source bar). Lives in
   *  context so it stays consistent as the user moves between tabs. */
  uploaderOpen: boolean;
  openUploader: () => void;
  closeUploader: () => void;
  analyze: (file: File, filter?: string) => Promise<void>;
  loadSample: () => Promise<void>;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisState | null>(null);

export function useAnalysis(): AnalysisState {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within an <AnalysisProvider>");
  return ctx;
}

const SAMPLE_PATH = "/sample-cm360-report.csv";

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploaderOpen, setUploaderOpen] = useState(false);

  // A quiet hello for anyone who opens the console.
  useEffect(() => {
    console.log(
      "%cMAD Growth%c  Omni-Channel Attribution Engine\n%cMulti-touch attribution: last-touch vs. assisted, reconciled across first-touch, linear & last-click.",
      "color:#22d3ee;font-weight:700;font-size:13px",
      "color:#a855f7;font-weight:600;font-size:13px",
      "color:#7a7a85;font-size:11px",
    );
  }, []);

  const run = useCallback(async (file: File, filter: string) => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (filter.trim()) fd.append("targetCampaign", filter.trim());
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Analysis failed (HTTP ${res.status}).`);
      setData(json as AnalyzeResponse);
      setFileName(file.name);
      setUploaderOpen(false); // collapse to the compact source bar on success
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Something went wrong while analyzing the file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const analyze = useCallback((file: File, filter = "") => run(file, filter), [run]);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SAMPLE_PATH);
      if (!res.ok) throw new Error("Could not load the bundled sample report.");
      const blob = await res.blob();
      await run(new File([blob], "sample-cm360-report.csv", { type: "text/csv" }), "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the sample report.");
      setLoading(false);
    }
  }, [run]);

  const openUploader = useCallback(() => setUploaderOpen(true), []);
  const closeUploader = useCallback(() => setUploaderOpen(false), []);
  const reset = useCallback(() => {
    setData(null);
    setError("");
    setFileName("");
    setUploaderOpen(false);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{ data, loading, error, fileName, uploaderOpen, openUploader, closeUploader, analyze, loadSample, reset }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}
