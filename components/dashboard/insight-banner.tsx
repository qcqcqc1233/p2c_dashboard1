"use client";

import { Sparkles } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/analyze-types";

/** Auto-generated headline that surfaces the channel most under-credited by
 *  last-click — the core "why multi-touch matters" message for a CMO. */
export function InsightBanner({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="rounded-xl p-4 bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/20">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-foreground mb-1">Attribution Insight</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{buildInsight(data)}</p>
        </div>
      </div>
    </div>
  );
}

function buildInsight(d: AnalyzeResponse): string {
  let best: { channel: string; first: number; last: number } | null = null;
  for (const m of d.attributionModels) {
    const gap = m.firstTouch - m.lastClick;
    if (gap > 0 && (!best || gap > best.first - best.last)) {
      best = { channel: m.channel, first: m.firstTouch, last: m.lastClick };
    }
  }
  const mtPct =
    d.kpis.totalConversions > 0
      ? Math.round((d.kpis.multiTouchConversions / d.kpis.totalConversions) * 100)
      : 0;

  if (best && best.first > 0) {
    const factorTxt = best.last > 0 ? `${(best.first / best.last).toFixed(1)}×` : `${best.first.toLocaleString()}`;
    return `${best.channel} introduces ${best.first.toLocaleString()} conversions but earns only ${best.last.toLocaleString()} under last-click — a ${factorTxt} gap. With ${mtPct}% of conversions multi-touch, last-click alone is under-valuing your upper funnel.`;
  }
  return `${mtPct}% of conversions are multi-touch, averaging ${d.kpis.avgInteractions} touchpoints${
    d.meta.hasTiming ? ` over ${d.kpis.avgDaysToConvert} days` : ""
  }. Last-click attribution misses the channels assisting along the way.`;
}
