"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SitePerformanceRow, Stage } from "@/lib/analyze-types";
import { channelColor } from "@/components/dashboard/channel-style";

const stageStyles: Record<Stage, string> = {
  Closer: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
  Nurturer: "bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20",
  Introducer: "bg-neon-purple/10 text-neon-purple border-neon-purple/20",
};

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const ratioLabel = (r: SitePerformanceRow) => (r.assistToLastRatio === null ? "∞" : r.assistToLastRatio.toFixed(2));

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={cn("py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider", right ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}

export function SiteMatrix({
  rows,
  hasRevenue,
  hasTiming,
}: {
  rows: SitePerformanceRow[];
  hasRevenue: boolean;
  hasTiming: boolean;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.totalContribution), 0) || 1;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10 mb-5 sm:mb-6">
        <Info className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Methodology:</span> Direct and Assisted
          conversions are non-mutually exclusive: a publisher can earn both within a single path,
          enabling full path-presence valuation.
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Partner Performance Matrix</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Publisher-level attribution · {rows.length} site{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Mobile: card list (a table doesn't belong on a phone) */}
      <div className="lg:hidden space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: channelColor(r.channel) }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.site}</p>
                  <p className="text-[11px] text-muted-foreground">{r.channel}</p>
                </div>
              </div>
              <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium border shrink-0", stageStyles[r.stage])}>
                {r.stage}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Tile label="Last Touch" value={fmt(r.lastTouch)} />
              <Tile label="Assisted" value={fmt(r.assisted)} />
              <Tile label="Total" value={fmt(r.totalContribution)} />
            </div>

            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan" style={{ width: `${(r.totalContribution / max) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Assist:LT{" "}
                <span className={cn("font-mono", r.stage === "Introducer" ? "text-neon-purple" : "text-foreground")}>{ratioLabel(r)}</span>
              </span>
              {hasRevenue && (
                <span>
                  Rev <span className="text-neon-emerald font-medium tabular-nums">${fmt(r.revenue)}</span>
                </span>
              )}
              {hasTiming && <span className="tabular-nums">{r.avgDaysToConvert}d avg</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: full table */}
      <div className="hidden lg:block overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card/90 backdrop-blur z-10">
            <tr className="border-b border-white/[0.08]">
              <Th>Publisher</Th>
              <Th>Stage</Th>
              <Th right>Last Touch</Th>
              <Th right>Assisted</Th>
              <Th>Total Contribution</Th>
              <Th right>Assist:LT</Th>
              {hasRevenue && <Th right>Revenue</Th>}
              {hasTiming && <Th right>Avg Days</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: channelColor(r.channel) }} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{r.site}</span>
                      <p className="text-[11px] text-muted-foreground">{r.channel}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium border", stageStyles[r.stage])}>
                    {r.stage}
                  </span>
                </td>
                <td className="py-3 px-4 text-right"><span className="text-sm text-foreground tabular-nums">{fmt(r.lastTouch)}</span></td>
                <td className="py-3 px-4 text-right"><span className="text-sm text-foreground tabular-nums">{fmt(r.assisted)}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden min-w-[80px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan" style={{ width: `${(r.totalContribution / max) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground w-16 text-right tabular-nums">{fmt(r.totalContribution)}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={cn("text-sm font-mono", r.stage === "Introducer" ? "text-neon-purple" : "text-muted-foreground")}>
                    {ratioLabel(r)}
                  </span>
                </td>
                {hasRevenue && (
                  <td className="py-3 px-4 text-right"><span className="text-sm font-medium text-neon-emerald tabular-nums">${fmt(r.revenue)}</span></td>
                )}
                {hasTiming && (
                  <td className="py-3 px-4 text-right"><span className="text-sm text-muted-foreground tabular-nums">{r.avgDaysToConvert}</span></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-2 py-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
