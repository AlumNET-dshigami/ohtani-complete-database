/**
 * milestones.ts
 * 大谷翔平 記録達成カウントダウン — データ取得ロジック
 */

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;
const USER_AGENT =
  "OhtaniDB/1.0 (educational; github.com/AlumNET-dshigami)";

export interface MilestoneDefinition {
  category: "hitting" | "pitching";
  stat: string;
  label: string;
  milestone: number;
  emoji: string;
}

export const MILESTONES: MilestoneDefinition[] = [
  { category: "pitching", stat: "strikeOuts", label: "投手奪三振", milestone: 1000, emoji: "🎯" },
  { category: "hitting",  stat: "homeRuns",   label: "本塁打",     milestone: 300,  emoji: "💣" },
  { category: "hitting",  stat: "hits",        label: "安打",       milestone: 1500, emoji: "⚾" },
  { category: "hitting",  stat: "rbi",         label: "打点",       milestone: 1000, emoji: "💥" },
  { category: "hitting",  stat: "strikeOuts",  label: "打者三振",   milestone: 1500, emoji: "🔥" },
  { category: "pitching", stat: "wins",        label: "勝利",       milestone: 100,  emoji: "🏆" },
];

export interface CareerStatSnapshot {
  hittingHR: number;
  hittingHits: number;
  hittingRBI: number;
  hittingK: number;
  pitchingK: number;
  pitchingWins: number;
}

export interface SeasonPaceSnapshot {
  hittingHR: number;
  hittingHits: number;
  hittingRBI: number;
  hittingK: number;
  pitchingK: number;
  pitchingWins: number;
  gamesPlayed: number;
  gamesStarted: number;
}

export interface MilestoneStatus {
  def: MilestoneDefinition;
  current: number;
  remaining: number;
  achieved: boolean;
  /** 残り試合数ベースの到達予測年 (null = 計算不可) */
  projectedYear: number | null;
  pacePerGame: number | null;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

export async function getCareerStats(): Promise<CareerStatSnapshot> {
  try {
    const data = (await fetchJson(
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}?hydrate=stats(group=[hitting,pitching],type=career)`
    )) as {
      people: Array<{
        stats: Array<{
          type: { displayName: string };
          group: { displayName: string };
          splits: Array<{ stat: Record<string, unknown> }>;
        }>;
      }>;
    };

    const stats = data.people[0]?.stats ?? [];
    let hittingStat: Record<string, unknown> = {};
    let pitchingStat: Record<string, unknown> = {};

    for (const s of stats) {
      if (s.group.displayName === "hitting" && s.splits.length > 0) {
        hittingStat = s.splits[0].stat;
      }
      if (s.group.displayName === "pitching" && s.splits.length > 0) {
        pitchingStat = s.splits[0].stat;
      }
    }

    return {
      hittingHR:    Number(hittingStat.homeRuns   ?? 0),
      hittingHits:  Number(hittingStat.hits        ?? 0),
      hittingRBI:   Number(hittingStat.rbi         ?? 0),
      hittingK:     Number(hittingStat.strikeOuts  ?? 0),
      pitchingK:    Number(pitchingStat.strikeOuts ?? 0),
      pitchingWins: Number(pitchingStat.wins       ?? 0),
    };
  } catch {
    return {
      hittingHR: 291, hittingHits: 1120, hittingRBI: 704,
      hittingK: 1168, pitchingK: 737, pitchingWins: 45,
    };
  }
}

export async function getSeasonPace(year: number): Promise<SeasonPaceSnapshot> {
  try {
    const data = (await fetchJson(
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}?hydrate=stats(group=[hitting,pitching],type=season,season=${year})`
    )) as {
      people: Array<{
        stats: Array<{
          group: { displayName: string };
          splits: Array<{ stat: Record<string, unknown> }>;
        }>;
      }>;
    };

    const stats = data.people[0]?.stats ?? [];
    let hittingStat: Record<string, unknown> = {};
    let pitchingStat: Record<string, unknown> = {};

    for (const s of stats) {
      if (s.group.displayName === "hitting" && s.splits.length > 0) {
        hittingStat = s.splits[0].stat;
      }
      if (s.group.displayName === "pitching" && s.splits.length > 0) {
        pitchingStat = s.splits[0].stat;
      }
    }

    return {
      hittingHR:    Number(hittingStat.homeRuns    ?? 0),
      hittingHits:  Number(hittingStat.hits         ?? 0),
      hittingRBI:   Number(hittingStat.rbi          ?? 0),
      hittingK:     Number(hittingStat.strikeOuts   ?? 0),
      pitchingK:    Number(pitchingStat.strikeOuts  ?? 0),
      pitchingWins: Number(pitchingStat.wins        ?? 0),
      gamesPlayed:  Number(hittingStat.gamesPlayed  ?? 0),
      gamesStarted: Number(pitchingStat.gamesStarted ?? 0),
    };
  } catch {
    return {
      hittingHR: 0, hittingHits: 0, hittingRBI: 0,
      hittingK: 0, pitchingK: 0, pitchingWins: 0,
      gamesPlayed: 0, gamesStarted: 0,
    };
  }
}

/** MLB 1シーズンの標準試合数 */
const SEASON_GAMES = 162;
const PITCHER_SEASON_STARTS = 32;

function getCurrentValue(
  def: MilestoneDefinition,
  career: CareerStatSnapshot
): number {
  switch (def.stat) {
    case "homeRuns":   return career.hittingHR;
    case "hits":       return career.hittingHits;
    case "rbi":        return career.hittingRBI;
    case "strikeOuts": return def.category === "pitching" ? career.pitchingK : career.hittingK;
    case "wins":       return career.pitchingWins;
    default:           return 0;
  }
}

function getSeasonPaceValue(
  def: MilestoneDefinition,
  pace: SeasonPaceSnapshot
): { perGame: number; gameDivisor: number } {
  if (def.category === "pitching") {
    const g = pace.gamesStarted || 1;
    switch (def.stat) {
      case "strikeOuts": return { perGame: pace.pitchingK / g, gameDivisor: PITCHER_SEASON_STARTS };
      case "wins":       return { perGame: pace.pitchingWins / g, gameDivisor: PITCHER_SEASON_STARTS };
    }
  }
  const g = pace.gamesPlayed || 1;
  switch (def.stat) {
    case "homeRuns":   return { perGame: pace.hittingHR    / g, gameDivisor: SEASON_GAMES };
    case "hits":       return { perGame: pace.hittingHits  / g, gameDivisor: SEASON_GAMES };
    case "rbi":        return { perGame: pace.hittingRBI   / g, gameDivisor: SEASON_GAMES };
    case "strikeOuts": return { perGame: pace.hittingK     / g, gameDivisor: SEASON_GAMES };
    default:           return { perGame: 0, gameDivisor: SEASON_GAMES };
  }
}

export function buildMilestoneStatuses(
  career: CareerStatSnapshot,
  pace: SeasonPaceSnapshot,
  currentYear: number
): MilestoneStatus[] {
  return MILESTONES.map((def) => {
    const current = getCurrentValue(def, career);
    const remaining = Math.max(0, def.milestone - current);
    const achieved = remaining === 0;

    let projectedYear: number | null = null;
    let pacePerGame: number | null = null;

    if (!achieved && pace.gamesPlayed > 0) {
      const { perGame, gameDivisor } = getSeasonPaceValue(def, pace);
      pacePerGame = perGame;
      if (perGame > 0) {
        // 残り何シーズン必要か（小数）
        const seasonsNeeded = remaining / (perGame * gameDivisor);
        projectedYear = Math.ceil(currentYear + seasonsNeeded);
      }
    }

    return { def, current, remaining, achieved, projectedYear, pacePerGame };
  });
}
