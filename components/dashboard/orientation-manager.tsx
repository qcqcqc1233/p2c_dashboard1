"use client";

import { useEffect, useState } from "react";
import { RotateCw, X } from "lucide-react";

/**
 * Encourages landscape on small screens for this data-dense dashboard.
 *
 * Note: the web platform cannot force a device to rotate from a normal browser
 * tab — screen.orientation.lock() only succeeds in fullscreen or an installed
 * PWA. So we attempt the lock (no-op otherwise) AND show a dismissible nudge in
 * portrait. Portrait stays fully functional either way.
 */
export function OrientationManager() {
  const [showHint, setShowHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const orientation = screen.orientation as unknown as
      | { lock?: (o: string) => Promise<void> }
      | undefined;
    orientation?.lock?.("landscape").catch(() => {
      /* not permitted outside fullscreen / PWA — ignore */
    });

    const portrait = window.matchMedia("(orientation: portrait)");
    const small = window.matchMedia("(max-width: 900px)");
    const update = () => setShowHint(portrait.matches && small.matches);
    update();
    portrait.addEventListener("change", update);
    small.addEventListener("change", update);
    return () => {
      portrait.removeEventListener("change", update);
      small.removeEventListener("change", update);
    };
  }, []);

  if (!showHint || dismissed) return null;

  return (
    <div className="lg:hidden flex items-center gap-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2">
      <RotateCw className="w-5 h-5 text-neon-purple shrink-0" />
      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
        Rotate to landscape for the full dashboard view, optimized for wide data.
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
