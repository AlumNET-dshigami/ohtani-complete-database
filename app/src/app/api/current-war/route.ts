import { NextResponse } from "next/server";
import { getCurrentSeasonWAR } from "@/lib/war-source";

export const revalidate = 86400; // 1 day; matches source page update cadence.

export async function GET() {
  const result = await getCurrentSeasonWAR();
  const headers: Record<string, string> = {};
  if (result.source !== "live") {
    headers["Cache-Control"] = "s-maxage=300, stale-while-revalidate=86400";
  }
  return NextResponse.json(result, { headers });
}
