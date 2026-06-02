"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
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
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-out ${
            sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
          }`}
        >
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {/* Persistent upload/source bar so a single report powers every tab. */}
            {activeSection !== "settings" && (
              <div className="mb-6">
                <UploadPanel />
              </div>
            )}
            <div key={activeSection} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>
    </AnalysisProvider>
  );
}
