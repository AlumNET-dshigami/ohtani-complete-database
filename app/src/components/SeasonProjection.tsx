import type { ProjectionData } from "@/lib/season-projection";
import { CAREER_BESTS, SEASON_GAMES } from "@/lib/season-projection";

interface Props {
  data: ProjectionData;
}

function isCareerBest(stat: keyof typeof CAREER_BESTS, value: number): boolean {
  return value > CAREER_BESTS[stat];
}

interface StatCardProps {
  label: string;
  value: string | number;
  careerBestKey?: keyof typeof CAREER_BESTS;
}

function MiniStat({ label, value, careerBestKey }: StatCardProps) {
  const isBest = careerBestKey ? isCareerBest(careerBestKey, parseFloat(String(value))) : false;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
      <span className="text-base font-bold text-gray-900 dark:text-white">
        {value}
        {isBest && (
          <span className="ml-0.5 text-orange-500" aria-label="自己最高" title="自己最高">
            ★
          </span>
        )}
      </span>
    </div>
  );
}

export default function SeasonProjection({ data }: Props) {
  const bests: string[] = [];
  if (isCareerBest("homeRuns", data.homeRuns)) bests.push(`HR ${data.homeRuns}本（従来の自己最高 ${CAREER_BESTS.homeRuns}本）`);
  if (isCareerBest("rbi", data.rbi)) bests.push(`打点 ${data.rbi}（従来の自己最高 ${CAREER_BESTS.rbi}）`);
  if (data.hasPitchingData && isCareerBest("strikeOuts", data.strikeOuts)) bests.push(`奪三振 ${data.strikeOuts}K（従来の自己最高 ${CAREER_BESTS.strikeOuts}K）`);
  if (data.hasPitchingData && isCareerBest("wins", data.wins)) bests.push(`${data.wins}勝（従来の自己最高 ${CAREER_BESTS.wins}勝）`);
  if (isCareerBest("ops", parseFloat(data.ops))) bests.push(`OPS ${data.ops}（従来の自己最高 ${CAREER_BESTS.ops}）`);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {data.season}年シーズン 最終成績
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            確定
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          レギュラーシーズン {data.gamesPlayed} 試合出場（チーム {SEASON_GAMES} 試合）
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ※率統計（打率・OPS等）はシーズン終了時点の確定値
        </span>
      </div>
      {data.isFallback && (
        <p role="status" className="mb-3 text-xs text-amber-600 dark:text-amber-400">
          最新データを取得できなかったため、保存済みの最終成績を表示しています。
        </p>
      )}

      <div className="space-y-3">
        {/* 打者ライン */}
        <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">打者</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <MiniStat label="打率" value={data.battingAvg} />
            <MiniStat label="OPS" value={data.ops} careerBestKey="ops" />
            <MiniStat label="OBP" value={data.obp} />
            <MiniStat label="本塁打" value={data.homeRuns} careerBestKey="homeRuns" />
            <MiniStat label="打点" value={data.rbi} careerBestKey="rbi" />
            <MiniStat label="安打" value={data.hits} />
          </div>
        </div>

        {/* 投手ライン */}
        {data.hasPitchingData && (
          <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">投手</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                （{data.gamesStarted}先発）
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="防御率" value={data.era} />
              <MiniStat label="WHIP" value={data.whip} />
              <MiniStat label="勝利" value={data.wins} careerBestKey="wins" />
              <MiniStat label="奪三振" value={data.strikeOuts} careerBestKey="strikeOuts" />
            </div>
          </div>
        )}
      </div>

      {bests.length > 0 && (
        <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
          自己最高更新: {bests.join(" / ")}
        </p>
      )}
    </section>
  );
}
