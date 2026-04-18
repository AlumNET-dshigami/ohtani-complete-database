import { getMultiplePlayerSummaries } from "@/lib/mlb-players";
import { JAPANESE_MLB_PLAYERS } from "@/lib/japanese-players";
import PlayerCard from "@/components/PlayerCard";

export const dynamic = "force-dynamic";

export default async function JapanesePlayersPage() {
  const currentYear = new Date().getFullYear();
  const players = await getMultiplePlayerSummaries(JAPANESE_MLB_PLAYERS, currentYear);

  // Separate pitchers, batters, two-way
  const twoWay = players.filter(
    (p) =>
      p.batting && p.batting.atBats > 0 &&
      p.pitching && parseFloat(p.pitching.inningsPitched) > 0
  );
  const batters = players.filter(
    (p) =>
      p.batting && p.batting.atBats > 0 &&
      !(p.pitching && parseFloat(p.pitching.inningsPitched) > 0)
  );
  const pitchers = players.filter(
    (p) =>
      !(p.batting && p.batting.atBats > 0) &&
      p.pitching && parseFloat(p.pitching.inningsPitched) > 0
  );
  const inactive = players.filter(
    (p) =>
      !(p.batting && p.batting.atBats > 0) &&
      !(p.pitching && parseFloat(p.pitching.inningsPitched) > 0)
  );

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🇯🇵 日本人メジャーリーガー
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {currentYear}シーズン MLBで活躍する日本人選手の成績
        </p>
      </section>

      {twoWay.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            二刀流選手
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {twoWay.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                highlight={p.id === 660271}
              />
            ))}
          </div>
        </section>
      )}

      {batters.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            野手
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batters.map((p) => (
              <PlayerCard key={p.id} player={p} highlight={p.id === 660271} />
            ))}
          </div>
        </section>
      )}

      {pitchers.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            投手
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pitchers.map((p) => (
              <PlayerCard key={p.id} player={p} highlight={p.id === 660271} />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            出場記録なし
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactive.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        </section>
      )}

      {players.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            選手データを取得できませんでした
          </p>
        </div>
      )}
    </div>
  );
}
