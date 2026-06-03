"use client";

import type { ChannelStat } from "@/lib/analyze-types";
import { StatCard } from "@/components/dashboard/stat-card";
import { CountUp } from "@/components/dashboard/count-up";
import { channelColor, channelIcon } from "@/components/dashboard/channel-style";

/** Per-channel velocity tiles. Same clean StatCard shape as the overview KPIs:
 *  one hero number (avg days-to-convert) with a single supporting line. */
export function ChannelJourneyCards({ stats, hasTiming }: { stats: ChannelStat[]; hasTiming: boolean }) {
  const ordered = [...stats].sort((a, b) => b.lastTouch + b.assisted - (a.lastTouch + a.assisted));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {ordered.map((c, i) => (
        <StatCard
          key={c.channel}
          label={c.channel}
          value={
            hasTiming ? (
              <CountUp value={c.avgDaysToConvert} decimals={1} suffix="d" />
            ) : (
              <CountUp value={c.avgTouchpoints} decimals={1} />
            )
          }
          sublabel={
            hasTiming
              ? `${c.avgTouchpoints} avg touchpoints`
              : `${c.lastTouch.toLocaleString()} closes`
          }
          icon={channelIcon(c.channel)}
          color={channelColor(c.channel)}
          delay={i}
        />
      ))}
    </div>
  );
}
