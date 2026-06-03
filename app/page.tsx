"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileTopBar, MobileBottomNav } from "@/components/dashboard/mobile-nav";
import { OrientationManager } from "@/components/dashboard/orientation-manager";
import { AnalysisProvider } from "@/components/dashboard/analysis-context";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { AttributionSection } from "@/components/dashboard/sections/attribution";
import { JourneyMappingSection } from "@/components/dashboard/sections/journey-mapping";
import { VendorMatrixSection } from "@/components/dashboard/sections/vendor-matrix";
import { SettingsSection } from "@/components/dashboard/sections/settings";

export type Section = "attribution" | "journey" | "vendor" | "settings";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("attribution");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "attribution":
        return <AttributionSection />;
      case "journey":
        return <JourneyMappingSection />;
      case "vendor":
        return <VendorMatrixSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <AttributionSection />;
    }
  };

  return (
    <AnalysisProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar (hidden on phones) */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* min-w-0 lets wide charts/tables shrink instead of forcing horizontal scroll */}
        <div
          className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-out ${
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
          }`}
        >
          <MobileTopBar activeSection={activeSection} />
          <Header />
          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
            <OrientationManager />
            {/* Persistent upload/source bar so a single report powers every tab. */}
            {activeSection !== "settings" && (
              <div className="mb-4 lg:mb-6">
                <UploadPanel />
              </div>
            )}
            <div key={activeSection} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderSection()}
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation (hidden on desktop) */}
        <MobileBottomNav activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
    </AnalysisProvider>
  );
}
