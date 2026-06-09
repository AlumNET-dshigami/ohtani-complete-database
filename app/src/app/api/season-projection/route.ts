import { NextResponse } from "next/server";
import { fetchSeasonProjection } from "@/lib/season-projection";

export const revalidate = 3600;

export async function GET() {
  const data = await fetchSeasonProjection();
  return NextResponse.json(data);
}
