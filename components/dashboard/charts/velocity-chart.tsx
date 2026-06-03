"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VelocityBucket } from "@/lib/analyze-types";

export function VelocityChart({ data }: { data: VelocityBucket[] }) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Conversion Velocity</h3>
        <p className="text-sm text-muted-foreground mt-1">
          How long demand takes to mature, from first touch to conversion
        </p>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<VelTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="conversions" radius={[4, 4, 0, 0]} fill="url(#velGrad)" maxBarSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VelTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {Number(payload[0].value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} conversions
      </p>
    </div>
  );
}
