"use client";

import { Clock, Layers } from "lucide-react";
import type { ChannelStat } from "@/lib/analyze-types";
import { channelColor, channelIcon } from "@/components/dashboard/channel-style";

export function ChannelJourneyCards({ stats, hasTiming }: { stats: ChannelStat[]; hasTiming: boolean }) {
  const ordered = [...stats].sort((a, b) => b.lastTouch + b.assisted - (a.lastTouch + a.assisted));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {ordered.map((c) => {
        const Icon = channelIcon(c.channel);
        const color = channelColor(c.channel);
        return (
          <div key={c.channel} className="glass-card glass-card-hover rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <span className="font-medium text-foreground">{c.channel}</span>
                <p className="text-xs text-muted-foreground">
                  {c.lastTouch.toLocaleString()} closes · {c.assisted.toLocaleString()} assists
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">Avg. Days</span>
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {hasTiming ? c.avgDaysToConvert : "—"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-xs">Touchpoints</span>
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">{c.avgTouchpoints}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
