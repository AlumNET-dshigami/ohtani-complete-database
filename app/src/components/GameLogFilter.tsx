"use client";

import { useRouter, useSearchParams } from "next/navigation";

const GAME_TYPES = [
  { value: "R", label: "レギュラー" },
  { value: "S", label: "オープン戦" },
  { value: "POST", label: "ポストシーズン" },
  { value: "WBC", label: "WBC" },
  { value: "A", label: "オールスター" },
  { value: "E", label: "エキシビション" },
];

const VIEW_MODES = [
  { value: "game", label: "試合別" },
  { value: "weekly", label: "週間" },
  { value: "monthly", label: "月間" },
];

export default function GameLogFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSeason = searchParams.get("season") ?? String(new Date().getFullYear());
  const currentType = searchParams.get("type") ?? "R";
  const currentView = searchParams.get("view") ?? "game";

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: currentYear - 2012 }, (_, i) => currentYear - i);

  function updateParams(season: string, type: string, view: string) {
    router.push(`/gamelog?season=${season}&type=${type}&view=${view}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentSeason}
          onChange={(e) => updateParams(e.target.value, currentType, currentView)}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-dodger-blue focus:outline-none focus:ring-2 focus:ring-dodger-blue/20 dark:text-white"
        >
          {seasons.map((year) => (
            <option key={year} value={year}>
              {year}年
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-alt p-1 shadow-sm">
          {GAME_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateParams(currentSeason, type.value, currentView)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                currentType === type.value
                  ? "bg-dodger-blue text-white shadow-sm"
                  : "text-gray-600 hover:bg-surface hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 rounded-lg border border-border bg-surface-alt p-1 shadow-sm w-fit">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => updateParams(currentSeason, currentType, mode.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              currentView === mode.value
                ? "bg-accent-gold text-white shadow-sm"
                : "text-gray-600 hover:bg-surface hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
