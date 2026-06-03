"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Route } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-in fade-in">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function NoMatch() {
  return (
    <div className="glass-card rounded-xl p-10 text-center">
      <p className="text-foreground font-medium">No conversions matched.</p>
      <p className="text-sm text-muted-foreground mt-1">
        The file parsed correctly but no path passed the filter. Try clearing the campaign filter.
      </p>
    </div>
  );
}

export function NeedsData({
  title = "Ready to map your conversion paths",
  message = "Upload a CM360 Path to Conversion CSV above (or load the sample) to populate this view.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center mb-4">
        <Route className="w-7 h-7 text-neon-cyan" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{message}</p>
    </div>
  );
}

// What the engine is actually doing, in order — not generic filler.
const LOADING_MESSAGES = [
  "Reading the CM360 export…",
  "Reconstructing conversion paths…",
  "Grouping touchpoints into journeys…",
  "Crediting first-touch, linear & last-click…",
  "Reconciling direct vs. assisted…",
  "Ranking publishers by contribution…",
];

export function LoadingState() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_MESSAGES.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-cyan" />
        </span>
        <span key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          {LOADING_MESSAGES[i]}
        </span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="glass-card rounded-xl h-[110px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
        <div className="glass-card rounded-xl h-[340px] xl:col-span-2 animate-pulse" />
        <div className="glass-card rounded-xl h-[340px] xl:col-span-3 animate-pulse" />
      </div>
    </div>
  );
}
