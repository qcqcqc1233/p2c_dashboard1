"use client";

import { ArrowRight, ChevronDown, Clock, Gauge, TrendingUp, type LucideIcon } from "lucide-react";
import type { TopPath } from "@/lib/analyze-types";
import { channelColor, channelIcon } from "@/components/dashboard/channel-style";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<string, string> = {
  "Highly Profitable": "bg-success/10 text-success border-success/20",
  "Fastest Velocity": "bg-warning/10 text-warning border-warning/20",
  "Top Volume": "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
  "Upper-Funnel Play": "bg-neon-purple/10 text-neon-purple border-neon-purple/20",
};

export function JourneyPaths({
  paths,
  hasRevenue,
  hasTiming,
}: {
  paths: TopPath[];
  hasRevenue: boolean;
  hasTiming: boolean;
}) {
  const max = paths.reduce((m, p) => Math.max(m, p.conversions), 0) || 1;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Top Conversion Paths</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Most common journeys to conversion, by channel sequence (conversion-closest last)
        </p>
        {hasRevenue && (
          <p className="text-[11px] text-muted-foreground/70 mt-1.5">
            ROAS modeled from assumed per-channel eCPA (a Path to Conversion export carries no media cost).
          </p>
        )}
      </div>

      <div className="space-y-3">
        {paths.map((p, idx) => (
          <div
            key={idx}
            className="group flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300"
          >
            {/* Path: stacks top-to-bottom on phones, flows left-to-right on desktop */}
            <div className="flex flex-col xl:flex-row xl:flex-wrap xl:items-center gap-1.5 xl:gap-2 min-w-0">
              {p.path.map((ch, i) => {
                const Icon = channelIcon(ch);
                const color = channelColor(ch);
                const isLast = i === p.path.length - 1;
                return (
                  <div key={i} className="flex flex-col xl:flex-row xl:items-center gap-1.5 xl:gap-2">
                    <div
                      className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: `${color}1a` }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                      <span className="text-xs font-medium" style={{ color }}>{ch}</span>
                    </div>
                    {!isLast && (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-3 xl:hidden" />
                        <ArrowRight className="hidden xl:block w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </>
                    )}
                  </div>
                );
              })}
              {p.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 xl:mt-0 xl:ml-1">
                  {p.badges.map((b) => (
                    <span
                      key={b}
                      className={cn(
                        "px-2 py-1 rounded-full text-[11px] font-medium border",
                        BADGE_STYLES[b] ?? "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 xl:gap-8 xl:shrink-0">
              <Metric
                icon={TrendingUp}
                value={p.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                label={`${p.percentageOfTotal}% of total`}
              />
              {hasTiming && <Metric icon={Clock} value={`${p.avgDaysToConvert}d`} label="Avg. time" />}
              {hasRevenue && <Metric icon={Gauge} value={`${p.roas}x`} label="ROAS" accent />}
              <div className="hidden xl:block w-24">
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                    style={{ width: `${(p.conversions / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div>
        <p className={cn("text-sm font-semibold tabular-nums", accent ? "text-neon-emerald" : "text-foreground")}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
