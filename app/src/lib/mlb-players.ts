import type { BattingStats, PitchingStats } from "./types";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

export interface PlayerSummary {
  id: number;
  fullName: string;
  nameJa?: string;
  team: string;
  position: string;
  number: string;
  headshotUrl: string;
  batting: BattingStats | null;
  pitching: PitchingStats | null;
}

interface PersonApi {
  id?: number;
  fullName?: string;
  currentTeam?: { name?: string };
  primaryPosition?: { name?: string; abbreviation?: string };
  primaryNumber?: string;
}

interface SplitStat {
  stat: Record<string, unknown>;
  team?: { name?: string };
  league?: { name?: string };
  season?: string;
}

function buildHeadshotUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function parseBatting(stat: Record<string, unknown>, season: string, team: string): BattingStats {
  return {
    season,
    team,
    league: "MLB",
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

function parsePitching(stat: Record<string, unknown>, season: string, team: string): PitchingStats {
  return {
    season,
    team,
    league: "MLB",
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

export async function getPlayerSummary(
  playerId: number,
  nameJa: string | undefined,
  season: number
): Promise<PlayerSummary | null> {
  try {
    const [personRes, hitRes, pitchRes] = await Promise.all([
      fetch(`${MLB_API_BASE}/people/${playerId}?hydrate=currentTeam`, {
        next: { revalidate: 1800 },
      }),
      fetch(
        `${MLB_API_BASE}/people/${playerId}/stats?stats=season&group=hitting&season=${season}`,
        { next: { revalidate: 600 } }
      ),
      fetch(
        `${MLB_API_BASE}/people/${playerId}/stats?stats=season&group=pitching&season=${season}`,
        { next: { revalidate: 600 } }
      ),
    ]);

    if (!personRes.ok) return null;
    const personData = await personRes.json();
    const person: PersonApi = personData.people?.[0] ?? {};

    let batting: BattingStats | null = null;
    if (hitRes.ok) {
      const hitData = await hitRes.json();
      const split: SplitStat | undefined = hitData.stats?.[0]?.splits?.[0];
      if (split) {
        batting = parseBatting(split.stat, String(season), split.team?.name ?? "N/A");
      }
    }

    let pitching: PitchingStats | null = null;
    if (pitchRes.ok) {
      const pitchData = await pitchRes.json();
      const split: SplitStat | undefined = pitchData.stats?.[0]?.splits?.[0];
      if (split) {
        pitching = parsePitching(split.stat, String(season), split.team?.name ?? "N/A");
      }
    }

    return {
      id: playerId,
      fullName: person.fullName ?? "Unknown",
      nameJa,
      team: person.currentTeam?.name ?? "N/A",
      position: person.primaryPosition?.abbreviation ?? "N/A",
      number: person.primaryNumber ?? "-",
      headshotUrl: buildHeadshotUrl(playerId),
      batting,
      pitching,
    };
  } catch {
    return null;
  }
}

export async function getMultiplePlayerSummaries(
  players: { id: number; nameJa?: string }[],
  season: number
): Promise<PlayerSummary[]> {
  const results = await Promise.all(
    players.map((p) => getPlayerSummary(p.id, p.nameJa, season))
  );
  return results.filter((r): r is PlayerSummary => r !== null);
}
