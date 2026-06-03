import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  /** Accent hex used for the icon chip + hover glow. */
  color: string;
  delay?: number;
}

/** Compact KPI tile fed by real analysis numbers (no synthetic sparkline). */
export function StatCard({ label, value, sublabel, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <div
      className="group relative glass-card glass-card-hover rounded-xl p-4 sm:p-5 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay * 80}ms`, animationFillMode: "both" }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 120%, ${color}15, transparent 60%)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}1a` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">{label}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</div>
        {sublabel && <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>}
      </div>
    </div>
  );
}
