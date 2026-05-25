import { getBattingLeaders, getPitchingLeaders, getTitleRaces } from "@/lib/rankings-api";
import type { LeaderCategory, LeagueScope, TitleRace } from "@/lib/rankings-api";
import { fetchWARRanking, type WARRankingResult, type WARScope } from "@/lib/war-scraper";
import { getCurrentSeasonWAR } from "@/lib/war-source";
import TitleRaceDashboard from "@/components/TitleRaceDashboard";
import WARRankingDashboard from "@/components/WARRankingDashboard";

export const dynamic = "force-dynamic";

function LeaderBoard({ category }: { category: LeaderCategory }) {
  const ohtaniInTop10 = category.leaders.some((l) => l.isOhtani);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-dodger-blue/10 to-transparent px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            {category.categoryLabel}
          </h3>
          {category.ohtaniRank !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                category.ohtaniRank <= 3
                  ? "bg-accent-gold text-white"
                  : category.ohtaniRank <= 10
                  ? "bg-dodger-blue text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              大谷: {category.ohtaniRank}位 ({category.ohtaniValue})
            </span>
          )}
          {category.ohtaniRank === null && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              大谷: 圏外
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-border">
        {category.leaders.map((leader) => (
          <div
            key={`${leader.playerId}-${leader.rank}`}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              leader.isOhtani
                ? "bg-dodger-blue/10 border-l-4 border-l-dodger-blue"
                : ""
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                leader.rank <= 3
                  ? "bg-accent-gold text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {leader.rank}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={`font-medium truncate block ${
                  leader.isOhtani
                    ? "text-dodger-blue font-bold"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {leader.playerName}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {leader.teamName}
              </span>
            </div>
            <span
              className={`shrink-0 font-mono text-sm font-bold ${
                leader.isOhtani
                  ? "text-dodger-blue"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {leader.value}
            </span>
          </div>
        ))}
        {category.leaders.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            データなし
          </div>
        )}
        {!ohtaniInTop10 && category.ohtaniRank !== null && (
          <div className="flex items-center gap-3 bg-dodger-blue/5 px-4 py-2.5 text-sm border-l-4 border-l-dodger-blue">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dodger-blue text-xs font-bold text-white">
              {category.ohtaniRank}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-dodger-blue block">大谷 翔平</span>
              <span className="text-[10px] text-gray-400">Los Angeles Dodgers</span>
            </div>
            <span className="shrink-0 font-mono text-sm font-bold text-dodger-blue">
              {category.ohtaniValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function RankingsPage() {
  const currentYear = new Date().getFullYear();
  const [
    battingLeaders,
    pitchingLeaders,
    nlRaces,
    alRaces,
    mlbRaces,
    warMlb,
    warNl,
    warAl,
    warResult,
  ] = await Promise.all([
    getBattingLeaders(currentYear),
    getPitchingLeaders(currentYear),
    getTitleRaces(currentYear, "NL"),
    getTitleRaces(currentYear, "AL"),
    getTitleRaces(currentYear, "MLB"),
    fetchWARRanking(currentYear, "MLB"),
    fetchWARRanking(currentYear, "NL"),
    fetchWARRanking(currentYear, "AL"),
    getCurrentSeasonWAR(currentYear),
  ]);

  const byScope: Record<LeagueScope, TitleRace[]> = {
    NL: nlRaces,
    AL: alRaces,
    MLB: mlbRaces,
  };

  const warByScope: Partial<Record<WARScope, WARRankingResult>> = {
    MLB: warMlb,
    NL: warNl,
    AL: warAl,
  };

  const warSnap = warResult.snapshot;
  const warBreakdown = {
    battingFWar: warSnap.batting.fWAR,
    pitchingFWar: warSnap.pitching.fWAR,
    battingRWar: warSnap.batting.rWAR,
    pitchingRWar: warSnap.pitching.rWAR,
    totalFWar: warSnap.total.fWAR,
    totalRWar: warSnap.total.rWAR,
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentYear}シーズン MLBランキング
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          大谷翔平のタイトル争いと各指標ランキング
        </p>
      </section>

      {/* 機能A: タイトル争いダッシュボード */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          🏆 タイトル争い
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          大谷の所属するナ・リーグを基準に「タイトルまであと何本／何厘」を表示
        </p>
        <TitleRaceDashboard byScope={byScope} season={currentYear} />
      </section>

      {/* 機能C: WARランキング */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          📊 WARランキング
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          二刀流の合算WARと内訳、リーグ/MLB全体のTOP20（大谷翔平を強調）
        </p>
        <WARRankingDashboard
          byScope={warByScope}
          breakdown={warBreakdown}
          season={currentYear}
          isManual={warResult.source !== "live"}
          sourceUrl={warSnap.sourceUrl}
          sourceUpdatedAt={warSnap.sourceUpdatedAt}
        />
      </section>

      {/* 従来の指標別リーダーボード（補助） */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          指標別リーダーボード
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          各指標のMLB上位選手（大谷翔平はハイライト表示）
        </p>
      </section>

      {/* Batting Leaders */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          打撃ランキング
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {battingLeaders.map((cat) => (
            <LeaderBoard key={cat.categoryKey} category={cat} />
          ))}
        </div>
        {battingLeaders.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              打撃ランキングデータを取得できませんでした
            </p>
          </div>
        )}
      </section>

      {/* Pitching Leaders */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          投手ランキング
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pitchingLeaders.map((cat) => (
            <LeaderBoard key={cat.categoryKey} category={cat} />
          ))}
        </div>
        {pitchingLeaders.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              投手ランキングデータを取得できませんでした
            </p>
          </div>
        )}
      </section>

      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ データはMLB公式APIより取得。ランキングはレギュラーシーズンの成績です。
      </p>
    </div>
  );
}
