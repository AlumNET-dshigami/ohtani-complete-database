import { getMultiplePlayerSummaries } from "@/lib/mlb-players";
import { MLB_STAR_BATTERS, MLB_STAR_PITCHERS } from "@/lib/star-players";
import CompareTable from "@/components/CompareTable";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const currentYear = new Date().getFullYear();

  // Dedupe Ohtani (shared in both lists)
  const batterList = MLB_STAR_BATTERS.map((p) => ({ id: p.id, nameJa: p.nameJa }));
  const pitcherList = MLB_STAR_PITCHERS.map((p) => ({ id: p.id, nameJa: p.nameJa }));

  const [batters, pitchers] = await Promise.all([
    getMultiplePlayerSummaries(batterList, currentYear),
    getMultiplePlayerSummaries(pitcherList, currentYear),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🆚 MLBスター選手比較
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {currentYear}シーズン 大谷翔平とMLBトップ選手の成績比較（
          <span className="text-accent-gold font-bold">金色</span>
          が各指標のリーダー）
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          打撃比較
        </h2>
        <CompareTable players={batters} mode="batting" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          投手比較
        </h2>
        <CompareTable players={pitchers} mode="pitching" />
      </section>

      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ データはMLB公式APIより取得。レギュラーシーズン成績を表示しています。
      </p>
    </div>
  );
}
