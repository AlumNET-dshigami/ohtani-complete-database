import type {
  BattingStats,
  GameLogBatting,
  GameLogPitching,
  PitchingStats,
  PlayerInfo,
  SeasonStats,
} from "./types";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

const DEFAULT_PLAYER: PlayerInfo = {
  id: OHTANI_PLAYER_ID,
  fullName: "Shohei Ohtani",
  currentTeam: "Los Angeles Dodgers",
  position: "Designated Hitter",
  batSide: "Left",
  throwSide: "Right",
  height: "6' 4\"",
  weight: 210,
  birthDate: "1994-07-05",
  birthCountry: "Japan",
  number: "17",
};

export async function getPlayerInfo(): Promise<PlayerInfo> {
  try {
    const res = await fetch(
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}?hydrate=currentTeam`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return DEFAULT_PLAYER;
    const data = await res.json();
    const person = data.people[0];

    return {
      id: person.id,
      fullName: person.fullName,
      currentTeam: person.currentTeam?.name ?? "N/A",
      position: person.primaryPosition?.name ?? "N/A",
      batSide: person.batSide?.description ?? "N/A",
      throwSide: person.pitchHand?.description ?? "N/A",
      height: person.height ?? "N/A",
      weight: person.weight ?? 0,
      birthDate: person.birthDate ?? "N/A",
      birthCountry: person.birthCountry ?? "N/A",
      number: person.primaryNumber ?? "N/A",
    };
  } catch {
    return DEFAULT_PLAYER;
  }
}

function parseBattingStats(
  stat: Record<string, unknown>,
  season: string,
  team: string,
  league: string
): BattingStats {
  return {
    season,
    team,
    league,
    gamesPlayed: (stat.gamesPlayed as number) ?? 0,
    atBats: (stat.atBats as number) ?? 0,
    runs: (stat.runs as number) ?? 0,
    hits: (stat.hits as number) ?? 0,
    doubles: (stat.doubles as number) ?? 0,
    triples: (stat.triples as number) ?? 0,
    homeRuns: (stat.homeRuns as number) ?? 0,
    rbi: (stat.rbi as number) ?? 0,
    stolenBases: (stat.stolenBases as number) ?? 0,
    baseOnBalls: (stat.baseOnBalls as number) ?? 0,
    strikeOuts: (stat.strikeOuts as number) ?? 0,
    avg: (stat.avg as string) ?? ".000",
    obp: (stat.obp as string) ?? ".000",
    slg: (stat.slg as string) ?? ".000",
    ops: (stat.ops as string) ?? ".000",
  };
}

function parsePitchingStats(
  stat: Record<string, unknown>,
  season: string,
  team: string,
  league: string
): PitchingStats {
  return {
    season,
    team,
    league,
    wins: (stat.wins as number) ?? 0,
    losses: (stat.losses as number) ?? 0,
    era: (stat.era as string) ?? "0.00",
    gamesPlayed: (stat.gamesPlayed as number) ?? 0,
    gamesStarted: (stat.gamesStarted as number) ?? 0,
    inningsPitched: (stat.inningsPitched as string) ?? "0.0",
    hits: (stat.hits as number) ?? 0,
    runs: (stat.runs as number) ?? 0,
    earnedRuns: (stat.earnedRuns as number) ?? 0,
    homeRuns: (stat.homeRuns as number) ?? 0,
    baseOnBalls: (stat.baseOnBalls as number) ?? 0,
    strikeOuts: (stat.strikeOuts as number) ?? 0,
    whip: (stat.whip as string) ?? "0.00",
    strikeoutsPer9: (stat.strikeoutsPer9Inn as string) ?? "0.00",
  };
}

interface SplitEntry {
  season: string;
  team?: { name?: string };
  league?: { name?: string };
  stat: Record<string, unknown>;
}

interface StatsGroup {
  group?: { displayName?: string };
  splits?: SplitEntry[];
}

export async function getYearByYearStats(): Promise<SeasonStats[]> {
  try {
    const [battingRes, pitchingRes] = await Promise.all([
      fetch(
        `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=yearByYear&group=hitting`,
        { next: { revalidate: 600 } }
      ),
      fetch(
        `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=yearByYear&group=pitching`,
        { next: { revalidate: 600 } }
      ),
    ]);

    if (!battingRes.ok && !pitchingRes.ok) return [];

    const battingData = battingRes.ok ? await battingRes.json() : { stats: [] };
    const pitchingData = pitchingRes.ok ? await pitchingRes.json() : { stats: [] };

    const battingByYear = new Map<string, BattingStats>();
    const pitchingByYear = new Map<string, PitchingStats>();

    const battingGroup: StatsGroup | undefined = battingData.stats?.[0];
    if (battingGroup?.splits) {
      for (const split of battingGroup.splits) {
        const season = split.season;
        const team = split.team?.name ?? "N/A";
        const league = split.league?.name ?? "N/A";
        battingByYear.set(season, parseBattingStats(split.stat, season, team, league));
      }
    }

    const pitchingGroup: StatsGroup | undefined = pitchingData.stats?.[0];
    if (pitchingGroup?.splits) {
      for (const split of pitchingGroup.splits) {
        const season = split.season;
        const team = split.team?.name ?? "N/A";
        const league = split.league?.name ?? "N/A";
        pitchingByYear.set(season, parsePitchingStats(split.stat, season, team, league));
      }
    }

    const allSeasons = new Set([...battingByYear.keys(), ...pitchingByYear.keys()]);
    const results: SeasonStats[] = [];

    for (const season of allSeasons) {
      results.push({
        season,
        batting: battingByYear.get(season) ?? null,
        pitching: pitchingByYear.get(season) ?? null,
      });
    }

    results.sort((a, b) => a.season.localeCompare(b.season));
    return results;
  } catch {
    return [];
  }
}

export async function getCurrentSeasonStats(): Promise<SeasonStats | null> {
  const currentYear = new Date().getFullYear();
  const allStats = await getYearByYearStats();
  return allStats.find((s) => s.season === String(currentYear)) ?? allStats[allStats.length - 1] ?? null;
}

interface GameLogSplitEntry {
  date: string;
  isHome: boolean;
  opponent?: { name?: string };
  stat: Record<string, unknown>;
}

function buildGameLogUrl(
  group: "hitting" | "pitching",
  season: number,
  gameType: string
): string {
  if (gameType === "WBC") {
    return `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=${group}&season=${season}&sportId=51`;
  }
  if (gameType === "POST") {
    return `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=${group}&season=${season}&gameType=F&gameType=D&gameType=L&gameType=W`;
  }
  return `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=gameLog&group=${group}&season=${season}&gameType=${gameType}`;
}

function formatGameDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatOpponent(split: GameLogSplitEntry): string {
  const prefix = split.isHome ? "vs" : "@";
  const name = split.opponent?.name ?? "N/A";
  return `${prefix} ${name}`;
}

export async function getGameLogBatting(
  season: number,
  gameType: string = "R"
): Promise<GameLogBatting[]> {
  try {
    const url = buildGameLogUrl("hitting", season, gameType);
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();

    const splits: GameLogSplitEntry[] = data.stats?.[0]?.splits ?? [];
    return splits.map((split) => ({
      date: formatGameDate(split.date),
      opponent: formatOpponent(split),
      atBats: (split.stat.atBats as number) ?? 0,
      runs: (split.stat.runs as number) ?? 0,
      hits: (split.stat.hits as number) ?? 0,
      doubles: (split.stat.doubles as number) ?? 0,
      triples: (split.stat.triples as number) ?? 0,
      homeRuns: (split.stat.homeRuns as number) ?? 0,
      rbi: (split.stat.rbi as number) ?? 0,
      baseOnBalls: (split.stat.baseOnBalls as number) ?? 0,
      strikeOuts: (split.stat.strikeOuts as number) ?? 0,
      stolenBases: (split.stat.stolenBases as number) ?? 0,
      avg: (split.stat.avg as string) ?? ".000",
    }));
  } catch {
    return [];
  }
}

export async function getGameLogPitching(
  season: number,
  gameType: string = "R"
): Promise<GameLogPitching[]> {
  try {
    const url = buildGameLogUrl("pitching", season, gameType);
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();

    const splits: GameLogSplitEntry[] = data.stats?.[0]?.splits ?? [];
    return splits.map((split) => {
      const stat = split.stat;
      let result = "-";
      if ((stat.wins as number) > 0) result = "W";
      else if ((stat.losses as number) > 0) result = "L";
      else if ((stat.saves as number) > 0) result = "S";
      else if ((stat.holds as number) > 0) result = "H";

      return {
        date: formatGameDate(split.date),
        opponent: formatOpponent(split),
        result,
        inningsPitched: (stat.inningsPitched as string) ?? "0.0",
        hits: (stat.hits as number) ?? 0,
        runs: (stat.runs as number) ?? 0,
        earnedRuns: (stat.earnedRuns as number) ?? 0,
        baseOnBalls: (stat.baseOnBalls as number) ?? 0,
        strikeOuts: (stat.strikeOuts as number) ?? 0,
        homeRuns: (stat.homeRuns as number) ?? 0,
        era: (stat.era as string) ?? "0.00",
      };
    });
  } catch {
    return [];
  }
}
