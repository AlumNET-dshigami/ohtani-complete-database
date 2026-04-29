import { fetchWARFromNobitaRetire, type WARSnapshot } from "./war-scraper";
import manualSnapshot from "@/data/current-season-war.json";

export type WARSource = "live" | "cache" | "manual";

export interface WARResult {
  snapshot: WARSnapshot;
  source: WARSource;
}

interface CacheEntry {
  snapshot: WARSnapshot;
  storedAt: number;
}

// Module-scope cache; survives within a single Node process between
// ISR revalidations on the same lambda instance.
const cache = new Map<number, CacheEntry>();

function isUsable(snapshot: WARSnapshot): boolean {
  return (
    snapshot.total.fWAR !== null ||
    snapshot.total.rWAR !== null ||
    snapshot.batting.fWAR !== null ||
    snapshot.pitching.fWAR !== null
  );
}

export async function getCurrentSeasonWAR(year?: number): Promise<WARResult> {
  const targetYear = year ?? new Date().getFullYear();

  try {
    const live = await fetchWARFromNobitaRetire(targetYear);
    if (isUsable(live)) {
      cache.set(targetYear, { snapshot: live, storedAt: Date.now() });
      return { snapshot: live, source: "live" };
    }
  } catch {
    // fall through to cache / manual
  }

  const cached = cache.get(targetYear);
  if (cached && isUsable(cached.snapshot)) {
    return { snapshot: cached.snapshot, source: "cache" };
  }

  const manual = manualSnapshot as WARSnapshot;
  return { snapshot: manual, source: "manual" };
}
