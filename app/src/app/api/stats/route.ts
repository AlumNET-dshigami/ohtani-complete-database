import { NextResponse } from "next/server";
import { getYearByYearStats, getPlayerInfo } from "@/lib/mlb-api";

export async function GET() {
  try {
    const [stats, player] = await Promise.all([
      getYearByYearStats(),
      getPlayerInfo(),
    ]);
    return NextResponse.json({ player, stats });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
