const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

export interface LeaderEntry {
  rank: number;
  playerName: string;
  teamName: string;
  value: string;
  playerId: number;
  isOhtani: boolean;
}

export interface LeaderCategory {
  categoryLabel: string;
  categoryKey: string;
  leaders: LeaderEntry[];
  ohtaniRank: number | null;        // Ohtani's overall rank (null = not ranked)
  ohtaniValue: string | null;       // Ohtani's value
  totalRanked: number;              // Total number of ranked players we looked at
}

interface LeaderSplit {
  rank?: number;
  value?: string;
  person?: { id?: number; fullName?: string };
  team?: { name?: string };
}

interface LeaderCategoryRaw {
  leaderCategory?: string;
  leaders?: LeaderSplit[];
}

const BATTING_CATEGORIES = [
  { key: "homeRuns", label: "本塁打 (HR)" },
  { key: "battingAverage", label: "打率 (AVG)" },
  { key: "runsBattedIn", label: "打点 (RBI)" },
  { key: "onBasePlusSlugging", label: "OPS" },
  { key: "stolenBases", label: "盗塁 (SB)" },
  { key: "hits", label: "安打 (H)" },
  { key: "runs", label: "得点 (R)" },
  { key: "onBasePercentage", label: "出塁率 (OBP)" },
  { key: "sluggingPercentage", label: "長打率 (SLG)" },
  { key: "totalBases", label: "塁打 (TB)" },
];

const PITCHING_CATEGORIES = [
  { key: "earnedRunAverage", label: "防御率 (ERA)" },
  { key: "wins", label: "勝利 (W)" },
  { key: "strikeouts", label: "奪三振 (SO)" },
  { key: "walksAndHitsPerInningPitched", label: "WHIP" },
  { key: "inningsPitched", label: "投球回 (IP)" },
  { key: "saves", label: "セーブ (SV)" },
  { key: "strikeoutsPer9Inn", label: "K/9" },
  { key: "winPercentage", label: "勝率" },
];

async function fetchLeaders(
  categories: { key: string; label: string }[],
  season: number,
  group: "hitting" | "pitching"
): Promise<LeaderCategory[]> {
  const catKeys = categories.map((c) => c.key).join(",");
  // Fetch up to 300 per category so we can locate Ohtani's overall rank
  const url = `${MLB_API_BASE}/stats/leaders?leaderCategories=${catKeys}&season=${season}&sportId=1&statGroup=${group}&limit=300`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();

    const results: LeaderCategory[] = [];
    const rawCategories: LeaderCategoryRaw[] = data.leagueLeaders ?? [];

    for (const raw of rawCategories) {
      const catConfig = categories.find((c) => c.key === raw.leaderCategory);
      if (!catConfig) continue;

      const allLeaders = raw.leaders ?? [];

      // Find Ohtani's rank across the full list
      const ohtaniEntry = allLeaders.find((l) => l.person?.id === OHTANI_PLAYER_ID);
      const ohtaniRank = ohtaniEntry?.rank ?? null;
      const ohtaniValue = ohtaniEntry?.value ?? null;

      // Top 10 for display
      const leaders: LeaderEntry[] = allLeaders.slice(0, 10).map((l) => ({
        rank: l.rank ?? 0,
        playerName: l.person?.fullName ?? "N/A",
        teamName: l.team?.name ?? "N/A",
        value: l.value ?? "-",
        playerId: l.person?.id ?? 0,
        isOhtani: l.person?.id === OHTANI_PLAYER_ID,
      }));

      results.push({
        categoryLabel: catConfig.label,
        categoryKey: catConfig.key,
        leaders,
        ohtaniRank,
        ohtaniValue,
        totalRanked: allLeaders.length,
      });
    }

    return results;
  } catch {
    return [];
  }
}

export async function getBattingLeaders(season: number): Promise<LeaderCategory[]> {
  return fetchLeaders(BATTING_CATEGORIES, season, "hitting");
}

export async function getPitchingLeaders(season: number): Promise<LeaderCategory[]> {
  return fetchLeaders(PITCHING_CATEGORIES, season, "pitching");
}
