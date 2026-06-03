import Papa from "papaparse";
import type {
  AnalyzeResponse,
  AttributionModelRow,
  Channel,
  ChannelStat,
  NameValue,
  SitePerformanceRow,
  Stage,
  TopPath,
  VelocityBucket,
} from "./analyze-types";

/**
 * Attribution engine for Campaign Manager 360 (CM360) Path-to-Conversion data.
 *
 * Supports two export shapes, auto-detected:
 *   1. INTERACTION-level (the real CM360 P2C export): one row per touchpoint.
 *      Paths are reconstructed by grouping rows on a journey key and ordering
 *      by Interaction DateTime (conversion-closest last).
 *   2. AGGREGATED ("*path" column with " > " separated touchpoints): one row
 *      per path. Kept for backwards compatibility.
 *
 * Both shapes are normalized into a common Path[] intermediate, after which a
 * single pipeline derives every metric. All credit is weighted by each path's
 * conversion count, so the Direct funnel reconciles with totalConversions.
 */

const PRIMARY_CHANNELS: Channel[] = ["Search", "Video", "Display", "Social"];
const MS_PER_DAY = 86_400_000;

// Assumed media cost per conversion (eCPA) by channel. A CM360 Path-to-Conversion
// export carries no spend, so ROAS is *modeled* from these rates until a real cost
// feed is wired in. Tune to the advertiser's economics.
const CHANNEL_ECPA: Record<string, number> = {
  Search: 28,
  Social: 42,
  Display: 38,
  Video: 55,
  Other: 48,
};
const ecpaFor = (channel: string): number => CHANNEL_ECPA[channel] ?? 48;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function inc(map: Map<string, number>, key: string, n: number): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

/** Classify a raw touchpoint into a funnel channel. Order matters: the first
 *  matching family wins. Tuned for CM360 "Site CM360" / placement naming. */
export function classifyChannel(raw: string): Channel {
  const t = (raw || "").toLowerCase();
  if (/youtube|ctv|hulu|roku|\bott\b|video|tubi|connected tv|samsung tv|peacock/.test(t)) return "Video";
  if (/display|programmatic|dv360|bidmanager|dfasite|trade ?desk|gdn|banner|\badx\b|criteo|taboola|outbrain/.test(t)) return "Display";
  if (/meta|facebook|\bfb\b|instagram|\big\b|tiktok|snap|social|linkedin|pinterest|\bx\b|twitter/.test(t)) return "Social";
  if (/search|google|bing|sem|adwords|yahoo|baidu|paid search/.test(t)) return "Search";
  return "Other";
}

/** Parse a numeric cell, stripping separators/currency. NaN for non-numeric. */
function parseNumber(raw: string | undefined): number {
  if (raw == null) return NaN;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  return parseFloat(cleaned);
}

/** Parse a CM360 "M/D/YYYY H:mm" timestamp to epoch ms. NaN if unparseable. */
function parseTime(raw: string | undefined): number {
  if (!raw || raw.trim() === "" || raw.trim().toLowerCase() === "undefined") return NaN;
  return Date.parse(raw.trim());
}

function detectCells(line: string): string[] {
  return line.split(",").map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase());
}

// ---------------------------------------------------------------------------
// Common intermediate representation
// ---------------------------------------------------------------------------

interface Touch {
  site: string;
  channel: Channel;
  timeMs: number; // NaN when unknown
}

interface Path {
  touches: Touch[]; // chronological: earliest first, conversion-closest last
  conversions: number;
  revenue: number;
  daysToConvert: number; // NaN when timing unavailable
}

type CsvRow = Record<string, string | undefined>;

interface ParsedInput {
  rows: CsvRow[];
  fields: string[];
}

// ---------------------------------------------------------------------------
// CSV parsing (with CM360 metadata-prefix skipping)
// ---------------------------------------------------------------------------

function parseCsv(rawText: string): ParsedInput {
  const lines = rawText.split(/\r?\n/);

  // Most interaction exports have the header on line 0. Some aggregated exports
  // carry ~10-15 metadata rows first. Find the real header: the first line that
  // looks like a column header for either shape.
  let headerIndex = lines.findIndex((line) => {
    const cells = detectCells(line);
    const hasConvId = cells.some((c) => c === "conversion id" || c === "interaction number");
    const hasPath = cells.some((c) => c.endsWith("path"));
    const hasConv = cells.some((c) => c.includes("conversion"));
    return hasConvId || (hasPath && hasConv);
  });
  if (headerIndex === -1) {
    headerIndex = lines.findIndex((line) => detectCells(line).some((c) => c.endsWith("path")));
  }
  if (headerIndex === -1) headerIndex = 0;

  const body = lines.slice(headerIndex).join("\n");
  const parsed = Papa.parse<CsvRow>(body, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  return { rows: parsed.data, fields: parsed.meta.fields ?? [] };
}

// ---------------------------------------------------------------------------
// Shape 1: interaction-level -> Path[]
// ---------------------------------------------------------------------------

function findField(fields: string[], candidates: string[]): string | undefined {
  const lower = fields.map((f) => f.toLowerCase());
  for (const cand of candidates) {
    const i = lower.indexOf(cand.toLowerCase());
    if (i !== -1) return fields[i];
  }
  // loose contains match
  for (const cand of candidates) {
    const i = lower.findIndex((f) => f.includes(cand.toLowerCase()));
    if (i !== -1) return fields[i];
  }
  return undefined;
}

interface InteractionBuild {
  paths: Path[];
  grouping: "conversionId" | "encryptedUserId";
  touchpointField: string;
  hasRevenue: boolean;
  hasTiming: boolean;
}

function buildFromInteractions(input: ParsedInput): InteractionBuild {
  const { rows, fields } = input;

  const touchpointField =
    findField(fields, ["Site CM360", "Site", "Placement", "Campaign"]) ?? fields[0];
  const convIdField = findField(fields, ["Conversion ID"]);
  const userField = findField(fields, ["encryptedUserId", "Encrypted User ID", "User ID"]);
  const interactionTimeField = findField(fields, ["Interaction DateTime", "Interaction Date/Time"]);
  const interactionNumField = findField(fields, ["Interaction Number"]);
  const activityTimeField = findField(fields, ["Activity DateTime", "Conversion DateTime"]);
  const convField = findField(fields, ["Total Conversions", "Conversions"]);
  const revField = findField(fields, ["Total Revenue", "Revenue"]);

  // ---- Decide the journey key (user's "Auto" choice) ----
  // A Conversion ID is usable only if it survived as a full integer; Excel
  // often flattens 19-digit IDs to scientific notation ("1.03E+19"), collapsing
  // thousands of conversions onto a handful of keys. Detect that and fall back.
  const cidLooksValid = (v: string | undefined) => !!v && /^\d{6,}$/.test(v.trim());
  let validCid = 0;
  if (convIdField) for (const r of rows) if (cidLooksValid(r[convIdField])) validCid++;
  const useConvId = !!convIdField && rows.length > 0 && validCid / rows.length >= 0.8;
  const grouping: "conversionId" | "encryptedUserId" = useConvId ? "conversionId" : "encryptedUserId";
  const keyField = useConvId ? convIdField! : userField ?? convIdField ?? touchpointField;

  // ---- Group rows into journeys ----
  interface Group {
    touches: Touch[];
    conversions: number;
    revenue: number;
    firstTimeMs: number;
    convTimeMs: number;
    anyTiming: boolean;
  }
  const groups = new Map<string, Group>();
  let anyRevenue = false;
  let anyTiming = false;

  rows.forEach((r, idx) => {
    const site = (r[touchpointField] ?? "").trim();
    if (!site) return;

    const key = (r[keyField] ?? "").trim() || `__row_${idx}`;
    const conv = convField ? parseNumber(r[convField]) : 0;
    const rev = revField ? parseNumber(r[revField]) : NaN;
    const tMs = interactionTimeField ? parseTime(r[interactionTimeField]) : NaN;
    const aMs = activityTimeField ? parseTime(r[activityTimeField]) : NaN;
    const iNum = interactionNumField ? parseNumber(r[interactionNumField]) : NaN;

    let g = groups.get(key);
    if (!g) {
      g = { touches: [], conversions: 0, revenue: 0, firstTimeMs: NaN, convTimeMs: NaN, anyTiming: false };
      groups.set(key, g);
    }
    // Order hint: prefer real timestamp; else use -InteractionNumber (1 = closest
    // to conversion, so larger numbers are earlier).
    const order = Number.isFinite(tMs) ? tMs : Number.isFinite(iNum) ? -iNum : idx;
    g.touches.push({ site, channel: classifyChannel(site), timeMs: order });

    if (Number.isFinite(conv) && conv > 0) {
      g.conversions += conv;
      if (Number.isFinite(rev)) {
        g.revenue += rev;
        if (rev > 0) anyRevenue = true;
      }
      if (Number.isFinite(aMs)) g.convTimeMs = Math.max(Number.isFinite(g.convTimeMs) ? g.convTimeMs : -Infinity, aMs);
    }
    if (Number.isFinite(tMs)) {
      g.anyTiming = true;
      anyTiming = true;
      g.firstTimeMs = Math.min(Number.isFinite(g.firstTimeMs) ? g.firstTimeMs : Infinity, tMs);
    }
  });

  // ---- Materialize Path[] ----
  const paths: Path[] = [];
  for (const g of groups.values()) {
    if (g.conversions <= 0) continue; // no conversion to attribute
    g.touches.sort((a, b) => a.timeMs - b.timeMs);

    // days-to-convert: conversion time minus first interaction time
    let days = NaN;
    const convTime = Number.isFinite(g.convTimeMs) ? g.convTimeMs : g.touches[g.touches.length - 1]?.timeMs;
    if (g.anyTiming && Number.isFinite(g.firstTimeMs) && Number.isFinite(convTime)) {
      days = Math.max(0, (convTime - g.firstTimeMs) / MS_PER_DAY);
    }
    paths.push({
      touches: g.touches,
      conversions: g.conversions,
      revenue: Number.isFinite(g.revenue) ? g.revenue : 0,
      daysToConvert: days,
    });
  }

  return { paths, grouping, touchpointField, hasRevenue: anyRevenue, hasTiming: anyTiming };
}

// ---------------------------------------------------------------------------
// Shape 2: aggregated "*path" column -> Path[]
// ---------------------------------------------------------------------------

function buildFromAggregated(input: ParsedInput): { paths: Path[]; touchpointField: string } | null {
  const { rows, fields } = input;
  const pathField = fields.find((f) => f.toLowerCase().endsWith("path"));
  if (!pathField) return null;
  const convCandidates = fields.filter((f) => f !== pathField && f.toLowerCase().includes("conversion"));
  const convField =
    convCandidates.find((f) => f.toLowerCase() === "total conversions") ??
    convCandidates.find((f) => f.toLowerCase().includes("total")) ??
    convCandidates[0];

  const paths: Path[] = [];
  for (const r of rows) {
    const rawPath = (r[pathField] ?? "").trim();
    if (!rawPath || rawPath.toLowerCase() === "grand total") continue;
    const conv = convField ? parseNumber(r[convField]) : NaN;
    if (!Number.isFinite(conv) || conv <= 0) continue;
    const sites = rawPath.split(">").map((s) => s.trim()).filter(Boolean);
    if (!sites.length) continue;
    paths.push({
      touches: sites.map((s) => ({ site: s, channel: classifyChannel(s), timeMs: NaN })),
      conversions: conv,
      revenue: 0,
      daysToConvert: NaN,
    });
  }
  return { paths, touchpointField: pathField };
}

// ---------------------------------------------------------------------------
// Path[] -> AnalyzeResponse
// ---------------------------------------------------------------------------

const VELOCITY_BUCKETS: { label: string; max: number }[] = [
  { label: "Same day", max: 1 },
  { label: "1–3 days", max: 3 },
  { label: "4–7 days", max: 7 },
  { label: "8–14 days", max: 14 },
  { label: "15–30 days", max: 30 },
  { label: "30+ days", max: Infinity },
];

function stageFromRatio(lastTouch: number, assisted: number): Stage {
  if (lastTouch === 0 && assisted > 0) return "Introducer";
  const ratio = lastTouch > 0 ? assisted / lastTouch : 0;
  if (ratio > 3) return "Introducer";
  if (ratio >= 0.5) return "Nurturer";
  return "Closer";
}

interface SiteAcc {
  channel: Channel;
  lastTouch: number;
  assisted: number;
  firstTouch: number;
  linear: number;
  revenue: number;
  attribRevenue: number; // revenue split linearly across a path's touchpoints
  partConv: number; // conversions this site participated in (for cost/ROAS)
  daysW: number; // sum(days * w) over participated, timed conversions
  timedW: number;
}
interface ChannelAcc {
  partW: number;
  daysW: number;
  timedW: number;
  touchW: number;
}
interface PathAcc {
  path: string[];
  conversions: number;
  revenue: number;
  daysW: number;
  timedW: number;
}

function computeResponse(
  paths: Path[],
  meta: { format: "interaction" | "aggregated"; grouping: AnalyzeResponse["meta"]["grouping"]; touchpointField: string; rowsParsed: number; hasRevenue: boolean; hasTiming: boolean },
): AnalyzeResponse {
  let totalConversions = 0;
  let totalInteractions = 0;
  let multiTouch = 0;
  let singleTouch = 0;
  let revenueTotal = 0;
  let daysW = 0;
  let timedW = 0;

  const siteStats = new Map<string, SiteAcc>();
  const channelPart = new Map<string, ChannelAcc>();
  const firstTouchCh = new Map<string, number>();
  const linearCh = new Map<string, number>();
  const lastClickCh = new Map<string, number>();
  const pathGroups = new Map<string, PathAcc>();
  const velocityCounts = new Array(VELOCITY_BUCKETS.length).fill(0);

  const ensureSite = (site: string, channel: Channel): SiteAcc => {
    let s = siteStats.get(site);
    if (!s) {
      s = { channel, lastTouch: 0, assisted: 0, firstTouch: 0, linear: 0, revenue: 0, attribRevenue: 0, partConv: 0, daysW: 0, timedW: 0 };
      siteStats.set(site, s);
    }
    return s;
  };
  const bumpSite = (site: string, channel: Channel, field: "lastTouch" | "assisted", w: number) => {
    ensureSite(site, channel)[field] += w;
  };

  for (const p of paths) {
    const w = p.conversions;
    if (w <= 0 || p.touches.length === 0) continue;
    const n = p.touches.length;
    const first = p.touches[0];
    const last = p.touches[n - 1];
    const timed = Number.isFinite(p.daysToConvert);

    totalConversions += w;
    totalInteractions += n * w;
    if (n > 1) multiTouch += w;
    else singleTouch += w;
    revenueTotal += p.revenue;
    if (timed) {
      daysW += p.daysToConvert * w;
      timedW += w;
      const bi = VELOCITY_BUCKETS.findIndex((b) => p.daysToConvert <= b.max);
      velocityCounts[bi === -1 ? VELOCITY_BUCKETS.length - 1 : bi] += w;
    }

    // Last touch + revenue to the closer.
    bumpSite(last.site, last.channel, "lastTouch", w);
    const closer = siteStats.get(last.site)!;
    closer.revenue += p.revenue;

    // Assists: unique sites excluding the closer position.
    const assistSites = new Set(p.touches.slice(0, -1).map((t) => t.site));
    for (const site of assistSites) {
      const ch = classifyChannel(site);
      bumpSite(site, ch, "assisted", w);
    }

    // Per-site first-touch + linear credit (powers the per-publisher model chart).
    ensureSite(first.site, first.channel).firstTouch += w;
    for (const t of p.touches) ensureSite(t.site, t.channel).linear += w / n;

    // Per-site participation: revenue (split linearly across touchpoints, so
    // introducers share value too), conversion count for cost, and timing.
    const uniqueSites = new Set(p.touches.map((t) => t.site));
    const revShare = uniqueSites.size > 0 ? p.revenue / uniqueSites.size : 0;
    for (const site of uniqueSites) {
      const s = siteStats.get(site);
      if (!s) continue;
      s.partConv += w;
      s.attribRevenue += revShare;
      if (timed) {
        s.daysW += p.daysToConvert * w;
        s.timedW += w;
      }
    }

    // Attribution models (by channel).
    inc(lastClickCh, last.channel, w);
    inc(firstTouchCh, first.channel, w);
    for (const t of p.touches) inc(linearCh, t.channel, w / n);

    // Channel participation (unique channels).
    const uniqueChannels = new Set(p.touches.map((t) => t.channel));
    for (const ch of uniqueChannels) {
      let c = channelPart.get(ch);
      if (!c) {
        c = { partW: 0, daysW: 0, timedW: 0, touchW: 0 };
        channelPart.set(ch, c);
      }
      c.partW += w;
      c.touchW += n * w;
      if (timed) {
        c.daysW += p.daysToConvert * w;
        c.timedW += w;
      }
    }

    // Top paths keyed by channel sequence.
    const channelPath = p.touches.map((t) => t.channel);
    const key = channelPath.join(" > ");
    let g = pathGroups.get(key);
    if (!g) {
      g = { path: channelPath, conversions: 0, revenue: 0, daysW: 0, timedW: 0 };
      pathGroups.set(key, g);
    }
    g.conversions += w;
    g.revenue += p.revenue;
    if (timed) {
      g.daysW += p.daysToConvert * w;
      g.timedW += w;
    }
  }

  // ---- Funnel breakdown = channel rollup of the site matrix ----
  const directCh = new Map<string, number>();
  const assistedCh = new Map<string, number>();
  for (const [, s] of siteStats) {
    inc(directCh, s.channel, s.lastTouch);
    inc(assistedCh, s.channel, s.assisted);
  }
  const buildFunnel = (m: Map<string, number>): NameValue[] => {
    const out: NameValue[] = PRIMARY_CHANNELS.map((name) => ({ name, value: round2(m.get(name) ?? 0) }));
    const other = m.get("Other") ?? 0;
    if (other > 0) out.push({ name: "Other", value: round2(other) });
    return out.filter((d) => d.value > 0 || PRIMARY_CHANNELS.includes(d.name as Channel));
  };

  // ---- Attribution models per channel ----
  const modelChannels = new Set<string>([...firstTouchCh.keys(), ...linearCh.keys(), ...lastClickCh.keys()]);
  const attributionModels: AttributionModelRow[] = [...modelChannels]
    .map((channel) => ({
      channel,
      firstTouch: round2(firstTouchCh.get(channel) ?? 0),
      linear: round2(linearCh.get(channel) ?? 0),
      lastClick: round2(lastClickCh.get(channel) ?? 0),
    }))
    .sort((a, b) => b.lastClick + b.firstTouch - (a.lastClick + a.firstTouch));

  // ---- Channel stats ----
  const channelStats: ChannelStat[] = [...channelPart.entries()]
    .map(([channel, c]) => ({
      channel,
      conversions: round2(lastClickCh.get(channel) ?? 0),
      lastTouch: round2(directCh.get(channel) ?? 0),
      assisted: round2(assistedCh.get(channel) ?? 0),
      avgDaysToConvert: c.timedW > 0 ? round2(c.daysW / c.timedW) : 0,
      avgTouchpoints: c.partW > 0 ? round2(c.touchW / c.partW) : 0,
    }))
    .sort((a, b) => b.lastTouch + b.assisted - (a.lastTouch + a.assisted));

  // ---- Top paths (+ badges) ----
  const rawTop = [...pathGroups.values()].sort((a, b) => b.conversions - a.conversions).slice(0, 12);
  const maxConv = rawTop.reduce((m, g) => Math.max(m, g.conversions), 0);
  // Path ROAS = revenue / (conversions x blended eCPA across the path's channels).
  const pathRoas = (g: PathAcc): number => {
    if (g.revenue <= 0 || g.conversions <= 0) return 0;
    const uniq = [...new Set(g.path)];
    const blended = uniq.reduce((s, ch) => s + ecpaFor(ch), 0) / uniq.length;
    return blended > 0 ? g.revenue / (g.conversions * blended) : 0;
  };
  const roasList = rawTop.map(pathRoas).filter((x) => x > 0).sort((a, b) => a - b);
  const roasP70 = roasList.length ? roasList[Math.floor(0.7 * (roasList.length - 1))] : Infinity;
  const timedTop = rawTop.filter((g) => g.timedW > 0).map((g) => g.daysW / g.timedW);
  const fastThreshold = timedTop.length ? Math.min(...timedTop) * 1.5 : 0;

  const topPaths: TopPath[] = rawTop.map((g) => {
    const avgDays = g.timedW > 0 ? g.daysW / g.timedW : 0;
    const roas = pathRoas(g);
    const badges: string[] = [];
    if (g.conversions === maxConv && maxConv > 0) badges.push("Top Volume");
    if (meta.hasRevenue && roas > 0 && roas >= roasP70) badges.push("Highly Profitable");
    if (meta.hasTiming && g.timedW > 0 && avgDays <= fastThreshold) badges.push("Fastest Velocity");
    if (g.path.length >= 3 && (g.path[0] === "Video" || g.path[0] === "Display")) badges.push("Upper-Funnel Play");
    return {
      path: g.path,
      conversions: round2(g.conversions),
      percentageOfTotal: totalConversions > 0 ? round2((g.conversions / totalConversions) * 100) : 0,
      avgDaysToConvert: round2(avgDays),
      revenue: round2(g.revenue),
      roas: round2(roas),
      badges: badges.slice(0, 2),
    };
  });

  // ---- Site performance matrix ----
  const sitePerformanceMatrix: SitePerformanceRow[] = [...siteStats.entries()]
    .map(([site, s]) => ({
      site,
      channel: s.channel,
      lastTouch: round2(s.lastTouch),
      assisted: round2(s.assisted),
      firstTouch: round2(s.firstTouch),
      linear: round2(s.linear),
      totalContribution: round2(s.lastTouch + s.assisted),
      assistToLastRatio: s.lastTouch > 0 ? round2(s.assisted / s.lastTouch) : null,
      revenue: round2(s.revenue),
      roas:
        s.partConv > 0 && s.attribRevenue > 0
          ? round2(s.attribRevenue / (s.partConv * ecpaFor(s.channel)))
          : 0,
      avgDaysToConvert: s.timedW > 0 ? round2(s.daysW / s.timedW) : 0,
      stage: stageFromRatio(s.lastTouch, s.assisted),
    }))
    .sort((a, b) => b.totalContribution - a.totalContribution);

  const velocity: VelocityBucket[] = VELOCITY_BUCKETS.map((b, i) => ({
    label: b.label,
    conversions: round2(velocityCounts[i]),
  }));

  return {
    meta: {
      format: meta.format,
      grouping: meta.grouping,
      touchpointField: meta.touchpointField,
      rowsParsed: meta.rowsParsed,
      pathsAnalyzed: paths.length,
      hasRevenue: meta.hasRevenue,
      hasTiming: meta.hasTiming,
    },
    kpis: {
      totalConversions: round2(totalConversions),
      multiTouchConversions: round2(multiTouch),
      singleTouchConversions: round2(singleTouch),
      avgInteractions: totalConversions > 0 ? round2(totalInteractions / totalConversions) : 0,
      avgDaysToConvert: timedW > 0 ? round2(daysW / timedW) : 0,
      totalRevenue: round2(revenueTotal),
    },
    funnelBreakdown: { direct: buildFunnel(directCh), assisted: buildFunnel(assistedCh) },
    attributionModels,
    channelStats,
    topPaths,
    sitePerformanceMatrix,
    velocity,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export class AnalyzeError extends Error {}

export function analyze(rawText: string, target: string): AnalyzeResponse {
  if (!rawText.trim()) throw new AnalyzeError("Uploaded file is empty.");
  const input = parseCsv(rawText);
  if (!input.fields.length) throw new AnalyzeError("Could not parse any columns from the file.");

  const fieldsLower = input.fields.map((f) => f.toLowerCase());
  const isInteraction =
    fieldsLower.includes("conversion id") || fieldsLower.includes("interaction number");

  let paths: Path[];
  let grouping: AnalyzeResponse["meta"]["grouping"] = "none";
  let touchpointField: string;
  let hasRevenue = false;
  let hasTiming = false;
  let format: "interaction" | "aggregated";

  if (isInteraction) {
    const built = buildFromInteractions(input);
    paths = built.paths;
    grouping = built.grouping;
    touchpointField = built.touchpointField;
    hasRevenue = built.hasRevenue;
    hasTiming = built.hasTiming;
    format = "interaction";
  } else {
    const agg = buildFromAggregated(input);
    if (!agg) {
      throw new AnalyzeError(
        `Unrecognized report structure. Columns: [${input.fields.join(", ")}]. Expected a CM360 Path-to-Conversion export (interaction-level with 'Conversion ID', or a '*path' column).`,
      );
    }
    paths = agg.paths;
    touchpointField = agg.touchpointField;
    format = "aggregated";
  }

  // Optional case-insensitive filter on any touchpoint name in the path.
  const targetLc = target.trim().toLowerCase();
  if (targetLc) {
    paths = paths.filter((p) => p.touches.some((t) => t.site.toLowerCase().includes(targetLc)));
  }

  return computeResponse(paths, {
    format,
    grouping,
    touchpointField,
    rowsParsed: input.rows.length,
    hasRevenue,
    hasTiming,
  });
}
