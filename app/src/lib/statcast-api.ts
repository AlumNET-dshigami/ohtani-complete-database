const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const SAVANT_BASE = "https://baseballsavant.mlb.com";
const OHTANI_PLAYER_ID = 660271;

export interface ZoneData {
  zone: string;
  value: string;
  color: string;
  temp: string;
}

export interface HotColdZoneCategory {
  statName: string;
  zones: ZoneData[];
}

export interface StatcastBatting {
  avgExitVelocity: number | null;
  maxExitVelocity: number | null;
  avgLaunchAngle: number | null;
  barrelRate: number | null;
  hardHitRate: number | null;
  sweetSpotRate: number | null;
  xBA: string | null;
  xSLG: string | null;
  xWOBA: string | null;
}

interface ZoneRaw {
  zone?: string;
  value?: string;
  color?: string;
  temp?: string;
}

interface StatRaw {
  name?: string;
  zones?: ZoneRaw[];
}

interface SplitRaw {
  stat?: StatRaw;
}

interface StatsGroupRaw {
  splits?: SplitRaw[];
}

export async function getHotColdZones(
  season: number,
  group: "hitting" | "pitching"
): Promise<HotColdZoneCategory[]> {
  try {
    const url = `${MLB_API_BASE}/people/${OHTANI_PLAYER_ID}/stats?stats=hotColdZones&season=${season}&group=${group}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();

    const statsGroups: StatsGroupRaw[] = data.stats ?? [];
    const results: HotColdZoneCategory[] = [];

    for (const sg of statsGroups) {
      const splits = sg.splits ?? [];
      for (const split of splits) {
        const stat = split.stat;
        if (!stat?.name || !stat?.zones) continue;
        results.push({
          statName: stat.name,
          zones: stat.zones.map((z) => ({
            zone: z.zone ?? "",
            value: z.value ?? "",
            color: z.color ?? "rgba(128,128,128,0.3)",
            temp: z.temp ?? "neutral",
          })),
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Parse a single CSV line, respecting double-quoted fields that may contain commas.
 * Baseball Savant's leaderboard CSV wraps strings (including names like "Ohtani, Shohei") in quotes.
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export async function getStatcastBatting(season: number): Promise<StatcastBatting | null> {
  try {
    const url = `${SAVANT_BASE}/player-services/statcast-stats?playerId=${OHTANI_PLAYER_ID}&position=B&season=${season}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || typeof data !== "object") return null;

    const stats = Array.isArray(data) ? data[0] : data;
    if (!stats) return null;

    return {
      avgExitVelocity: stats.avg_exit_velocity ?? stats.avgExitVelocity ?? null,
      maxExitVelocity: stats.max_exit_velocity ?? stats.maxExitVelocity ?? null,
      avgLaunchAngle: stats.avg_launch_angle ?? stats.avgLaunchAngle ?? null,
      barrelRate: stats.barrel_rate ?? stats.barrelRate ?? null,
      hardHitRate: stats.hard_hit_rate ?? stats.hardHitRate ?? null,
      sweetSpotRate: stats.sweet_spot_rate ?? stats.sweetSpotRate ?? null,
      xBA: stats.xba ?? stats.xBA ?? null,
      xSLG: stats.xslg ?? stats.xSLG ?? null,
      xWOBA: stats.xwoba ?? stats.xWOBA ?? null,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// 機能B: 球種の深掘り（打者/投手 両ロール対応）
// ----------------------------------------------------------------------------
// 打者として: pitch-arsenal-stats?type=batter → 対戦球種別の被打率/wOBA/空振り率/hard_hit
// 投手として: pitch-arsenal-stats?type=pitcher + 複数形 pitch-arsenals?type=avg_speed/avg_spin
//             （複数形エンドポイントで球速・回転数を球種別に取得し「球速 -」問題を解消）
// 全カラムは実データ検証で確定済み（last_name,first_name は1列扱い）。
// ============================================================================

export type PitchRole = "batter" | "pitcher";

export interface PitchArsenalDetail {
  pitchType: string;      // FF, SL, ST...
  pitchName: string;      // 4-Seam Fastball...
  jpName: string;         // フォーシーム...
  usage: number;          // pitch_usage(%)
  pitches: number;        // 投球数
  pa: number;             // 対戦打席
  ba: string;             // 被打率（投手）/ 被打率（打者は対該球種打率）
  slg: string;
  woba: string;
  whiffPercent: number | null;   // 空振り率
  kPercent: number | null;       // 三振率
  hardHitPercent: number | null; // hard_hit率
  estWoba: string;               // xwOBA相当
  avgSpeed: number | null;       // 球速 mph（投手のみ・複数形から）
  avgSpin: number | null;        // 回転数 rpm（投手のみ・複数形から）
}

// 参照: pitch-arsenal-stats CSV のカラム順（実データ検証で確定）
//   last_name+first_name | player_id | team_name_alt | pitch_type | pitch_name |
//   run_value_per_100 | run_value | pitches | pitch_usage | pa | ba | slg | woba |
//   whiff_percent | k_percent | put_away | est_ba | est_slg | est_woba | hard_hit_percent
// 実コードは buildHeaderIndex によるヘッダ名引きで列ズレに強くしている。
function buildHeaderIndex(header: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    idx[h.trim().replace(/^"|"$/g, "")] = i;
  });
  return idx;
}

const stripQ = (v: string | undefined) => (v ?? "").replace(/^"|"$/g, "").trim();
const num = (v: string | undefined): number | null => {
  const n = parseFloat(stripQ(v));
  return Number.isFinite(n) ? n : null;
};

/**
 * 複数形 pitch-arsenals?type=avg_speed|avg_spin を取得し、
 * 球種コード(FF,SL...) → 数値 のマップを返す（投手用・横持ちワイド形式）。
 * 取得失敗時は空マップ（graceful degrade：球速/回転数なしで成立させる）。
 */
async function getPitchVelocityOrSpin(
  season: number,
  type: "avg_speed" | "avg_spin"
): Promise<Record<string, number>> {
  try {
    const url = `${SAVANT_BASE}/leaderboard/pitch-arsenals?year=${season}&min=1&type=${type}&hand=&csv=true`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "ohtani-complete-database/1.0 (+https://github.com/AlumNET-dshigami/ohtani-complete-database)",
        Accept: "text/csv,*/*",
      },
    });
    if (!res.ok) return {};
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length < 2) return {};

    const header = parseCsvLine(lines[0]).map((h) => stripQ(h).toLowerCase());
    const iPitcher = header.indexOf("pitcher");
    if (iPitcher === -1) return {};

    const row = lines
      .slice(1)
      .map(parseCsvLine)
      .find((r) => stripQ(r[iPitcher]) === String(OHTANI_PLAYER_ID));
    if (!row) return {};

    // ヘッダは "ff_avg_speed" のような形式。接尾辞を外して球種コード(大文字)に
    const suffix = type === "avg_speed" ? "_avg_speed" : "_avg_spin";
    const map: Record<string, number> = {};
    header.forEach((h, i) => {
      if (!h.endsWith(suffix)) return;
      const code = h.slice(0, h.length - suffix.length).toUpperCase();
      const v = num(row[i]);
      if (v !== null) map[code] = v;
    });
    return map;
  } catch {
    return {};
  }
}

/**
 * 球種の深掘りデータを取得（打者/投手ロール別）。
 * - batter: 対戦球種別の被打率/wOBA/空振り率/hard_hit
 * - pitcher: 上記 + 複数形エンドポイントの球速/回転数をマージ
 */
export async function getPitchArsenalDetail(
  season: number,
  role: PitchRole
): Promise<PitchArsenalDetail[]> {
  try {
    const url = `${SAVANT_BASE}/leaderboard/pitch-arsenal-stats?type=${role}&year=${season}&min=0&csv=true`;
    const [arsenalRes, speedMap, spinMap] = await Promise.all([
      fetch(url, {
        next: { revalidate: 3600 },
        headers: {
          "User-Agent": "ohtani-complete-database/1.0 (+https://github.com/AlumNET-dshigami/ohtani-complete-database)",
          Accept: "text/csv,*/*",
        },
      }),
      // 球速/回転数は投手ロールのみ取得（打者には球速概念がない）
      role === "pitcher"
        ? getPitchVelocityOrSpin(season, "avg_speed")
        : Promise.resolve<Record<string, number>>({}),
      role === "pitcher"
        ? getPitchVelocityOrSpin(season, "avg_spin")
        : Promise.resolve<Record<string, number>>({}),
    ]);

    if (!arsenalRes.ok) return [];
    const text = await arsenalRes.text();
    if (!text || text.length < 10) return [];

    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const header = parseCsvLine(lines[0]);
    const H = buildHeaderIndex(header);
    const iPid = H["player_id"];
    const iType = H["pitch_type"];
    if (iPid === undefined || iType === undefined) return [];

    const rows = lines.slice(1).map(parseCsvLine);
    const ohtaniRows = rows.filter((r) => stripQ(r[iPid]) === String(OHTANI_PLAYER_ID));

    return ohtaniRows
      .map((r): PitchArsenalDetail => {
        const code = stripQ(r[iType]);
        return {
          pitchType: code,
          pitchName: stripQ(r[H["pitch_name"]]),
          jpName: getJapanesePitchName(code),
          usage: num(r[H["pitch_usage"]]) ?? 0,
          pitches: num(r[H["pitches"]]) ?? 0,
          pa: num(r[H["pa"]]) ?? 0,
          ba: stripQ(r[H["ba"]]) || "-",
          slg: stripQ(r[H["slg"]]) || "-",
          woba: stripQ(r[H["woba"]]) || "-",
          whiffPercent: num(r[H["whiff_percent"]]),
          kPercent: num(r[H["k_percent"]]),
          hardHitPercent: num(r[H["hard_hit_percent"]]),
          estWoba: stripQ(r[H["est_woba"]]) || "-",
          avgSpeed: speedMap[code] ?? null,
          avgSpin: spinMap[code] ?? null,
        };
      })
      .filter((d) => d.usage > 0 || d.pitches > 0)
      .sort((a, b) => b.usage - a.usage);
  } catch {
    return [];
  }
}

const PITCH_TYPE_MAP: Record<string, string> = {
  FF: "フォーシーム",
  SI: "シンカー",
  FC: "カッター",
  SL: "スライダー",
  CU: "カーブ",
  CH: "チェンジアップ",
  FS: "スプリッター",
  KC: "ナックルカーブ",
  ST: "スウィーパー",
  SV: "スウィーパー",
  KN: "ナックル",
  EP: "エフェクタス",
  SC: "スクリュー",
};

export function getJapanesePitchName(code: string): string {
  return PITCH_TYPE_MAP[code] ?? code;
}
