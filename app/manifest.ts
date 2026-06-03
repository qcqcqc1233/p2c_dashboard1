import type { MetadataRoute } from "next";

/**
 * Web app manifest. When the dashboard is installed to the home screen (PWA),
 * `orientation: "landscape"` makes it launch in landscape automatically — the
 * one reliable way to force orientation on the web. In a normal browser tab,
 * OrientationManager attempts a best-effort lock and otherwise nudges to rotate.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MAD Growth: Omni-Channel Attribution Engine",
    short_name: "MAD Growth",
    description: "Multi-touch attribution analytics for Campaign Manager 360 Path to Conversion data.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
