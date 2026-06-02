"use client";

import { useAnalysis } from "@/components/dashboard/analysis-context";
import { AttributionModelChart } from "@/components/dashboard/charts/attribution-model-chart";
import { SiteMatrix } from "@/components/dashboard/site-matrix";
import { LoadingState, NeedsData, NoMatch } from "@/components/dashboard/dashboard-states";

/** Deep dive: publisher-level attribution + per-publisher model comparison. */
export function VendorMatrixSection() {
  const { data, loading } = useAnalysis();

  if (loading) return <LoadingState />;
  if (!data)
    return (
      <NeedsData
        title="Vendor matrix"
        message="Upload a CM360 report above to see publisher-level attribution and how each partner is credited across attribution models."
      />
    );
  if (data.kpis.totalConversions === 0) return <NoMatch />;

  const topPublishers = data.sitePerformanceMatrix.slice(0, 7).map((s) => ({
    label: s.site,
    firstTouch: s.firstTouch,
    linear: s.linear,
    lastClick: s.lastTouch,
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AttributionModelChart
        rows={topPublishers}
        title="Conversions per Attribution Model by Publisher"
        subtitle="Top publishers — how credit shifts from first-touch to last-click"
      />
      <SiteMatrix rows={data.sitePerformanceMatrix} hasRevenue={data.meta.hasRevenue} hasTiming={data.meta.hasTiming} />
    </div>
  );
}
