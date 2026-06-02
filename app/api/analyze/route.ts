import { NextResponse, type NextRequest } from "next/server";
import { analyze, AnalyzeError } from "@/lib/attribution-engine";

/**
 * POST /api/analyze
 * -----------------------------------------------------------------------------
 * Accepts a raw Campaign Manager 360 Path-to-Conversion CSV (multipart/form-data)
 * and returns the structured attribution analysis (see lib/analyze-types.ts).
 *
 * Form fields:
 *   - file             (required)  the CM360 CSV export
 *   - targetCampaign   (optional)  case-insensitive substring filter on touchpoints
 *   - targetAdvertiser (optional)  alias for the filter
 *
 * The heavy lifting (format detection, journey grouping, attribution) lives in
 * lib/attribution-engine.ts so it stays unit-testable and this handler thin.
 */

export const runtime = "nodejs";

function readField(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data containing a CSV file." },
        { status: 400 },
      );
    }

    // CSV expected under "file"; fall back to the first Blob present.
    let file = form.get("file");
    if (!(file instanceof Blob)) {
      for (const value of form.values()) {
        if (value instanceof Blob) {
          file = value;
          break;
        }
      }
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No CSV file found in upload (expected form field 'file')." },
        { status: 400 },
      );
    }

    const target = readField(form, "targetCampaign") || readField(form, "targetAdvertiser");
    const rawText = await file.text();

    const result = analyze(rawText, target);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof AnalyzeError) {
      // Expected, user-facing parsing problems.
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[/api/analyze] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to process the report. Please verify the file and try again." },
      { status: 500 },
    );
  }
}
