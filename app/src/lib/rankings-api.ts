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

// ============================================================================
// 機能A: タイトル争いダッシュボード
// ----------------------------------------------------------------------------
// MLB Stats API stats/leaders を leagueId 指定で叩き、大谷の値と「首位 or 2位」
// の値・差分を返す。大谷の所属リーグ（NL=104）に合わせるのが既定。
//   - 検証で確認: leagueId を付けても rank がグローバル順位のまま返る場合がある
//     ため、leaders 配列の並び順から順位を再計算して堅牢化する。
// ============================================================================

export type LeagueScope = "NL" | "AL" | "MLB";

export const LEAGUE_ID: Record<LeagueScope, number | null> = {
  NL: 104,
  AL: 103,
  MLB: null,
};

/** タイトル争いで扱う各カテゴリの定義 */
interface TitleCatConfig {
  /** 公式 stats/leaders の leaderCategory キー */
  apiKey: string;
  group: "hitting" | "pitching";
  label: string;
  /** 値が小さいほど良い指標（ERA） */
  lowerIsBetter: boolean;
  /** 差分の整形（本数=整数, 打率/ERA=小数） */
  unit: "count" | "avg" | "era";
}

// 指示スコープ: homeRuns / RBI(打点) / battingAverage(打率) / ERA(防御率) / strikeOuts(奪三振)
// 公式 stats/leaders の正式キーへマッピング（RBI=runsBattedIn, ERA=earnedRunAverage, K=strikeouts）
export const TITLE_CATEGORIES: TitleCatConfig[] = [
  { apiKey: "homeRuns", group: "hitting", label: "本塁打王", lowerIsBetter: false, unit: "count" },
  { apiKey: "runsBattedIn", group: "hitting", label: "打点王", lowerIsBetter: false, unit: "count" },
  { apiKey: "battingAverage", group: "hitting", label: "首位打者", lowerIsBetter: false, unit: "avg" },
  { apiKey: "earnedRunAverage", group: "pitching", label: "最優秀防御率", lowerIsBetter: true, unit: "era" },
  { apiKey: "strikeouts", group: "pitching", label: "奪三振王", lowerIsBetter: false, unit: "count" },
];

export interface TitleRace {
  apiKey: string;
  label: string;
  lowerIsBetter: boolean;
  unit: "count" | "avg" | "era";
  /** リーグスコープ */
  scope: LeagueScope;
  /** 大谷の数値（ランク外/未集計なら null） */
  ohtaniValue: number | null;
  /** 大谷のリーグ内順位（並び順から再計算、ランク外なら null） */
  ohtaniRank: number | null;
  /** 首位の数値・選手名 */
  leaderValue: number | null;
  leaderName: string | null;
  /** 2位の数値・選手名（大谷が首位のとき「2位との差」を出すため） */
  secondValue: number | null;
  secondName: string | null;
  /** 大谷が首位か */
  ohtaniIsLeader: boolean;
  /** TOP表示用（最大8件、大谷強調） */
  top: LeaderEntry[];
  totalRanked: number;
}

function toNum(v: string | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * 指定スコープ・季・カテゴリ群のタイトル争いを取得。
 */
export async function getTitleRaces(
  season: number,
  scope: LeagueScope
): Promise<TitleRace[]> {
  const leagueId = LEAGUE_ID[scope];
  const leaguePart = leagueId !== null ? `&leagueId=${leagueId}` : "";

  // hitting / pitching でまとめて叩く
  const groups: ("hitting" | "pitching")[] = ["hitting", "pitching"];
  const byKey = new Map<string, LeaderCategoryRaw>();

  await Promise.all(
    groups.map(async (group) => {
      const cats = TITLE_CATEGORIES.filter((c) => c.group === group).map((c) => c.apiKey);
      if (cats.length === 0) return;
      const url =
        `${MLB_API_BASE}/stats/leaders?leaderCategories=${cats.join(",")}` +
        `&season=${season}&sportId=1&statGroup=${group}${leaguePart}&limit=300`;
      try {
        const res = await fetch(url, { next: { revalidate: 600 } });
        if (!res.ok) return;
        const data = await res.json();
        for (const raw of (data.leagueLeaders ?? []) as LeaderCategoryRaw[]) {
          if (raw.leaderCategory) byKey.set(raw.leaderCategory, raw);
        }
      } catch {
        /* skip — graceful degrade（このカテゴリは空で返る） */
      }
    })
  );

  return TITLE_CATEGORIES.map((cfg) => {
    const raw = byKey.get(cfg.apiKey);
    const allLeaders = raw?.leaders ?? [];

    // value で並べ替えて順位を再計算（API rank がグローバルのまま返る対策）
    const sorted = [...allLeaders].sort((a, b) => {
      const av = toNum(a.value) ?? 0;
      const bv = toNum(b.value) ?? 0;
      return cfg.lowerIsBetter ? av - bv : bv - av;
    });

    const top: LeaderEntry[] = sorted.slice(0, 8).map((l, i) => ({
      rank: i + 1,
      playerName: l.person?.fullName ?? "N/A",
      teamName: l.team?.name ?? "N/A",
      value: l.value ?? "-",
      playerId: l.person?.id ?? 0,
      isOhtani: l.person?.id === OHTANI_PLAYER_ID,
    }));

    const ohtaniIdx = sorted.findIndex((l) => l.person?.id === OHTANI_PLAYER_ID);
    const ohtaniRank = ohtaniIdx >= 0 ? ohtaniIdx + 1 : null;
    const ohtaniValue = ohtaniIdx >= 0 ? toNum(sorted[ohtaniIdx].value) : null;

    const leaderValue = sorted[0] ? toNum(sorted[0].value) : null;
    const leaderName = sorted[0]?.person?.fullName ?? null;
    const secondValue = sorted[1] ? toNum(sorted[1].value) : null;
    const secondName = sorted[1]?.person?.fullName ?? null;

    const ohtaniIsLeader = ohtaniRank === 1;

    return {
      apiKey: cfg.apiKey,
      label: cfg.label,
      lowerIsBetter: cfg.lowerIsBetter,
      unit: cfg.unit,
      scope,
      ohtaniValue,
      ohtaniRank,
      leaderValue,
      leaderName,
      secondValue,
      secondName,
      ohtaniIsLeader,
      top,
      totalRanked: allLeaders.length,
    };
  });
}

/** 値の整形（unit別） */
export function formatTitleValue(
  n: number | null,
  unit: "count" | "avg" | "era"
): string {
  if (n === null) return "-";
  if (unit === "avg") return n.toFixed(3).replace(/^0/, ""); // .300
  if (unit === "era") return n.toFixed(2);
  return String(Math.round(n));
}

// ============================================================================
// 日次スナップショット型（public/data/title-snapshots.json）
// ============================================================================

export interface SnapshotEntry {
  rank: number | null;
  value: number | null;
}

export interface DailySnapshot {
  date: string;
  homeRuns: SnapshotEntry;
  runsBattedIn: SnapshotEntry;
  battingAverage: SnapshotEntry;
  earnedRunAverage: SnapshotEntry;
  strikeouts: SnapshotEntry;
}

export interface TitleSnapshots {
  snapshots: DailySnapshot[];
}

/** スナップショットから特定カテゴリのスパークライン用データを抽出 */
export function extractSparklineData(
  snapshots: DailySnapshot[],
  category: keyof Omit<DailySnapshot, "date">
): Array<{ date: string; rank: number | null }> {
  return snapshots.map((s) => ({
    date: s.date,
    rank: s[category]?.rank ?? null,
  }));
}
