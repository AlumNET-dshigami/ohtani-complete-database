import type { BattingStats, PitchingStats } from "./types";

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
