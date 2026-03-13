import { Suspense } from "react";
import { getGameLogBatting, getGameLogPitching, getGameHighlights, aggregatePeriodStats } from "@/lib/mlb-api";
import StatsTable from "@/components/StatsTable";
import GameLogFilter from "@/components/GameLogFilter";
import AutoRefresh from "@/components/AutoRefresh";
import VideoHighlights from "@/components/VideoHighlights";
import type { GameLogBatting, GameLogPitching, PeriodStats } from "@/lib/types";

export const dynamic = "force-dynamic";

const GAME_TYPE_LABELS: Record<string, string> = {
  R: "レギュラーシーズン",
  S: "オープン戦",
  POST: "ポストシーズン",
  WBC: "WBC",
  A: "オールスター",
  E: "エキシビション",
};

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

const PERIOD_COLUMNS: { key: keyof PeriodStats; label: string }[] = [
  { key: "period", label: "期間" },
  { key: "games", label: "試合" },
  { key: "atBats", label: "打数" },
  { key: "hits", label: "安打" },
  { key: "homeRuns", label: "本塁打" },
  { key: "rbi", label: "打点" },
  { key: "stolenBases", label: "盗塁" },
  { key: "avg", label: "打率" },
  { key: "ops", label: "OPS" },
];

interface PageProps {
  searchParams: Promise<{ season?: string; type?: string; view?: string }>;
}

export default async function GameLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const season = Number(params.season) || new Date().getFullYear();
  const gameType = params.type ?? "R";
  const viewMode = params.view ?? "game";

  const [batting, pitching] = await Promise.all([
    getGameLogBatting(season, gameType),
    getGameLogPitching(season, gameType),
  ]);

  const typeLabel = GAME_TYPE_LABELS[gameType] ?? gameType;

  // Collect gamePks for games with HR or pitching appearances for video highlights
  const hrGames = batting.filter((g) => g.homeRuns > 0);
  const goodPitchingGames = pitching.filter(
    (g) => g.result === "W" || parseInt(g.inningsPitched) >= 6
  );

  const highlightGamePks = new Set<number>();
  for (const g of hrGames) if (g.gamePk) highlightGamePks.add(g.gamePk);
  for (const g of goodPitchingGames) if (g.gamePk) highlightGamePks.add(g.gamePk);

  // Fetch highlights for up to 10 notable games
  const pksToFetch = Array.from(highlightGamePks).slice(0, 10);
  const highlightResults = await Promise.all(
    pksToFetch.map(async (pk) => {
      const highlights = await getGameHighlights(pk);
      const game = hrGames.find((g) => g.gamePk === pk) ??
        batting.find((g) => g.gamePk === pk);
      const pitchGame = goodPitchingGames.find((g) => g.gamePk === pk);
      return {
        gamePk: pk,
        date: game?.date ?? pitchGame?.date ?? "",
        opponent: game?.opponent ?? pitchGame?.opponent ?? "",
        highlights,
      };
    })
  );

  const gamesWithVideos = highlightResults.filter((r) => r.highlights.length > 0);

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

      {/* Video Highlights Section */}
      {gamesWithVideos.length > 0 && (
        <section className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 p-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-dodger-red">▶</span>
            ハイライト動画
          </h3>
          {gamesWithVideos.map((game) => (
            <VideoHighlights
              key={game.gamePk}
              highlights={game.highlights}
              gameDate={game.date}
              opponent={game.opponent}
            />
          ))}
        </section>
      )}

      {/* Weekly / Monthly view */}
      {viewMode === "weekly" && batting.length > 0 && (
        <StatsTable
          title={`週間打撃成績 — ${season}年 ${typeLabel}`}
          columns={PERIOD_COLUMNS}
          data={aggregatePeriodStats(batting, "weekly")}
        />
      )}

      {viewMode === "monthly" && batting.length > 0 && (
        <StatsTable
          title={`月間打撃成績 — ${season}年 ${typeLabel}`}
          columns={PERIOD_COLUMNS}
          data={aggregatePeriodStats(batting, "monthly")}
        />
      )}

      {/* Game-by-game view (default) */}
      {viewMode === "game" && (
        <>
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
        </>
      )}

      {/* No data */}
      {batting.length === 0 && pitching.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {season}年の{typeLabel}データはありません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            シーズンや試合種別を変更してみてください
          </p>
        </div>
      )}
    </div>
  );
}
