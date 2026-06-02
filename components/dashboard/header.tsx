"use client";

import { cn } from "@/lib/utils";
import { Calendar, Globe, Download, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [region, setRegion] = useState("Global");

  return (
    <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">
          CMO Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Range Selector */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground hover:bg-white/[0.06] transition-all duration-200">
          <Calendar className="w-4 h-4 text-neon-cyan" />
          <span>{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Region Selector */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground hover:bg-white/[0.06] transition-all duration-200">
          <Globe className="w-4 h-4 text-neon-purple" />
          <span>{region}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Export Button */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-cyan text-sm font-medium text-white hover:opacity-90 transition-all duration-200">
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>

        {/* User avatar */}
        <button className="w-9 h-9 rounded-lg overflow-hidden bg-secondary ring-2 ring-transparent hover:ring-neon-cyan/50 transition-all duration-200 ml-2">
          <div className="w-full h-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-xs font-semibold text-white">
            CM
          </div>
        </button>
      </div>
    </header>
  );
}
