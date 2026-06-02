"use client";

import { useAnalysis } from "@/components/dashboard/analysis-context";
import { ChannelJourneyCards } from "@/components/dashboard/channel-journey-cards";
import { VelocityChart } from "@/components/dashboard/charts/velocity-chart";
import { JourneyPaths } from "@/components/dashboard/journey-paths";
import { LoadingState, NeedsData, NoMatch } from "@/components/dashboard/dashboard-states";

/** Deep dive: channel velocity, touchpoint depth, and the top journeys. */
export function JourneyMappingSection() {
  const { data, loading } = useAnalysis();

  if (loading) return <LoadingState />;
  if (!data)
    return (
      <NeedsData
        title="Journey mapping"
        message="Upload a CM360 report above to explore channel velocity, touchpoint depth, and your highest-value conversion journeys."
      />
    );
  if (data.kpis.totalConversions === 0) return <NoMatch />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ChannelJourneyCards stats={data.channelStats} hasTiming={data.meta.hasTiming} />
      {data.meta.hasTiming && <VelocityChart data={data.velocity} />}
      <JourneyPaths paths={data.topPaths} hasRevenue={data.meta.hasRevenue} hasTiming={data.meta.hasTiming} />
    </div>
  );
}
