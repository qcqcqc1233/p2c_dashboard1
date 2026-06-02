"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { NameValue } from "@/lib/analyze-types";
import { channelColor } from "@/components/dashboard/channel-style";

interface FunnelBreakdownProps {
  funnel: { direct: NameValue[]; assisted: NameValue[] };
}

/** Side-by-side donuts: Direct (last touch) vs Assisted (upper funnel). */
export function FunnelBreakdown({ funnel }: FunnelBreakdownProps) {
  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Funnel Incrementality</h3>
        <p className="text-sm text-muted-foreground mt-1">Direct (last touch) vs Assisted (upper funnel)</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <Donut title="Direct Closers" subtitle="(Last Touch)" data={funnel.direct} />
        <Donut title="Assisted" subtitle="(Introducers)" data={funnel.assisted} />
      </div>
    </div>
  );
}

function Donut({ title, subtitle, data }: { title: string; subtitle: string; data: NameValue[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices = data.filter((d) => d.value > 0);
  const pieData = slices.length ? slices : [{ name: "No data", value: 1 }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={slices.length > 1 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={slices.length ? channelColor(d.name) : "rgba(255,255,255,0.06)"} />
              ))}
            </Pie>
            {slices.length > 0 && <Tooltip content={<DonutTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">conversions</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mt-2">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>

      <div className="w-full mt-3 space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColor(d.name) }} />
                {d.name}
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-muted-foreground ml-1">({pct.toFixed(0)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const name = d.name ?? "";
  const value = typeof d.value === "number" ? d.value : Number(d.value ?? 0);
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColor(name) }} />
        <span className="text-sm text-foreground">{name}</span>
        <span className="text-sm font-semibold text-foreground ml-2 tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
