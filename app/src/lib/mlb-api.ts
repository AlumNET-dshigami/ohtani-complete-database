import type {
  BattingStats,
  GameLogBatting,
  GameLogPitching,
  PitchingStats,
  PlayerInfo,
  SeasonStats,
  VideoHighlight,
  PeriodStats,
} from "./types";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

export const OHTANI_HEADSHOT_URL = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${OHTANI_PLAYER_ID}/headshot/67/current`;

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
      { next: { revalidate: 1800 } }
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
        { next: { revalidate: 300 } }
      ),
      fetch(
        `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=yearByYear&group=pitching`,
        { next: { revalidate: 300 } }
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

// ---- Game Log ----

interface GameLogSplitEntry {
  date: string;
  isHome: boolean;
  opponent?: { name?: string };
  game?: { gamePk?: number };
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
  // S = Spring Training, E = Exhibition, A = All-Star, R = Regular Season
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
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();

    const splits: GameLogSplitEntry[] = data.stats?.[0]?.splits ?? [];
    return splits.map((split) => ({
      date: formatGameDate(split.date),
      rawDate: split.date ?? "",
      opponent: formatOpponent(split),
      gamePk: split.game?.gamePk ?? 0,
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
    const res = await fetch(url, { next: { revalidate: 300 } });
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
        rawDate: split.date ?? "",
        opponent: formatOpponent(split),
        gamePk: split.game?.gamePk ?? 0,
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

// ---- Video Highlights ----

interface HighlightPlayback {
  name?: string;
  url?: string;
}

interface HighlightItem {
  headline?: string;
  blurb?: string;
  description?: string;
  duration?: string;
  playbacks?: HighlightPlayback[];
  image?: {
    cuts?: { src?: string; width?: number }[];
  };
}

export async function getGameHighlights(gamePk: number): Promise<VideoHighlight[]> {
  if (!gamePk) return [];
  try {
    const res = await fetch(
      `${MLB_API_BASE}/game/${gamePk}/content?highlightLimit=50`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const items: HighlightItem[] =
      data.highlights?.highlights?.items ?? [];

    const playerName = "Ohtani";
    const relevant = items.filter((item) => {
      const text = `${item.headline ?? ""} ${item.blurb ?? ""} ${item.description ?? ""}`;
      return text.toLowerCase().includes(playerName.toLowerCase());
    });

    return relevant.map((item) => {
      const mp4 = item.playbacks?.find((p) => p.name === "mp4Avc");
      const fallback = item.playbacks?.find((p) => p.url?.includes(".mp4"));
      const videoUrl = mp4?.url ?? fallback?.url ?? "";

      let thumbnailUrl: string | undefined;
      if (item.image?.cuts && Array.isArray(item.image.cuts)) {
        thumbnailUrl = item.image.cuts[0]?.src;
      }

      return {
        title: item.headline ?? "",
        description: item.blurb ?? item.description ?? "",
        duration: item.duration ?? "",
        videoUrl,
        thumbnailUrl,
      };
    }).filter((v) => v.videoUrl);
  } catch {
    return [];
  }
}

// ---- Period Stats (Weekly / Monthly) ----

export function aggregatePeriodStats(
  games: GameLogBatting[],
  mode: "weekly" | "monthly"
): PeriodStats[] {
  if (games.length === 0) return [];

  const groups = new Map<string, GameLogBatting[]>();

  for (const game of games) {
    if (!game.rawDate) continue;
    const d = new Date(game.rawDate);
    if (isNaN(d.getTime())) continue;

    let key: string;
    if (mode === "monthly") {
      key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    } else {
      // Weekly: ISO week starting Monday
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      key = `${monday.getMonth() + 1}/${monday.getDate()}~`;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(game);
  }

  const results: PeriodStats[] = [];
  for (const [period, periodGames] of groups) {
    const totalAb = periodGames.reduce((s, g) => s + g.atBats, 0);
    const totalHits = periodGames.reduce((s, g) => s + g.hits, 0);
    const totalHr = periodGames.reduce((s, g) => s + g.homeRuns, 0);
    const totalRbi = periodGames.reduce((s, g) => s + g.rbi, 0);
    const totalSb = periodGames.reduce((s, g) => s + g.stolenBases, 0);
    const totalBb = periodGames.reduce((s, g) => s + g.baseOnBalls, 0);
    const totalDoubles = periodGames.reduce((s, g) => s + g.doubles, 0);
    const totalTriples = periodGames.reduce((s, g) => s + g.triples, 0);

    const avg = totalAb > 0 ? (totalHits / totalAb).toFixed(3) : ".000";
    const pa = totalAb + totalBb;
    const obp = pa > 0 ? ((totalHits + totalBb) / pa).toFixed(3) : ".000";
    const tb = totalHits + totalDoubles + totalTriples * 2 + totalHr * 3;
    const slg = totalAb > 0 ? (tb / totalAb).toFixed(3) : ".000";
    const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);

    results.push({
      period,
      games: periodGames.length,
      atBats: totalAb,
      hits: totalHits,
      homeRuns: totalHr,
      rbi: totalRbi,
      stolenBases: totalSb,
      avg,
      ops,
    });
  }

  return results;
}
