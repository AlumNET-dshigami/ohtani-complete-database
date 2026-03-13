import { Suspense } from "react";
import { getGameLogBatting, getGameLogPitching } from "@/lib/mlb-api";
import StatsTable from "@/components/StatsTable";
import GameLogFilter from "@/components/GameLogFilter";
import AutoRefresh from "@/components/AutoRefresh";
import type { GameLogBatting, GameLogPitching } from "@/lib/types";

export const dynamic = "force-dynamic";

const BATTING_COLUMNS: { key: keyof GameLogBatting; label: string }[] = [
  { key: "date", label: "日付" },
  { key: "opponent", label: "対戦" },
  { key: "atBats", label: "打数" },
  { key: "hits", label: "安打" },
  { key: "doubles", label: "二塁打" },
  { key: "triples", label: "三塁打" },
  { key: "homeRuns", label: "本塁打" },
  { key: "rbi", label: "打点" },
  { key: "runs", label: "得点" },
  { key: "stolenBases", label: "盗塁" },
  { key: "baseOnBalls", label: "四球" },
  { key: "strikeOuts", label: "三振" },
  { key: "avg", label: "打率" },
];

const PITCHING_COLUMNS: { key: keyof GameLogPitching; label: string }[] = [
  { key: "date", label: "日付" },
  { key: "opponent", label: "対戦" },
  { key: "result", label: "結果" },
  { key: "inningsPitched", label: "投球回" },
  { key: "hits", label: "被安打" },
  { key: "earnedRuns", label: "自責点" },
  { key: "homeRuns", label: "被本塁打" },
  { key: "baseOnBalls", label: "四球" },
  { key: "strikeOuts", label: "奪三振" },
  { key: "era", label: "防御率" },
];

interface PageProps {
  searchParams: Promise<{ season?: string; type?: string }>;
}

export default async function GameLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const season = Number(params.season) || new Date().getFullYear();
  const gameType = params.type ?? "R";

  const [batting, pitching] = await Promise.all([
    getGameLogBatting(season, gameType),
    getGameLogPitching(season, gameType),
  ]);

  const typeLabel =
    gameType === "POST"
      ? "ポストシーズン"
      : gameType === "WBC"
        ? "WBC"
        : "レギュラーシーズン";

  const totalHr = batting.reduce((sum, g) => sum + g.homeRuns, 0);
  const totalHits = batting.reduce((sum, g) => sum + g.hits, 0);
  const totalRbi = batting.reduce((sum, g) => sum + g.rbi, 0);
  const totalSb = batting.reduce((sum, g) => sum + g.stolenBases, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            試合結果
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            各試合の打撃・投球成績
          </p>
        </div>
        <AutoRefresh intervalMs={300000} />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <GameLogFilter />
      </Suspense>

      {/* Quick summary */}
      {batting.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-dodger-blue">試合数</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{batting.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-dodger-blue">本塁打</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHr}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-dodger-blue">安打</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHits}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-dodger-blue">打点 / 盗塁</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalRbi} / {totalSb}</p>
          </div>
        </div>
      )}

      <StatsTable
        title={`打撃成績 — ${season}年 ${typeLabel}`}
        columns={BATTING_COLUMNS}
        data={batting}
      />

      {pitching.length > 0 && (
        <StatsTable
          title={`投球成績 — ${season}年 ${typeLabel}`}
          columns={PITCHING_COLUMNS}
          data={pitching}
        />
      )}
    </div>
  );
}
