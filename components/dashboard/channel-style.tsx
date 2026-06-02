import { Globe, Monitor, Search, Share2, Tv, type LucideIcon } from "lucide-react";

// Visual language for the funnel channels produced by classifyChannel()
// (Search / Video / Display / Social / Other).

export const CHANNEL_COLORS: Record<string, string> = {
  Search: "#22d3ee", // neon-cyan
  Video: "#a855f7", // neon-purple
  Display: "#34d399", // neon-emerald
  Social: "#fb923c", // neon-coral
  Other: "#64748b", // slate
};

export function channelColor(name: string): string {
  return CHANNEL_COLORS[name] ?? "#64748b";
}

export function channelIcon(name: string): LucideIcon {
  switch (name) {
    case "Search":
      return Search;
    case "Video":
      return Tv;
    case "Display":
      return Monitor;
    case "Social":
      return Share2;
    default:
      return Globe;
  }
}
