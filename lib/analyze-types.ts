// Shared request/response contract for POST /api/analyze.
// Imported by the API route, the attribution engine, and the dashboard UI so
// the shape stays in lockstep across the wire.

export type Channel = "Search" | "Video" | "Display" | "Social" | "Other";
export type Stage = "Closer" | "Nurturer" | "Introducer";

export interface NameValue {
  name: string;
  value: number;
}

/** Conversions credited to a channel under three attribution models. */
export interface AttributionModelRow {
  channel: string;
  firstTouch: number;
  linear: number;
  lastClick: number;
}

export interface ChannelStat {
  channel: string;
  /** Last-touch (closer) conversions for this channel. */
  conversions: number;
  lastTouch: number;
  assisted: number;
  /** Avg days-to-convert across conversions this channel participated in. */
  avgDaysToConvert: number;
  /** Avg path length across conversions this channel participated in. */
  avgTouchpoints: number;
}

export interface TopPath {
  /** Channels in chronological order — conversion-closest LAST. */
  path: string[];
  conversions: number;
  percentageOfTotal: number;
  avgDaysToConvert: number;
  revenue: number;
  /** Return on ad spend = revenue / modeled media cost (assumed per-channel eCPA). */
  roas: number;
  /** Value tags e.g. "Highly Profitable", "Fastest Velocity". */
  badges: string[];
}

export interface SitePerformanceRow {
  site: string;
  channel: string;
  lastTouch: number;
  assisted: number;
  /** Conversions credited under first-touch / linear (last-click == lastTouch). */
  firstTouch: number;
  linear: number;
  totalContribution: number;
  /** assisted / lastTouch; null = pure introducer (no last-touch credit). */
  assistToLastRatio: number | null;
  revenue: number;
  /** Return on ad spend = attributed revenue / modeled media cost. */
  roas: number;
  avgDaysToConvert: number;
  stage: Stage;
}

export interface VelocityBucket {
  label: string;
  conversions: number;
}

export interface AnalyzeResponse {
  meta: {
    format: "interaction" | "aggregated";
    grouping: "conversionId" | "encryptedUserId" | "none";
    touchpointField: string;
    rowsParsed: number;
    pathsAnalyzed: number;
    hasRevenue: boolean;
    hasTiming: boolean;
  };
  kpis: {
    totalConversions: number;
    multiTouchConversions: number;
    singleTouchConversions: number;
    avgInteractions: number;
    avgDaysToConvert: number;
    totalRevenue: number;
  };
  funnelBreakdown: {
    direct: NameValue[];
    assisted: NameValue[];
  };
  attributionModels: AttributionModelRow[];
  channelStats: ChannelStat[];
  topPaths: TopPath[];
  sitePerformanceMatrix: SitePerformanceRow[];
  velocity: VelocityBucket[];
}
