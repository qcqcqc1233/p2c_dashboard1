"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ModelRow {
  label: string;
  firstTouch: number;
  linear: number;
  lastClick: number;
}

const COLORS = { firstTouch: "#a855f7", linear: "#22d3ee", lastClick: "#34d399" };

/** Grouped bars comparing conversions credited under First-Touch / Linear /
 *  Last-Click — by channel (overview) or by publisher (vendor deep-dive). */
export function AttributionModelChart({
  rows,
  title,
  subtitle,
}: {
  rows: ModelRow[];
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-6 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 12, bottom: 28, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              angle={-18}
              textAnchor="end"
              height={56}
              interval={0}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ModelTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
            />
            <Bar dataKey="firstTouch" name="First Touch" fill={COLORS.firstTouch} radius={[3, 3, 0, 0]} maxBarSize={26} />
            <Bar dataKey="linear" name="Linear" fill={COLORS.linear} radius={[3, 3, 0, 0]} maxBarSize={26} />
            <Bar dataKey="lastClick" name="Last Click" fill={COLORS.lastClick} radius={[3, 3, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ModelTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-muted-foreground">{e.name}</span>
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {Number(e.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}
