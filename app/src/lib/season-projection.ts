const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

// Team regular-season games (used only as a denominator label for games played)
export const SEASON_GAMES = 162;

// Ohtani's career bests (used to flag a season that beats a personal record)
export const CAREER_BESTS = {
  homeRuns: 44,    // 2023
  rbi: 95,         // 2023
  strikeOuts: 219, // 2021 (奪三振)
  ops: 1.066,      // 2021
  wins: 15,        // 2021
};

// Name kept for API route compatibility; the data is now the season's actual
// (final) stat line, not a pace-based projection.
export interface ProjectionData {
  season: string;
  gamesPlayed: number;
  // Batting (actual)
  battingAvg: string;
  ops: string;
  obp: string;
  homeRuns: number;
  rbi: number;
  hits: number;
  // Pitching (actual)
  era: string;
  whip: string;
  wins: number;
  strikeOuts: number;
  gamesStarted: number;
  hasPitchingData: boolean;
  // true when the live API call failed and the saved final line is shown
  isFallback: boolean;
}

// 2026 regular-season final line (MLB Stats API, verified 2026-11-03).
// Used only when the live API request fails.
const FALLBACK: ProjectionData = {
  season: "2026",
  gamesPlayed: 139,
  battingAvg: ".275",
  ops: ".889",
  obp: ".377",
  homeRuns: 30,
  rbi: 81,
  hits: 144,
  era: "1.79",
  whip: "0.95",
  wins: 8,
  strikeOuts: 95,
  gamesStarted: 14,
  hasPitchingData: true,
  isFallback: true,
};

interface RawStat {
  gamesPlayed?: number;
  hits?: number;
  homeRuns?: number;
  rbi?: number;
  avg?: string;
  obp?: string;
  ops?: string;
  gamesStarted?: number;
  wins?: number;
  strikeOuts?: number;
  era?: string;
  whip?: string;
}

interface StatGroup {
  group?: { displayName?: string };
  splits?: { stat: RawStat }[];
}

async function fetchSeason(season: number): Promise<ProjectionData | null> {
  const res = await fetch(
    `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}?hydrate=stats(group=[hitting,pitching],type=season,season=${season})`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const statsGroups: StatGroup[] = data?.people?.[0]?.stats ?? [];

  let hitting: RawStat = {};
  let pitching: RawStat = {};
  for (const group of statsGroups) {
    const name = group.group?.displayName ?? "";
    const stat = group.splits?.[0]?.stat ?? {};
    if (name === "hitting") hitting = stat;
    else if (name === "pitching") pitching = stat;
  }

  const gamesPlayed = hitting.gamesPlayed ?? 0;
  if (gamesPlayed === 0) return null;

  const gamesStarted = pitching.gamesStarted ?? 0;
  return {
    season: String(season),
    gamesPlayed,
    battingAvg: hitting.avg ?? ".000",
    ops: hitting.ops ?? ".000",
    obp: hitting.obp ?? ".000",
    homeRuns: hitting.homeRuns ?? 0,
    rbi: hitting.rbi ?? 0,
    hits: hitting.hits ?? 0,
    era: pitching.era ?? "-.--",
    whip: pitching.whip ?? "-.--",
    wins: pitching.wins ?? 0,
    strikeOuts: pitching.strikeOuts ?? 0,
    gamesStarted,
    hasPitchingData: gamesStarted > 0,
    isFallback: false,
  };
}

export async function fetchSeasonProjection(): Promise<ProjectionData> {
  try {
    const year = new Date().getFullYear();
    // Early in a new calendar year there are no games yet: show the latest finished season.
    return (await fetchSeason(year)) ?? (await fetchSeason(year - 1)) ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
