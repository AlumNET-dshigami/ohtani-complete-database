import { OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import {
  getCareerStats,
  getSeasonPace,
  buildMilestoneStatuses,
} from "@/lib/milestones";
import MilestoneCountdown from "@/components/MilestoneCountdown";

export const revalidate = 3600;

export default async function MilestonesPage() {
  const currentYear = new Date().getFullYear();

  const [career, pace] = await Promise.all([
    getCareerStats(),
    getSeasonPace(currentYear),
  ]);

  const statuses = buildMilestoneStatuses(career, pace, currentYear);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-dodger-blue via-dodger-blue to-dodger-blue-dark p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-white/30 bg-white/10 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OHTANI_HEADSHOT_URL}
              alt="Shohei Ohtani"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              記録カウントダウン
            </h1>
            <p className="mt-1 text-sm text-white/70">
              大谷翔平 — 通算マイルストーンまで残り X
            </p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          通算記録の主要マイルストーンまでの残り数と、{currentYear}
          シーズンの現ペースでの到達予測年を表示しています。
          データは MLB Stats API より取得（1時間キャッシュ）。
        </p>
      </section>

      {/* Milestone Cards */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          マイルストーン一覧
        </h2>
        <MilestoneCountdown statuses={statuses} currentYear={currentYear} />
      </section>

      {/* Footer note */}
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ 通算成績は MLB Stats API より取得。現ペースは{currentYear}
        シーズンの成績から算出（1試合あたり × 162試合/32先発換算）。
      </p>
    </div>
  );
}
