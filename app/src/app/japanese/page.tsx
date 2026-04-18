import { getActivePlayersByCountry, getMultiplePlayerSummaries } from "@/lib/mlb-players";
import { getJapaneseName } from "@/lib/japanese-players";
import PlayerCard from "@/components/PlayerCard";

export const dynamic = "force-dynamic";

export default async function JapanesePlayersPage() {
  const currentYear = new Date().getFullYear();

  // Dynamically fetch all Japan-born MLB players, then hydrate their stats.
  const japanPlayers = await getActivePlayersByCountry(currentYear, "Japan");
  const withNames = japanPlayers.map((p) => ({
    id: p.id,
    nameJa: getJapaneseName(p.id),
  }));

  const players = await getMultiplePlayerSummaries(withNames, currentYear);

  // Safety filter: only keep players confirmed as Japan-born by the API response.
  const verified = players.filter((p) => p.birthCountry === "Japan");

  // Separate pitchers, batters, two-way
  const twoWay = verified.filter(
    (p) =>
      p.batting && p.batting.atBats > 0 &&
      p.pitching && parseFloat(p.pitching.inningsPitched) > 0
  );
  const batters = verified.filter(
    (p) =>
      p.batting && p.batting.atBats > 0 &&
      !(p.pitching && parseFloat(p.pitching.inningsPitched) > 0)
  );
  const pitchers = verified.filter(
    (p) =>
      !(p.batting && p.batting.atBats > 0) &&
      p.pitching && parseFloat(p.pitching.inningsPitched) > 0
  );
  const inactive = verified.filter(
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
          {currentYear}シーズン MLBで活躍する日本出身選手の成績（全{verified.length}名）
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
            今季出場記録なし
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactive.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        </section>
      )}

      {verified.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            選手データを取得できませんでした
          </p>
        </div>
      )}
    </div>
  );
}
