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

export interface PitchTypeEntry {
  pitchType: string;
  pitchName: string;
  percentage: number;
  count: number;
  avgSpeed: string;
  ba: string;
  slg: string;
  woba: string;
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

/**
 * Fetch Shohei Ohtani's pitch arsenal for the given season from the public
 * Baseball Savant leaderboard CSV export.
 *
 * Endpoint: /leaderboard/pitch-arsenal-stats?type=pitcher&year=YYYY&min=0&csv=true
 *
 * The legacy `/player-services/statcast-pitching-arsenal` endpoint that this
 * function previously hit returns 404 — it no longer exists (or never did in
 * its assumed form). The leaderboard CSV is what the public Savant pages
 * actually consume, so we fetch and filter to player_id 660271.
 *
 * Caveats:
 * - Early-season pitches with very low counts may be filtered out by Savant's
 *   internal threshold even with min=0, so list may be partial in March/April.
 * - The CSV does not include average velocity, so `avgSpeed` is "-".
 */
export async function getPitchArsenal(season: number): Promise<PitchTypeEntry[]> {
  try {
    const url = `${SAVANT_BASE}/leaderboard/pitch-arsenal-stats?type=pitcher&year=${season}&min=0&csv=true`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        // Identify ourselves to be a good API citizen.
        "User-Agent": "ohtani-complete-database/1.0 (+https://github.com/AlumNET-dshigami/ohtani-complete-database)",
        Accept: "text/csv,*/*",
      },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.length < 10) return [];

    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const header = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
    const idx = (name: string) => header.indexOf(name);

    const iPlayerId = idx("player_id");
    const iPitchType = idx("pitch_type");
    const iPitchName = idx("pitch_name");
    const iUsage = idx("pitch_usage");
    const iPitches = idx("pitches");
    const iPa = idx("pa");
    const iBa = idx("ba");
    const iSlg = idx("slg");
    const iWoba = idx("woba");

    if (iPlayerId === -1 || iPitchType === -1 || iUsage === -1) return [];

    const rows = lines.slice(1).map(parseCsvLine);
    const ohtaniRows = rows.filter((r) => r[iPlayerId]?.replace(/"/g, "") === String(OHTANI_PLAYER_ID));

    const stripQuotes = (v: string | undefined) => (v ?? "").replace(/^"|"$/g, "");
    const toNum = (v: string | undefined): number => {
      const n = parseFloat(stripQuotes(v));
      return Number.isFinite(n) ? n : 0;
    };

    return ohtaniRows
      .map((r) => ({
        pitchType: stripQuotes(r[iPitchType]),
        pitchName: stripQuotes(r[iPitchName]),
        percentage: toNum(r[iUsage]),
        count: toNum(iPitches !== -1 ? r[iPitches] : r[iPa]),
        avgSpeed: "-",
        ba: stripQuotes(r[iBa]) || "-",
        slg: stripQuotes(r[iSlg]) || "-",
        woba: stripQuotes(r[iWoba]) || "-",
      }))
      .filter((d) => d.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
  } catch {
    return [];
  }
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
