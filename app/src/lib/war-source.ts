import {
  fetchWARFromNobitaRetire,
  type WARRankingResult,
  type WARSnapshot,
} from "./war-scraper";
// Manual fallback snapshot. Editing convention for current-season-war.json:
// always write WAR numbers with 2 decimal places (e.g. 0.91, 1.31, 2.20),
// even when the trailing digit is zero. JSON itself treats 2.2 and 2.20 as
// the same value, but humans diff this file by eye, and a consistent width
// makes copy/paste from nobita-retire.com less error-prone.
import manualSnapshot from "@/data/current-season-war.json";

export type WARSource = "live" | "manual";

export interface WARResult {
  snapshot: WARSnapshot;
  source: WARSource;
}

// Note: in-memory layer was removed intentionally.
// Vercel serverless lambdas do not share module-scope memory across instances,
// so a Map-based cache cannot reliably survive between requests. Next.js ISR
// (revalidate: 86400 on the API route / consumer pages) already provides the
// same once-per-day caching window, so a second in-process layer adds
// complexity without a guarantee. Pipeline is now: live -> manual JSON.

function isUsable(snapshot: WARSnapshot): boolean {
  // Require total fWAR + rWAR so callers can always render "合計WAR".
  // war-scraper derives total from batting + pitching when missing, so a
  // genuinely partial scrape (e.g. only batting available) correctly falls
  // through to the manual snapshot instead of being labelled "live".
  return snapshot.total.fWAR !== null && snapshot.total.rWAR !== null;
}

// Seasons whose fWAR is finalized in current-season-war.json (FanGraphs
// leaderboard). For these years the manual fWAR always wins over the live
// scrape; rWAR keeps flowing from the live scrape untouched.
const FINAL_FWAR_YEAR = 2026;

function finalFWAR(year: number): WARSnapshot | null {
  const manual = manualSnapshot as WARSnapshot;
  return year === FINAL_FWAR_YEAR && manual.year === year ? manual : null;
}

function withFinalFWAR(live: WARSnapshot, final: WARSnapshot): WARSnapshot {
  return {
    ...live,
    batting: { ...live.batting, fWAR: final.batting.fWAR },
    pitching: { ...live.pitching, fWAR: final.pitching.fWAR },
    total: { ...live.total, fWAR: final.total.fWAR },
  };
}

/** Pin Ohtani's fWAR in the live TOP20 ranking to the finalized value. */
export function applyFinalFWARToRanking(
  ranking: WARRankingResult,
  year: number
): WARRankingResult {
  const final = finalFWAR(year);
  if (!final || !ranking.ohtaniEntry) return ranking;
  const ohtaniEntry = { ...ranking.ohtaniEntry, fWAR: final.total.fWAR };
  return {
    ...ranking,
    ohtaniEntry,
    entries: ranking.entries.map((e) => (e.isOhtani ? ohtaniEntry : e)),
  };
}

export async function getCurrentSeasonWAR(year?: number): Promise<WARResult> {
  const targetYear = year ?? new Date().getFullYear();

  try {
    const live = await fetchWARFromNobitaRetire(targetYear);
    if (isUsable(live)) {
      const final = finalFWAR(targetYear);
      return {
        snapshot: final ? withFinalFWAR(live, final) : live,
        source: "live",
      };
    }
  } catch {
    // fall through to manual
  }

  const manual = manualSnapshot as WARSnapshot;
  return { snapshot: manual, source: "manual" };
}
