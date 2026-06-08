/**
 * two-way-games.ts
 * MLB Stats API のゲームログを突合して「二刀流試合」と「純打者試合」を分類する。
 *
 * 二刀流試合: 同じ date に打者ゲームログ AND 投手ゲームログの両方が存在する試合
 * 純打者試合: 打者ゲームログのみ存在する試合
 */

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_PLAYER_ID = 660271;
const USER_AGENT =
  "OhtaniDB/1.0 (educational; github.com/AlumNET-dshigami)";

export interface TwoWayStats {
  twoWayGames: number;
  pureHitterGames: number;
  twoWayAvg: string;
  pureHitterAvg: string;
  twoWayOps: string;
  pureHitterOps: string;
  twoWayHR: number;
  pureHitterHR: number;
  twoWayRBI: number;
  pureHitterRBI: number;
}

export interface GameLogEntry {
  date: string; // "2026-04-05" 形式
  avg: string;
  ops: string;
  hits: number;
  atBats: number;
  homeRuns: number;
  rbi: number;
  baseOnBalls: number;
  strikeOuts: number;
}

export type FilterMode = "all" | "twoWay" | "pureHitter";

async function fetchGameLog(
  group: "hitting" | "pitching",
  season: number
): Promise<Set<string>> {
  try {
    const url =
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats` +
      `?stats=gameLog&group=${group}&season=${season}&gameType=R&leagueId=104`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Set();

    const data = (await res.json()) as {
      stats: Array<{
        splits: Array<{ date: string }>;
      }>;
    };

    const splits = data.stats?.[0]?.splits ?? [];
    // NOTE: ダブルヘッダー（同日2試合）は Set の性質上1エントリに集約される。
    // 厳密な突合が必要な場合は gamePk ベースの突合に変更すること。
    return new Set(splits.map((s) => s.date));
  } catch {
    return new Set();
  }
}

async function fetchHittingGameLogDetail(
  season: number
): Promise<GameLogEntry[]> {
  try {
    const url =
      `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats` +
      `?stats=gameLog&group=hitting&season=${season}&gameType=R&leagueId=104`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      stats: Array<{
        splits: Array<{
          date: string;
          stat: Record<string, unknown>;
        }>;
      }>;
    };

    const splits = data.stats?.[0]?.splits ?? [];
    return splits.map((s) => ({
      date: s.date,
      avg: (s.stat.avg as string) ?? ".000",
      ops: (s.stat.ops as string) ?? ".000",
      hits: Number(s.stat.hits ?? 0),
      atBats: Number(s.stat.atBats ?? 0),
      homeRuns: Number(s.stat.homeRuns ?? 0),
      rbi: Number(s.stat.rbi ?? 0),
      baseOnBalls: Number(s.stat.baseOnBalls ?? 0),
      strikeOuts: Number(s.stat.strikeOuts ?? 0),
    }));
  } catch {
    return [];
  }
}

/** 打率を計算（ヒット数 / 打数） */
function calcAvg(hits: number, atBats: number): string {
  if (atBats === 0) return ".000";
  return (hits / atBats).toFixed(3).replace(/^0/, "");
}

/** OPS を計算（OBP + SLG — 簡易版: (H+BB)/(AB+BB) + 長打数/AB） */
function calcOps(entries: GameLogEntry[]): string {
  // ゲームログには塁打数が直接ないため、打率ベースで簡易計算
  // OPS = OBP + SLG で正確計算が難しい場合は、
  // 各試合の avg から直接加重平均を出す（近似値）
  const totalAB = entries.reduce((s, e) => s + e.atBats, 0);
  const totalH = entries.reduce((s, e) => s + e.hits, 0);
  const totalBB = entries.reduce((s, e) => s + e.baseOnBalls, 0);
  const totalHR = entries.reduce((s, e) => s + e.homeRuns, 0);

  if (totalAB === 0) return ".000";

  // OBP = (H + BB) / (AB + BB)
  const obp = (totalH + totalBB) / (totalAB + totalBB);

  // SLG: 塁打数がないので HR×4 + 安打 で近似
  // （2塁打・3塁打が不明なため、近似値として明示）
  const estTB = totalHR * 4 + (totalH - totalHR);
  const slg = estTB / totalAB;

  return (obp + slg).toFixed(3).replace(/^0/, "");
}

export async function getTwoWayStats(season: number): Promise<TwoWayStats> {
  const [hittingDates, pitchingDates, hittingLog] = await Promise.all([
    fetchGameLog("hitting", season),
    fetchGameLog("pitching", season),
    fetchHittingGameLogDetail(season),
  ]);

  // 突合: 両方にある日付 = 二刀流試合
  const twoWayDates = new Set(
    [...hittingDates].filter((d) => pitchingDates.has(d))
  );

  const twoWayEntries = hittingLog.filter((e) => twoWayDates.has(e.date));
  const pureHitterEntries = hittingLog.filter(
    (e) => hittingDates.has(e.date) && !pitchingDates.has(e.date)
  );

  const twH = twoWayEntries.reduce((s, e) => s + e.hits, 0);
  const twAB = twoWayEntries.reduce((s, e) => s + e.atBats, 0);
  const phH = pureHitterEntries.reduce((s, e) => s + e.hits, 0);
  const phAB = pureHitterEntries.reduce((s, e) => s + e.atBats, 0);

  return {
    twoWayGames: twoWayEntries.length,
    pureHitterGames: pureHitterEntries.length,
    twoWayAvg: calcAvg(twH, twAB),
    pureHitterAvg: calcAvg(phH, phAB),
    twoWayOps: calcOps(twoWayEntries),
    pureHitterOps: calcOps(pureHitterEntries),
    twoWayHR: twoWayEntries.reduce((s, e) => s + e.homeRuns, 0),
    pureHitterHR: pureHitterEntries.reduce((s, e) => s + e.homeRuns, 0),
    twoWayRBI: twoWayEntries.reduce((s, e) => s + e.rbi, 0),
    pureHitterRBI: pureHitterEntries.reduce((s, e) => s + e.rbi, 0),
  };
}

export async function getFilteredBattingLog(
  season: number
): Promise<{ entries: GameLogEntry[]; twoWayDates: Set<string>; pitchingDates: Set<string> }> {
  const [hittingLog, pitchingDates] = await Promise.all([
    fetchHittingGameLogDetail(season),
    fetchGameLog("pitching", season),
  ]);

  const twoWayDates = new Set(
    hittingLog
      .filter((e) => pitchingDates.has(e.date))
      .map((e) => e.date)
  );

  return { entries: hittingLog, twoWayDates, pitchingDates };
}
