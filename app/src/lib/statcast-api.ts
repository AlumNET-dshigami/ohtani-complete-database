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

interface SavantPitchRaw {
  pitch_type?: string;
  pitch_name?: string;
  pitch_percent?: number;
  pa?: number;
  ba?: string;
  slg?: string;
  woba?: string;
  avg_speed?: string;
  avg_spin?: string;
  pitch_count?: number;
  total_pitches?: number;
  pitch_type_name?: string;
  pitch_usage_percent?: number;
  avg_velocity?: string;
  batting_avg?: string;
}

export async function getPitchArsenal(season: number): Promise<PitchTypeEntry[]> {
  try {
    const url = `${SAVANT_BASE}/player-services/statcast-pitching-arsenal?playerId=${OHTANI_PLAYER_ID}&position=P&season=${season}&team=`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: SavantPitchRaw[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((d) => (d.pitch_percent ?? d.pitch_usage_percent ?? 0) > 0)
      .map((d) => ({
        pitchType: d.pitch_type ?? "",
        pitchName: d.pitch_name ?? d.pitch_type_name ?? d.pitch_type ?? "",
        percentage: d.pitch_percent ?? d.pitch_usage_percent ?? 0,
        count: d.pitch_count ?? d.pa ?? d.total_pitches ?? 0,
        avgSpeed: d.avg_speed ?? d.avg_velocity ?? "-",
        ba: d.ba ?? d.batting_avg ?? "-",
        slg: d.slg ?? "-",
        woba: d.woba ?? "-",
      }))
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
