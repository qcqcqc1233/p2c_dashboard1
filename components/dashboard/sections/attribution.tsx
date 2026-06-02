"use client";

import { Layers, Route, Target, Workflow } from "lucide-react";
import { useAnalysis } from "@/components/dashboard/analysis-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { FunnelBreakdown } from "@/components/dashboard/charts/funnel-breakdown";
import { AttributionModelChart } from "@/components/dashboard/charts/attribution-model-chart";
import { LoadingState, NeedsData, NoMatch } from "@/components/dashboard/dashboard-states";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 });
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}% of total` : "—");

/** Overview tab: the headline numbers + the "why multi-touch matters" story. */
export function AttributionSection() {
  const { data, loading } = useAnalysis();

  if (loading) return <LoadingState />;
  if (!data) return <NeedsData />;
  if (data.kpis.totalConversions === 0) return <NoMatch />;

  const k = data.kpis;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Conversions" value={fmt(k.totalConversions)} icon={Target} color="#22d3ee" delay={0} />
        <StatCard
          label="Multi-Touch"
          value={fmt(k.multiTouchConversions)}
          sublabel={pct(k.multiTouchConversions, k.totalConversions)}
          icon={Layers}
          color="#a855f7"
          delay={1}
        />
        <StatCard
          label="Avg. Interactions / Path"
          value={fmt(k.avgInteractions)}
          sublabel="touchpoints per conversion"
          icon={Workflow}
          color="#34d399"
          delay={2}
        />
        <StatCard
          label={data.meta.hasTiming ? "Avg. Days to Convert" : "Single-Touch"}
          value={data.meta.hasTiming ? fmt(k.avgDaysToConvert) : fmt(k.singleTouchConversions)}
          sublabel={data.meta.hasTiming ? "first touch → conversion" : pct(k.singleTouchConversions, k.totalConversions)}
          icon={Route}
          color="#fb923c"
          delay={3}
        />
      </div>

      <InsightBanner data={data} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <FunnelBreakdown funnel={data.funnelBreakdown} />
        </div>
        <div className="xl:col-span-3">
          <AttributionModelChart
            rows={data.attributionModels.map((m) => ({
              label: m.channel,
              firstTouch: m.firstTouch,
              linear: m.linear,
              lastClick: m.lastClick,
            }))}
            title="Conversions by Attribution Model"
            subtitle="Channel credit shifts sharply between first-touch, linear, and last-click"
          />
        </div>
      </div>
    </div>
  );
}
