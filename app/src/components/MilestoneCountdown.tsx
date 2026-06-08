"use client";

import type { MilestoneStatus } from "@/lib/milestones";

interface Props {
  statuses: MilestoneStatus[];
  currentYear: number;
}

export default function MilestoneCountdown({ statuses, currentYear }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statuses.map((s) => (
        <MilestoneCard key={`${s.def.category}-${s.def.stat}`} status={s} currentYear={currentYear} />
      ))}
    </div>
  );
}

function MilestoneCard({
  status,
  currentYear,
}: {
  status: MilestoneStatus;
  currentYear: number;
}) {
  const { def, current, remaining, achieved, projectedYear, pacePerGame } = status;
  const progress = Math.min(100, (current / def.milestone) * 100);

  if (achieved) {
    return (
      <div className="rounded-2xl border border-border bg-gray-100 p-5 opacity-60 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-500 dark:text-gray-400">
          <span>{def.emoji}</span>
          <span>{def.label} {def.milestone}達成</span>
        </div>
        <p className="mt-2 text-3xl font-black text-gray-400 dark:text-gray-500">
          達成済み ✓
        </p>
        <p className="mt-1 text-sm text-gray-400">
          通算 {current.toLocaleString()}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-2 rounded-full bg-gray-400" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  const isPitching = def.category === "pitching";
  const cardBase = isPitching
    ? "from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800/40"
    : "from-blue-50 to-indigo-100 border-blue-200 dark:from-blue-950/30 dark:to-indigo-900/20 dark:border-blue-800/40";
  const barColor = isPitching ? "bg-red-500" : "bg-dodger-blue";
  const badgeColor = isPitching
    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${cardBase}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{def.emoji}</span>
          <span className="font-bold text-gray-800 dark:text-gray-100">
            {def.label}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
        >
          {isPitching ? "投手" : "打者"}
        </span>
      </div>

      {/* Target */}
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        目標: {def.milestone.toLocaleString()}
      </p>

      {/* Countdown */}
      <div className="mt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">あと</p>
        <p className="text-5xl font-black leading-none text-gray-900 dark:text-white">
          {remaining.toLocaleString()}
        </p>
        <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-gray-300">
          {def.label}
        </p>
      </div>

      {/* Current */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        現在: {current.toLocaleString()} / {def.milestone.toLocaleString()}
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
        <div
          className={`h-2.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-gray-400">
        {progress.toFixed(1)}%
      </p>

      {/* Pace projection */}
      <div className="mt-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
        {projectedYear && pacePerGame !== null ? (
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              現ペース到達見込み
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectedYear === currentYear
                ? `${currentYear}年中`
                : `${projectedYear}年`}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              {currentYear}シーズンペース:{" "}
              {isPitching
                ? `${(pacePerGame * 32).toFixed(0)}奪三振/年`
                : def.stat === "wins"
                ? `${(pacePerGame * 32).toFixed(0)}勝/年`
                : `${(pacePerGame * 162).toFixed(0)}/年`}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ペースデータなし（シーズン開始前）
          </p>
        )}
      </div>
    </div>
  );
}
