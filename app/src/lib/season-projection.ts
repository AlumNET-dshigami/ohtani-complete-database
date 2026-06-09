const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;

// 2026 season constants
const SEASON_GAMES = 162;
const PROJECTED_STARTS = 28; // 2026年シーズン想定（隔週ローテ〜通常ローテ移行期）。シーズン進行に応じて更新

// 大谷の自己最高記録（予測値超え判定に使用）
export const CAREER_BESTS = {
  homeRuns: 44,    // 2023
  rbi: 95,         // 2023
  strikeOuts: 219, // 2021 (奪三振)
  ops: 1.066,      // 2021
  wins: 15,        // 2021
};

export type ConfidenceLevel = "序盤参考" | "予測中" | "確度高め" | "ほぼ確定";

export interface ProjectionData {
  gamesPlayed: number;
  // 打者現在値
  battingAvg: string;
  ops: string;
  obp: string;
  homeRunsCurrent: number;
  rbiCurrent: number;
  hitsCurrent: number;
  // 打者予測値
  homeRunsProjected: number;
  rbiProjected: number;
  hitsProjected: number;
  // 投手現在値
  era: string;
  whip: string;
  winsCurrent: number;
  kCurrent: number;
  gamesStarted: number;
  // 投手予測値
  winsProjected: number;
  kProjected: number;
  // 信頼度
  confidence: ConfidenceLevel;
  // 投手登板前フラグ
  hasPitchingData: boolean;
}

function getConfidence(gamesPlayed: number): ConfidenceLevel {
  if (gamesPlayed <= 20) return "序盤参考";
  if (gamesPlayed <= 60) return "予測中";
  if (gamesPlayed <= 120) return "確度高め";
  return "ほぼ確定";
}

// 2026-06-09 時点の実績値（MLB Stats API 応答なし時のフォールバック用。更新時は日付を変えること）
const FALLBACK: ProjectionData = {
  gamesPlayed: 64,
  battingAvg: ".302",
  ops: ".939",
  obp: ".417",
  homeRunsCurrent: 11,
  rbiCurrent: 35,
  hitsCurrent: 70,
  homeRunsProjected: 28,
  rbiProjected: 89,
  hitsProjected: 178,
  era: "0.74",
  whip: "0.79",
  winsCurrent: 6,
  kCurrent: 67,
  gamesStarted: 10,
  winsProjected: 17,
  kProjected: 183,
  confidence: "確度高め",
  hasPitchingData: true,
};

interface RawStat {
  gamesPlayed?: number;
  atBats?: number;
  hits?: number;
  homeRuns?: number;
  rbi?: number;
  avg?: string;
  obp?: string;
  ops?: string;
  plateAppearances?: number;
  gamesStarted?: number;
  wins?: number;
  strikeOuts?: number;
  era?: string;
  whip?: string;
  inningsPitched?: string;
}

interface StatGroup {
  group?: { displayName?: string };
  splits?: { stat: RawStat }[];
}

export async function fetchSeasonProjection(): Promise<ProjectionData> {
  try {
    const res = await fetch(
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}?hydrate=stats(group=[hitting,pitching],type=season,season=${new Date().getFullYear()})`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return FALLBACK;

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

    // ゼロ除算ガード
    if (gamesPlayed === 0) return FALLBACK;

    // 打者予測（games_played ベース）
    const homeRunsCurrent = hitting.homeRuns ?? 0;
    const rbiCurrent = hitting.rbi ?? 0;
    const hitsCurrent = hitting.hits ?? 0;
    const homeRunsProjected = Math.round((homeRunsCurrent / gamesPlayed) * SEASON_GAMES);
    const rbiProjected = Math.round((rbiCurrent / gamesPlayed) * SEASON_GAMES);
    const hitsProjected = Math.round((hitsCurrent / gamesPlayed) * SEASON_GAMES);

    // 投手予測
    const gamesStarted = pitching.gamesStarted ?? 0;
    const hasPitchingData = gamesStarted > 0;
    const winsCurrent = pitching.wins ?? 0;
    const kCurrent = pitching.strikeOuts ?? 0;

    let winsProjected = 0;
    let kProjected = 0;
    if (hasPitchingData) {
      winsProjected = Math.round((winsCurrent / gamesStarted) * PROJECTED_STARTS);
      kProjected = Math.round((kCurrent / gamesStarted) * PROJECTED_STARTS);
    }

    return {
      gamesPlayed,
      battingAvg: hitting.avg ?? ".000",
      ops: hitting.ops ?? ".000",
      obp: hitting.obp ?? ".000",
      homeRunsCurrent,
      rbiCurrent,
      hitsCurrent,
      homeRunsProjected,
      rbiProjected,
      hitsProjected,
      era: pitching.era ?? "-.--",
      whip: pitching.whip ?? "-.--",
      winsCurrent,
      kCurrent,
      gamesStarted,
      winsProjected,
      kProjected,
      confidence: getConfidence(gamesPlayed),
      hasPitchingData,
    };
  } catch {
    return FALLBACK;
  }
}
