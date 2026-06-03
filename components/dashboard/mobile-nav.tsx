"use client";

import { Grid3X3, LayoutDashboard, Route, Settings, Sparkles, type LucideIcon } from "lucide-react";
import type { Section } from "@/app/page";
import { cn } from "@/lib/utils";

const NAV: { id: Section; short: string; title: string; icon: LucideIcon }[] = [
  { id: "attribution", short: "Overview", title: "Attribution & Journeys", icon: LayoutDashboard },
  { id: "journey", short: "Journeys", title: "Journey Mapping", icon: Route },
  { id: "vendor", short: "Vendors", title: "Vendor Matrix", icon: Grid3X3 },
  { id: "settings", short: "Settings", title: "Settings", icon: Settings },
];

export function sectionTitle(section: Section): string {
  return NAV.find((n) => n.id === section)?.title ?? "";
}

/** Slim sticky top bar shown only on phones (the sidebar is desktop-only). */
export function MobileTopBar({ activeSection }: { activeSection: Section }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-neon-purple to-neon-cyan">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight truncate">{sectionTitle(activeSection)}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">MAD Growth · Attribution Engine</p>
      </div>
    </header>
  );
}

/** Thumb-reachable bottom tab bar shown only on phones. */
export function MobileBottomNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-[transform,color] duration-150 active:scale-95",
                active ? "text-neon-cyan" : "text-muted-foreground active:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
