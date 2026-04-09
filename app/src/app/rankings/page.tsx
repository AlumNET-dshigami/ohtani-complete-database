import { getBattingLeaders, getPitchingLeaders } from "@/lib/rankings-api";
import type { LeaderCategory } from "@/lib/rankings-api";

export const dynamic = "force-dynamic";

function LeaderBoard({ category }: { category: LeaderCategory }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-dodger-blue/10 to-transparent px-4 py-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
          {category.categoryLabel}
        </h3>
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
      </div>
    </div>
  );
}

export default async function RankingsPage() {
  const currentYear = new Date().getFullYear();
  const [battingLeaders, pitchingLeaders] = await Promise.all([
    getBattingLeaders(currentYear),
    getPitchingLeaders(currentYear),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentYear}シーズン MLBランキング
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          各指標のリーグ上位10選手を表示（大谷翔平はハイライト表示）
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
