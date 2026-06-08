"use client";

interface HitterStats {
  obp: string;
  avg: string;
  ops: string;
  homeRuns: number;
  rbi: number;
}

interface PitcherStats {
  era: string;
  strikeOuts: number;
  whip: string;
  wins: number;
}

interface Props {
  hitting: HitterStats;
  pitching: PitcherStats;
}

// NL 2026 league averages (hardcoded per spec)
const LEAGUE_AVG = {
  obp: 0.315,
  era: 4.15,
};

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

/** OBP差をゲージ幅（%）に変換。最大0.15差で100% */
function obpGaugeWidth(obp: number): number {
  const diff = obp - LEAGUE_AVG.obp;
  return clamp((diff / 0.15) * 100, 0, 100);
}

/** ERA差をゲージ幅（%）に変換。ERAは低いほど良いので反転。最大4.0差で100% */
function eraGaugeWidth(era: number): number {
  const diff = LEAGUE_AVG.era - era;
  return clamp((diff / 4.0) * 100, 0, 100);
}

export default function TwoWayGauge({ hitting, pitching }: Props) {
  const obp = parseFloat(hitting.obp) || 0;
  const era = parseFloat(pitching.era);
  const obpWidth = obpGaugeWidth(obp);
  // ERA=0 または登板なし（strikeOuts=0）の場合はゲージを表示しない
  const eraWidth =
    isNaN(era) || era === 0 || pitching.strikeOuts === 0 || String(pitching.strikeOuts) === "0"
      ? 0
      : eraGaugeWidth(era);

  const obpDiff = (obp - LEAGUE_AVG.obp).toFixed(3);
  const eraDiff = (LEAGUE_AVG.era - era).toFixed(2);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Title */}
      <div className="mb-4 text-center">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          二刀流パワー比較
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          NLリーグ平均との差
        </p>
      </div>

      {/* Gauge layout */}
      <div className="flex items-stretch gap-4">
        {/* Left: Batting */}
        <div className="flex flex-1 flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              打者大谷
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {hitting.obp}
            </p>
            <p className="text-[10px] text-gray-400">OBP</p>
          </div>

          {/* Gauge bar (right-aligned) */}
          <div className="flex w-full items-center gap-2">
            <div className="text-[9px] text-gray-400 whitespace-nowrap">
              avg {LEAGUE_AVG.obp.toFixed(3)}
            </div>
            <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="absolute right-0 h-3 rounded-full bg-dodger-blue transition-all"
                style={{ width: `${obpWidth}%` }}
              />
            </div>
          </div>

          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {Number(obpDiff) >= 0 ? "+" : ""}{obpDiff} vs リーグ
          </p>

          {/* Sub stats */}
          <div className="mt-1 w-full rounded-xl bg-blue-50 p-2 text-right dark:bg-blue-950/20">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              打率 {hitting.avg} / OPS {hitting.ops}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              HR {hitting.homeRuns} / RBI {hitting.rbi}
            </p>
          </div>
        </div>

        {/* Center divider */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
          <div className="rounded-xl bg-gradient-to-br from-dodger-blue to-red-500 px-2 py-1.5 text-center shadow-md">
            <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
              Two-Way
            </p>
            <p className="text-base font-black text-white leading-tight">
              二刀流
            </p>
          </div>
          <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        </div>

        {/* Right: Pitching */}
        <div className="flex flex-1 flex-col items-start gap-2">
          <div className="text-left">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              投手大谷
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {pitching.era}
            </p>
            <p className="text-[10px] text-gray-400">ERA</p>
          </div>

          {/* Gauge bar (left-aligned) */}
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="absolute left-0 h-3 rounded-full bg-red-500 transition-all"
                style={{ width: `${eraWidth}%` }}
              />
            </div>
            <div className="text-[9px] text-gray-400 whitespace-nowrap">
              avg {LEAGUE_AVG.era.toFixed(2)}
            </div>
          </div>

          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            -{eraDiff} vs リーグ
          </p>

          {/* Sub stats */}
          <div className="mt-1 w-full rounded-xl bg-red-50 p-2 text-left dark:bg-red-950/20">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              WHIP {pitching.whip} / K {pitching.strikeOuts}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {pitching.wins}勝
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
