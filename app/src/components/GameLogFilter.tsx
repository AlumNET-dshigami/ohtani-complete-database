"use client";

import { useRouter, useSearchParams } from "next/navigation";

const GAME_TYPES = [
  { value: "R", label: "レギュラーシーズン" },
  { value: "POST", label: "ポストシーズン" },
  { value: "WBC", label: "WBC" },
];

export default function GameLogFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSeason = searchParams.get("season") ?? String(new Date().getFullYear());
  const currentType = searchParams.get("type") ?? "R";

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: currentYear - 2012 }, (_, i) => currentYear - i);

  function updateParams(season: string, type: string) {
    router.push(`/gamelog?season=${season}&type=${type}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <select
        value={currentSeason}
        onChange={(e) => updateParams(e.target.value, currentType)}
        className="rounded-lg border border-dodger-blue/20 bg-white px-3 py-2 text-sm font-medium text-gray-900 dark:border-dodger-blue/30 dark:bg-gray-800 dark:text-white"
      >
        {seasons.map((year) => (
          <option key={year} value={year}>
            {year}年
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        {GAME_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateParams(currentSeason, type.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentType === type.value
                ? "bg-dodger-blue text-white"
                : "border border-dodger-blue/20 text-gray-700 hover:bg-dodger-blue-light dark:border-dodger-blue/30 dark:text-gray-300 dark:hover:bg-dodger-blue/10"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
