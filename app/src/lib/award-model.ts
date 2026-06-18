const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const OHTANI_ID = 660271;

export interface AwardCandidate {
  playerId: number;
  playerName: string;
  teamAbbrv: string;
  score: number;       // 0–100
  rank: number;
  stats: { label: string; value: string }[];
  isOhtani: boolean;
}

export interface AwardRace {
  award: "cy-young" | "hank-aaron" | "mvp";
  label: string;
  season: number;
  candidates: AwardCandidate[];
  modelNote: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseIP(ip: string): number {
  const [whole, frac = "0"] = String(ip).split(".");
  return parseInt(whole, 10) + parseInt(frac, 10) / 3;
}

function normalize(value: number, min: number, max: number, lowerIsBetter: boolean): number {
  if (max === min) return 0.5;
  const n = (value - min) / (max - min);
  return lowerIsBetter ? 1 - n : n;
}

function teamAbbr(fullName: string): string {
  const MAP: Record<string, string> = {
    "Los Angeles Dodgers": "LAD", "Milwaukee Brewers": "MIL",
    "Philadelphia Phillies": "PHI", "San Diego Padres": "SD",
    "Atlanta Braves": "ATL", "New York Mets": "NYM",
    "San Francisco Giants": "SF", "Chicago Cubs": "CHC",
    "Cincinnati Reds": "CIN", "Pittsburgh Pirates": "PIT",
    "St. Louis Cardinals": "STL", "Colorado Rockies": "COL",
    "Arizona Diamondbacks": "ARI", "Miami Marlins": "MIA",
    "Washington Nationals": "WSH",
    "New York Yankees": "NYY", "Boston Red Sox": "BOS",
    "Houston Astros": "HOU", "Seattle Mariners": "SEA",
    "Toronto Blue Jays": "TOR", "Tampa Bay Rays": "TB",
    "Baltimore Orioles": "BAL", "Minnesota Twins": "MIN",
    "Cleveland Guardians": "CLE", "Chicago White Sox": "CWS",
    "Kansas City Royals": "KC", "Detroit Tigers": "DET",
    "Texas Rangers": "TEX", "Oakland Athletics": "OAK",
    "Los Angeles Angels": "LAA", "Athletics": "OAK",
  };
  return MAP[fullName] ?? fullName.slice(0, 3).toUpperCase();
}

interface StatSplit {
  person?: { id?: number; fullName?: string };
  team?: { name?: string };
  stat?: Record<string, string | number>;
}

async function fetchNLStats(group: "pitching" | "hitting", sortStat: string, limit = 25): Promise<StatSplit[]> {
  const url =
    `${MLB_API_BASE}/stats?stats=season&group=${group}&season=${new Date().getFullYear()}` +
    `&leagueId=104&playerPool=qualified&limit=${limit}&sortStat=${sortStat}&hydrate=person,currentTeam`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.stats?.[0]?.splits ?? []) as StatSplit[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cy Young scoring
// ---------------------------------------------------------------------------
const CY_WEIGHTS = { era: 0.30, whip: 0.25, strikeOuts: 0.25, ip: 0.15, wins: 0.05 };

export async function fetchCyYoungRace(): Promise<AwardRace> {
  const splits = await fetchNLStats("pitching", "earnedRunAverage", 20);

  type Row = { playerId: number; name: string; team: string; era: number; whip: number; k: number; ip: number; w: number };
  const rows: Row[] = splits.map((s) => ({
    playerId: s.person?.id ?? 0,
    name: s.person?.fullName ?? "—",
    team: s.team?.name ?? "—",
    era: parseFloat(String(s.stat?.era ?? 99)),
    whip: parseFloat(String(s.stat?.whip ?? 9)),
    k: parseInt(String(s.stat?.strikeOuts ?? 0), 10),
    ip: parseIP(String(s.stat?.inningsPitched ?? "0.0")),
    w: parseInt(String(s.stat?.wins ?? 0), 10),
  })).filter((r) => r.playerId !== 0 && r.ip >= 30);

  const eras = rows.map((r) => r.era), whips = rows.map((r) => r.whip);
  const ks = rows.map((r) => r.k), ips = rows.map((r) => r.ip), ws = rows.map((r) => r.w);
  const [minEra, maxEra] = [Math.min(...eras), Math.max(...eras)];
  const [minWhip, maxWhip] = [Math.min(...whips), Math.max(...whips)];
  const [minK, maxK] = [Math.min(...ks), Math.max(...ks)];
  const [minIP, maxIP] = [Math.min(...ips), Math.max(...ips)];
  const [minW, maxW] = [Math.min(...ws), Math.max(...ws)];

  const scored = rows.map((r) => {
    const s =
      normalize(r.era, minEra, maxEra, true) * CY_WEIGHTS.era +
      normalize(r.whip, minWhip, maxWhip, true) * CY_WEIGHTS.whip +
      normalize(r.k, minK, maxK, false) * CY_WEIGHTS.strikeOuts +
      normalize(r.ip, minIP, maxIP, false) * CY_WEIGHTS.ip +
      normalize(r.w, minW, maxW, false) * CY_WEIGHTS.wins;
    return { ...r, score: Math.round(s * 100 * 10) / 10 };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    award: "cy-young",
    label: "サイ・ヤング賞",
    season: new Date().getFullYear(),
    candidates: scored.map((r, i) => ({
      playerId: r.playerId,
      playerName: r.name,
      teamAbbrv: teamAbbr(r.team),
      score: r.score,
      rank: i + 1,
      isOhtani: r.playerId === OHTANI_ID,
      stats: [
        { label: "ERA", value: r.era.toFixed(2) },
        { label: "WHIP", value: r.whip.toFixed(2) },
        { label: "K", value: String(r.k) },
        { label: "IP", value: r.ip.toFixed(1) },
      ],
    })),
    modelNote: "ERA 30% · WHIP 25% · K 25% · IP 15% · W 5%",
  };
}

// ---------------------------------------------------------------------------
// Hank Aaron Award scoring
// ---------------------------------------------------------------------------
const HA_WEIGHTS = { hr: 0.35, rbi: 0.25, ops: 0.25, avg: 0.15 };

export async function fetchHankAaronRace(): Promise<AwardRace> {
  const splits = await fetchNLStats("hitting", "onBasePlusSlugging", 20);

  type Row = { playerId: number; name: string; team: string; avg: number; hr: number; rbi: number; ops: number; obp: number };
  const rows: Row[] = splits.map((s) => ({
    playerId: s.person?.id ?? 0,
    name: s.person?.fullName ?? "—",
    team: s.team?.name ?? "—",
    avg: parseFloat(String(s.stat?.avg ?? 0)),
    hr: parseInt(String(s.stat?.homeRuns ?? 0), 10),
    rbi: parseInt(String(s.stat?.rbi ?? 0), 10),
    ops: parseFloat(String(s.stat?.ops ?? 0)),
    obp: parseFloat(String(s.stat?.obp ?? 0)),
  })).filter((r) => r.playerId !== 0);

  const hrs = rows.map((r) => r.hr), rbis = rows.map((r) => r.rbi);
  const opss = rows.map((r) => r.ops), avgs = rows.map((r) => r.avg);
  const [minHR, maxHR] = [Math.min(...hrs), Math.max(...hrs)];
  const [minRBI, maxRBI] = [Math.min(...rbis), Math.max(...rbis)];
  const [minOPS, maxOPS] = [Math.min(...opss), Math.max(...opss)];
  const [minAVG, maxAVG] = [Math.min(...avgs), Math.max(...avgs)];

  const scored = rows.map((r) => {
    const s =
      normalize(r.hr, minHR, maxHR, false) * HA_WEIGHTS.hr +
      normalize(r.rbi, minRBI, maxRBI, false) * HA_WEIGHTS.rbi +
      normalize(r.ops, minOPS, maxOPS, false) * HA_WEIGHTS.ops +
      normalize(r.avg, minAVG, maxAVG, false) * HA_WEIGHTS.avg;
    return { ...r, score: Math.round(s * 100 * 10) / 10 };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    award: "hank-aaron",
    label: "ハンク・アーロン賞",
    season: new Date().getFullYear(),
    candidates: scored.map((r, i) => ({
      playerId: r.playerId,
      playerName: r.name,
      teamAbbrv: teamAbbr(r.team),
      score: r.score,
      rank: i + 1,
      isOhtani: r.playerId === OHTANI_ID,
      stats: [
        { label: "AVG", value: r.avg.toFixed(3) },
        { label: "HR", value: String(r.hr) },
        { label: "RBI", value: String(r.rbi) },
        { label: "OPS", value: r.ops.toFixed(3) },
      ],
    })),
    modelNote: "HR 35% · RBI 25% · OPS 25% · AVG 15%",
  };
}

// ---------------------------------------------------------------------------
// MVP scoring (two-way bonus for Ohtani)
// ---------------------------------------------------------------------------
const MVP_BAT_W = { ops: 0.30, hr: 0.25, rbi: 0.20, avg: 0.15, sb: 0.10 };
const MVP_PIT_BONUS_W = 0.35; // pitching component weight for two-way players

export async function fetchMVPRace(): Promise<AwardRace> {
  const [batSplits, pitSplits] = await Promise.all([
    fetchNLStats("hitting", "onBasePlusSlugging", 25),
    fetchNLStats("pitching", "earnedRunAverage", 20),
  ]);

  // Build pitching map for two-way bonus
  const pitMap = new Map<number, { era: number; k: number; ip: number }>();
  for (const s of pitSplits) {
    const id = s.person?.id;
    if (!id) continue;
    pitMap.set(id, {
      era: parseFloat(String(s.stat?.era ?? 99)),
      k: parseInt(String(s.stat?.strikeOuts ?? 0), 10),
      ip: parseIP(String(s.stat?.inningsPitched ?? "0.0")),
    });
  }

  type Row = { playerId: number; name: string; team: string; ops: number; hr: number; rbi: number; avg: number; sb: number; pit?: { era: number; k: number; ip: number } };
  const rows: Row[] = batSplits.map((s) => {
    const id = s.person?.id ?? 0;
    return {
      playerId: id,
      name: s.person?.fullName ?? "—",
      team: s.team?.name ?? "—",
      ops: parseFloat(String(s.stat?.ops ?? 0)),
      hr: parseInt(String(s.stat?.homeRuns ?? 0), 10),
      rbi: parseInt(String(s.stat?.rbi ?? 0), 10),
      avg: parseFloat(String(s.stat?.avg ?? 0)),
      sb: parseInt(String(s.stat?.stolenBases ?? 0), 10),
      pit: pitMap.get(id),
    };
  }).filter((r) => r.playerId !== 0);

  const opss = rows.map((r) => r.ops), hrs = rows.map((r) => r.hr);
  const rbis = rows.map((r) => r.rbi), avgs = rows.map((r) => r.avg), sbs = rows.map((r) => r.sb);
  const [minOPS, maxOPS] = [Math.min(...opss), Math.max(...opss)];
  const [minHR, maxHR] = [Math.min(...hrs), Math.max(...hrs)];
  const [minRBI, maxRBI] = [Math.min(...rbis), Math.max(...rbis)];
  const [minAVG, maxAVG] = [Math.min(...avgs), Math.max(...avgs)];
  const [minSB, maxSB] = [Math.min(...sbs), Math.max(...sbs)];

  // Pitching normalization ranges (from pitSplits)
  const allEras = [...pitMap.values()].map((p) => p.era);
  const allKs = [...pitMap.values()].map((p) => p.k);
  const allIPs = [...pitMap.values()].map((p) => p.ip);
  const [minEra, maxEra] = allEras.length ? [Math.min(...allEras), Math.max(...allEras)] : [1, 5];
  const [minK, maxK] = allKs.length ? [Math.min(...allKs), Math.max(...allKs)] : [0, 150];
  const [minPitIP, maxPitIP] = allIPs.length ? [Math.min(...allIPs), Math.max(...allIPs)] : [0, 100];

  const scored = rows.map((r) => {
    const batScore =
      normalize(r.ops, minOPS, maxOPS, false) * MVP_BAT_W.ops +
      normalize(r.hr, minHR, maxHR, false) * MVP_BAT_W.hr +
      normalize(r.rbi, minRBI, maxRBI, false) * MVP_BAT_W.rbi +
      normalize(r.avg, minAVG, maxAVG, false) * MVP_BAT_W.avg +
      normalize(r.sb, minSB, maxSB, false) * MVP_BAT_W.sb;

    let totalScore = batScore;
    if (r.pit && r.pit.ip >= 20) {
      const pitScore =
        normalize(r.pit.era, minEra, maxEra, true) * 0.5 +
        normalize(r.pit.k, minK, maxK, false) * 0.3 +
        normalize(r.pit.ip, minPitIP, maxPitIP, false) * 0.2;
      totalScore = batScore * (1 - MVP_PIT_BONUS_W) + pitScore * MVP_PIT_BONUS_W;
    }

    return { ...r, score: Math.round(totalScore * 100 * 10) / 10 };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    award: "mvp",
    label: "MVP",
    season: new Date().getFullYear(),
    candidates: scored.map((r, i) => ({
      playerId: r.playerId,
      playerName: r.name,
      teamAbbrv: teamAbbr(r.team),
      score: r.score,
      rank: i + 1,
      isOhtani: r.playerId === OHTANI_ID,
      stats: [
        { label: "AVG", value: r.avg.toFixed(3) },
        { label: "HR", value: String(r.hr) },
        { label: "RBI", value: String(r.rbi) },
        { label: "OPS", value: r.ops.toFixed(3) },
        ...(r.pit ? [{ label: "ERA*", value: r.pit.era.toFixed(2) }] : []),
      ],
    })),
    modelNote: "OPS 30% · HR 25% · RBI 20% · AVG 15% · SB 10%（二刀流は投球成績ボーナス +35%）",
  };
}
