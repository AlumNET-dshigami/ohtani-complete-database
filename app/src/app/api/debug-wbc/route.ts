import { NextResponse } from "next/server";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

export async function GET() {
  const urls = [
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2023&sportId=51`,
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2023&sportId=51&gameType=W`,
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2023&sportId=51&gameType=R`,
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2023&gameType=W&sportId=51`,
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2023`,
  ];

  const results = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const splits = data.stats?.[0]?.splits ?? [];
      results.push({
        url,
        status: res.status,
        splitsCount: splits.length,
        firstSplit: splits[0] ? { date: splits[0].date, opponent: splits[0].opponent?.name } : null,
      });
    } catch (error) {
      results.push({
        url,
        status: "error",
        error: String(error),
      });
    }
  }

  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
