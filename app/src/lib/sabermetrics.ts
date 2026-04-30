import type { BattingStats, PitchingStats, SeasonStats, WARChartEntry } from "./types";
import { OHTANI_WAR_HISTORY, getRealWAR } from "./ohtani-war-data";
import type { WARSnapshot } from "./war-scraper";
import type { WARSource } from "./war-source";

// ---- Batting Advanced Stats ----

export interface AdvancedBattingStats {
  iso: string;       // Isolated Power (SLG - AVG)
  babip: string;     // Batting Average on Balls in Play
  bbRate: string;    // Walk Rate (BB%)
  kRate: string;     // Strikeout Rate (K%)
  bbPerK: string;    // BB/K ratio
  abPerHr: string;   // At-bats per Home Run
  paPerBb: string;   // Plate Appearances per Walk
  rbiBatAvg: string; // RBI per At-Bat
  rc: string;        // Runs Created (basic formula)
  ta: string;        // Total Average
  secAvg: string;    // Secondary Average
}

export function calcAdvancedBatting(s: BattingStats): AdvancedBattingStats {
  const avg = parseFloat(s.avg) || 0;
  const obp = parseFloat(s.obp) || 0;
  const slg = parseFloat(s.slg) || 0;
  const ab = s.atBats || 0;
  const h = s.hits || 0;
  const hr = s.homeRuns || 0;
  const bb = s.baseOnBalls || 0;
  const so = s.strikeOuts || 0;
  const sb = s.stolenBases || 0;
  const doubles = s.doubles || 0;
  const triples = s.triples || 0;

  // PA approximation (AB + BB + HBP assumed 0 + SF assumed 0)
  const pa = ab + bb;

  // ISO: Isolated Power = SLG - AVG
  const iso = slg - avg;

  // BABIP: (H - HR) / (AB - SO - HR + SF) — SF unknown, approximate
  const babipDenom = ab - so - hr;
  const babip = babipDenom > 0 ? (h - hr) / babipDenom : 0;

  // BB%: BB / PA
  const bbRate = pa > 0 ? (bb / pa) * 100 : 0;

  // K%: SO / PA
  const kRate = pa > 0 ? (so / pa) * 100 : 0;

  // BB/K
  const bbPerK = so > 0 ? bb / so : 0;

  // AB/HR
  const abPerHr = hr > 0 ? ab / hr : 0;

  // PA/BB
  const paPerBb = bb > 0 ? pa / bb : 0;

  // RBI batting average approximation
  const rbiBatAvg = ab > 0 ? s.rbi / ab : 0;

  // Runs Created (basic Bill James formula): RC = (H + BB) * TB / (AB + BB)
  const tb = h + doubles + triples * 2 + hr * 3;
  const rc = pa > 0 ? ((h + bb) * tb) / pa : 0;

  // Total Average: (TB + BB + SB) / (AB - H)
  const taDenom = ab - h;
  const ta = taDenom > 0 ? (tb + bb + sb) / taDenom : 0;

  // Secondary Average: (TB - H + BB + SB) / AB
  const secAvg = ab > 0 ? (tb - h + bb + sb) / ab : 0;

  return {
    iso: iso.toFixed(3),
    babip: babip.toFixed(3),
    bbRate: bbRate.toFixed(1) + "%",
    kRate: kRate.toFixed(1) + "%",
    bbPerK: bbPerK.toFixed(2),
    abPerHr: abPerHr > 0 ? abPerHr.toFixed(1) : "-",
    paPerBb: paPerBb > 0 ? paPerBb.toFixed(1) : "-",
    rbiBatAvg: rbiBatAvg.toFixed(3),
    rc: rc.toFixed(1),
    ta: ta.toFixed(3),
    secAvg: secAvg.toFixed(3),
  };
}

// ---- Pitching Advanced Stats ----

export interface AdvancedPitchingStats {
  fip: string;         // Fielding Independent Pitching
  kPer9: string;       // K/9 (already exists, but recalc)
  bbPer9: string;      // BB/9
  hPer9: string;       // H/9
  hrPer9: string;      // HR/9
  kPerBb: string;      // K/BB ratio
  kRate: string;       // K%
  bbRate: string;      // BB%
  lob: string;         // LOB% estimate
  groundOut: string;   // GO/AO estimate from available data
  pitchesPerIp: string; // Pitches per IP (estimated)
  qualityStartRate: string; // QS% estimate
}

export function calcAdvancedPitching(s: PitchingStats): AdvancedPitchingStats {
  const ip = parseFloat(s.inningsPitched) || 0;
  const so = s.strikeOuts || 0;
  const bb = s.baseOnBalls || 0;
  const hr = s.homeRuns || 0;
  const h = s.hits || 0;
  const er = s.earnedRuns || 0;
  const r = s.runs || 0;

  // Batters faced approximation: IP * 3 + H + BB
  const bf = Math.round(ip * 3) + h + bb;

  // FIP: ((13*HR + 3*BB - 2*K) / IP) + constant (3.10 is league avg FIP constant)
  const FIP_CONSTANT = 3.10;
  const fip = ip > 0 ? ((13 * hr + 3 * bb - 2 * so) / ip) + FIP_CONSTANT : 0;

  // Per 9 stats
  const kPer9 = ip > 0 ? (so / ip) * 9 : 0;
  const bbPer9 = ip > 0 ? (bb / ip) * 9 : 0;
  const hPer9 = ip > 0 ? (h / ip) * 9 : 0;
  const hrPer9 = ip > 0 ? (hr / ip) * 9 : 0;

  // K/BB
  const kPerBb = bb > 0 ? so / bb : 0;

  // K%
  const kRate = bf > 0 ? (so / bf) * 100 : 0;

  // BB%
  const bbRate = bf > 0 ? (bb / bf) * 100 : 0;

  // LOB% estimate: 1 - (R - HR) / (H + BB - HR)
  const lobDenom = h + bb - hr;
  const lob = lobDenom > 0 ? (1 - (r - hr) / lobDenom) * 100 : 0;

  return {
    fip: fip > 0 ? fip.toFixed(2) : "-",
    kPer9: kPer9.toFixed(2),
    bbPer9: bbPer9.toFixed(2),
    hPer9: hPer9.toFixed(2),
    hrPer9: hrPer9.toFixed(2),
    kPerBb: kPerBb > 0 ? kPerBb.toFixed(2) : "-",
    kRate: kRate.toFixed(1) + "%",
    bbRate: bbRate.toFixed(1) + "%",
    lob: lob > 0 ? lob.toFixed(1) + "%" : "-",
    groundOut: "-",
    pitchesPerIp: "-",
    qualityStartRate: "-",
  };
}

// ---- WAR Estimation ----

export interface WAREstimate {
  battingWAR: number;
  pitchingWAR: number;
  totalWAR: number;
}

// League average constants (approximate MLB averages)
const LG_OPS = 0.710;
const LG_ERA = 4.20;
const RUNS_PER_WIN = 10;

/**
 * Estimate batting WAR from available stats.
 * Formula: ((OPS - lgOPS) / lgOPS) * PA * 0.8 / RPW + replacement
 * Replacement level ≈ 2.0 * (PA / 600)
 */
function estimateBattingWAR(s: BattingStats): number {
  const ops = parseFloat(s.ops) || 0;
  const ab = s.atBats || 0;
  const bb = s.baseOnBalls || 0;
  const pa = ab + bb;

  if (pa === 0) return 0;

  const runsAboveAvg = ((ops - LG_OPS) / LG_OPS) * pa * 0.8;
  const replacement = 2.0 * (pa / 600);
  return (runsAboveAvg + replacement) / RUNS_PER_WIN;
}

/**
 * Estimate pitching WAR from available stats.
 * Formula: ((lgERA - ERA) * IP / 9 + replacement) / RPW
 * Replacement level ≈ 0.3 * (IP / 200)
 */
function estimatePitchingWAR(s: PitchingStats): number {
  const era = parseFloat(s.era) || 0;
  const ip = parseFloat(s.inningsPitched) || 0;

  if (ip === 0) return 0;

  const runsAboveAvg = ((LG_ERA - era) * ip) / 9;
  const replacement = 0.3 * (ip / 200);
  return (runsAboveAvg + replacement) / RUNS_PER_WIN;
}

export function estimateSeasonWAR(batting: BattingStats | null, pitching: PitchingStats | null): WAREstimate {
  const bWAR = batting ? Math.max(estimateBattingWAR(batting), -1) : 0;
  const pWAR = pitching ? Math.max(estimatePitchingWAR(pitching), -1) : 0;

  return {
    battingWAR: Math.round(bWAR * 10) / 10,
    pitchingWAR: Math.round(pWAR * 10) / 10,
    totalWAR: Math.round((bWAR + pWAR) * 10) / 10,
  };
}

export interface CareerWAREntry {
  season: string;
  battingWAR: number;
  pitchingWAR: number;
  totalWAR: number;
}

export function calcCareerWAR(allStats: SeasonStats[]): CareerWAREntry[] {
  return allStats.map((s) => {
    const war = estimateSeasonWAR(s.batting, s.pitching);
    return {
      season: s.season,
      ...war,
    };
  });
}

// ---- Combined WAR (real history + current-season estimate) ----

export function buildCareerWARChartData(
  allStats: SeasonStats[],
  currentSnapshot?: WARSnapshot | null,
  currentSource?: WARSource
): WARChartEntry[] {
  const seasons = new Set<string>([
    ...OHTANI_WAR_HISTORY.map((e) => e.season),
    ...allStats.map((s) => s.season),
  ]);
  const sorted = Array.from(seasons).sort();

  return sorted.map((season) => {
    const real = getRealWAR(season);
    const seasonStat = allStats.find((s) => s.season === season);
    const currentYear = String(new Date().getFullYear());
    const isCurrent = season === currentYear;

    // Use real values if available; scraped snapshot for current in-progress season; legacy estimate as last resort.
    if (real) {
      return {
        season,
        bWAR: real.bWAR,
        fWAR: real.fWAR,
        estimate: null,
        league: real.league,
      };
    }

    if (isCurrent && currentSnapshot) {
      // Confirmed value only when the snapshot came from a live scrape.
      // Manual JSON fallbacks are drawn as the dashed "estimate" line so
      // viewers can tell at a glance that the live source is unavailable
      // (the chart's solid bWAR/fWAR lines are reserved for confirmed values).
      const isLive = currentSource === "live";
      if (isLive) {
        return {
          season,
          bWAR: currentSnapshot.total.rWAR,
          fWAR: currentSnapshot.total.fWAR,
          estimate: null,
          league: "MLB",
        };
      }
      return {
        season,
        bWAR: null,
        fWAR: null,
        estimate: currentSnapshot.total.fWAR,
        league: "MLB",
      };
    }

    if (isCurrent && seasonStat) {
      const est = estimateSeasonWAR(seasonStat.batting, seasonStat.pitching);
      return {
        season,
        bWAR: null,
        fWAR: null,
        estimate: est.totalWAR,
        league: "MLB",
      };
    }

    return {
      season,
      bWAR: null,
      fWAR: null,
      estimate: null,
      league: "MLB",
    };
  });
}

export interface CurrentWARDisplay {
  bWAR: string;
  fWAR: string;
  battingWAR: string;
  pitchingWAR: string;
  totalWAR: string;
  source: "history" | "scraped" | "calculated";
  scrapedSource?: WARSource;
  sourceUpdatedAt?: string | null;
  note: string;
}

// WAR display is normalised to 1 decimal place across all callers to match
// FanGraphs / Baseball Reference public formatting (e.g. "2.2", not "2.20").
function fmt(n: number | null): string {
  return n !== null ? n.toFixed(1) : "-";
}

export function buildScrapedWARDisplay(
  snapshot: WARSnapshot,
  scrapedSource: WARSource
): CurrentWARDisplay {
  const sourceLabel =
    scrapedSource === "live"
      ? "出典: nobita-retire.com（fWAR=FanGraphs / rWAR=Baseball Reference）"
      : "出典: nobita-retire.com（手動更新値）";

  return {
    bWAR: fmt(snapshot.total.rWAR),
    fWAR: fmt(snapshot.total.fWAR),
    battingWAR: fmt(snapshot.batting.fWAR),
    pitchingWAR: fmt(snapshot.pitching.fWAR),
    totalWAR: fmt(snapshot.total.fWAR),
    source: "scraped",
    scrapedSource,
    sourceUpdatedAt: snapshot.sourceUpdatedAt,
    note: sourceLabel,
  };
}

export function getCurrentWARDisplay(
  season: string,
  batting: BattingStats | null,
  pitching: PitchingStats | null
): CurrentWARDisplay {
  const real = getRealWAR(season);
  if (real) {
    return {
      bWAR: real.bWAR !== null ? real.bWAR.toFixed(1) : "-",
      fWAR: real.fWAR !== null ? real.fWAR.toFixed(1) : "-",
      battingWAR: "-",
      pitchingWAR: "-",
      totalWAR: real.fWAR !== null ? real.fWAR.toFixed(1) : "-",
      source: "history",
      note: real.note ?? "",
    };
  }
  const est = estimateSeasonWAR(batting, pitching);
  return {
    bWAR: "-",
    fWAR: "-",
    battingWAR: est.battingWAR.toFixed(1),
    pitchingWAR: est.pitchingWAR.toFixed(1),
    totalWAR: est.totalWAR.toFixed(1),
    source: "calculated",
    note: "シーズン進行中（現在の成績から算出）",
  };
}
