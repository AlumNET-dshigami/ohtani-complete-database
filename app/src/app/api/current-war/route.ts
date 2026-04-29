import { NextResponse } from "next/server";
import { getCurrentSeasonWAR } from "@/lib/war-source";

export const revalidate = 86400; // 1 day; matches source page update cadence.

export async function GET() {
  const result = await getCurrentSeasonWAR();
  const headers: Record<string, string> = {};
  // When the live scrape failed and we are serving the manual fallback,
  // shorten the edge cache so a recovery on the next request can replace
  // the stale snapshot quickly instead of being pinned for a full day.
  if (result.source !== "live") {
    headers["Cache-Control"] = "s-maxage=300, stale-while-revalidate=86400";
  }
  return NextResponse.json(result, { headers });
}
