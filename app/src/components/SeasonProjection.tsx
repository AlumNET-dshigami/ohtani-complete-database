import type { ProjectionData, ConfidenceLevel } from "@/lib/season-projection";
import { CAREER_BESTS } from "@/lib/season-projection";

interface Props {
  data: ProjectionData;
}

const SEASON_GAMES = 162;

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  "序盤参考": "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  "予測中": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "確度高め": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "ほぼ確定": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function isCareerBest(stat: keyof typeof CAREER_BESTS, value: number): boolean {
  return value > CAREER_BESTS[stat];
}

interface CountStatCardProps {
  label: string;
  current: number;
  projected: number;
  careerBestKey?: keyof typeof CAREER_BESTS;
}

function CountStatCard({ label, current, projected, careerBestKey }: CountStatCardProps) {
  const isBest = careerBestKey ? isCareerBest(careerBestKey, projected) : false;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{current}</span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
        <span className="text-base font-bold text-gray-900 dark:text-white">
          {projected}
          {isBest && (
            <span
              className="ml-0.5 text-orange-500"
              aria-label="自己最高ペース"
              title="自己最高ペース"
            >
              ★
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

interface RateStatCardProps {
  label: string;
  value: string;
  careerBestKey?: keyof typeof CAREER_BESTS;
}

function RateStatCard({ label, value, careerBestKey }: RateStatCardProps) {
  const isBest = careerBestKey
    ? isCareerBest(careerBestKey, parseFloat(value))
    : false;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
      <span className="text-base font-bold text-gray-900 dark:text-white">
        {value}
        {isBest && (
          <span className="ml-0.5 text-orange-500" title="自己最高ペース">
            {" "}
          </span>
        )}
      </span>
    </div>
  );
}

export default function SeasonProjection({ data }: Props) {
  const progressPct = Math.min(100, Math.round((data.gamesPlayed / SEASON_GAMES) * 100));
  const confidenceClass = CONFIDENCE_STYLES[data.confidence];

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            2026年シーズン最終成績予想
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceClass}`}>
            {data.confidence}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>消化 {data.gamesPlayed} / {SEASON_GAMES} 試合</span>
          {/* Progress bar */}
          <div className="h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-dodger-blue transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span>{progressPct}%</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ※率統計（打率・OPS等）は現在値そのまま
        </span>
      </div>

      {/* Stats grid */}
      <div className="space-y-3">
        {/* 打者ライン */}
        <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">打者</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <RateStatCard label="打率" value={data.battingAvg} />
            <RateStatCard
              label="OPS"
              value={data.ops}
              careerBestKey="ops"
            />
            <RateStatCard label="OBP" value={data.obp} />
            <CountStatCard
              label="本塁打"
              current={data.homeRunsCurrent}
              projected={data.homeRunsProjected}
              careerBestKey="homeRuns"
            />
            <CountStatCard
              label="打点"
              current={data.rbiCurrent}
              projected={data.rbiProjected}
              careerBestKey="rbi"
            />
            <CountStatCard
              label="安打"
              current={data.hitsCurrent}
              projected={data.hitsProjected}
            />
          </div>
        </div>

        {/* 投手ライン */}
        {data.hasPitchingData && (
          <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">投手</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                （{data.gamesStarted}先発 → 28先発ペース換算）
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RateStatCard label="防御率" value={data.era} />
              <RateStatCard label="WHIP" value={data.whip} />
              <CountStatCard
                label="勝利"
                current={data.winsCurrent}
                projected={data.winsProjected}
                careerBestKey="wins"
              />
              <CountStatCard
                label="奪三振"
                current={data.kCurrent}
                projected={data.kProjected}
                careerBestKey="strikeOuts"
              />
            </div>
          </div>
        )}
      </div>

      {/* 自己最高超えがある場合の注釈 */}
      {(() => {
        const bests: string[] = [];
        if (isCareerBest("homeRuns", data.homeRunsProjected)) bests.push(`HR ${data.homeRunsProjected}本（自己最高 ${CAREER_BESTS.homeRuns}本）`);
        if (isCareerBest("rbi", data.rbiProjected)) bests.push(`打点 ${data.rbiProjected}（自己最高 ${CAREER_BESTS.rbi}）`);
        if (data.hasPitchingData && isCareerBest("strikeOuts", data.kProjected)) bests.push(`奪三振 ${data.kProjected}K（自己最高 ${CAREER_BESTS.strikeOuts}K）`);
        if (data.hasPitchingData && isCareerBest("wins", data.winsProjected)) bests.push(`${data.winsProjected}勝（自己最高 ${CAREER_BESTS.wins}勝）`);
        if (isCareerBest("ops", parseFloat(data.ops))) bests.push(`OPS ${data.ops}（自己最高 ${CAREER_BESTS.ops}）`);
        if (bests.length === 0) return null;
        return (
          <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
            自己最高ペース: {bests.join(" / ")}
          </p>
        );
      })()}
    </section>
  );
}
