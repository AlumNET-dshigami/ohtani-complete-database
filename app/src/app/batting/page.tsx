import { getCurrentSeasonStats, getGameLogBatting, OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import { calcAdvancedBatting } from "@/lib/sabermetrics";
import { getHotColdZones, getStatcastBatting } from "@/lib/statcast-api";
import StatCard from "@/components/StatCard";
import ZoneHeatMap from "@/components/ZoneHeatMap";
import SeasonProgressChart from "@/components/SeasonProgressChart";

export const dynamic = "force-dynamic";

export default async function BattingPage() {
  const currentYear = new Date().getFullYear();
  const [current, battingLog, zones, statcast] = await Promise.all([
    getCurrentSeasonStats(),
    getGameLogBatting(currentYear, "R"),
    getHotColdZones(currentYear, "hitting"),
    getStatcastBatting(currentYear),
  ]);

  const batting = current?.batting;
  const adv = batting ? calcAdvancedBatting(batting) : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-dodger-blue via-dodger-blue to-dodger-blue-dark p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-3 border-white/30 bg-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OHTANI_HEADSHOT_URL} alt="Shohei Ohtani" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">打者分析</h1>
            <p className="text-sm text-white/70">大谷翔平 — {currentYear}シーズン バッティングデータ</p>
          </div>
        </div>
      </section>

      {/* Basic Batting Stats */}
      {batting && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {current.season}シーズン 打撃成績
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard label="打率" value={batting.avg} sub="AVG" highlight />
            <StatCard label="本塁打" value={batting.homeRuns} sub="HR" highlight />
            <StatCard label="打点" value={batting.rbi} sub="RBI" />
            <StatCard label="OPS" value={batting.ops} highlight />
            <StatCard label="盗塁" value={batting.stolenBases} sub="SB" />
            <StatCard label="安打" value={batting.hits} sub="H" />
            <StatCard label="得点" value={batting.runs} sub="R" />
            <StatCard label="二塁打" value={batting.doubles} sub="2B" />
            <StatCard label="三塁打" value={batting.triples} sub="3B" />
            <StatCard label="試合" value={batting.gamesPlayed} sub="G" />
          </div>
        </section>
      )}

      {/* Statcast Metrics */}
      {statcast && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Statcast指標
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {statcast.avgExitVelocity !== null && (
              <StatCard label="平均打球速度" value={`${statcast.avgExitVelocity.toFixed(1)} mph`} sub="Exit Velo" highlight />
            )}
            {statcast.maxExitVelocity !== null && (
              <StatCard label="最大打球速度" value={`${statcast.maxExitVelocity.toFixed(1)} mph`} sub="Max EV" />
            )}
            {statcast.barrelRate !== null && (
              <StatCard label="バレル率" value={`${statcast.barrelRate.toFixed(1)}%`} sub="Barrel%" highlight />
            )}
            {statcast.hardHitRate !== null && (
              <StatCard label="ハードヒット率" value={`${statcast.hardHitRate.toFixed(1)}%`} sub="Hard Hit%" />
            )}
            {statcast.avgLaunchAngle !== null && (
              <StatCard label="平均打球角度" value={`${statcast.avgLaunchAngle.toFixed(1)}°`} sub="Launch Angle" />
            )}
            {statcast.sweetSpotRate !== null && (
              <StatCard label="スイートスポット率" value={`${statcast.sweetSpotRate.toFixed(1)}%`} sub="Sweet Spot%" />
            )}
            {statcast.xBA !== null && (
              <StatCard label="xBA" value={statcast.xBA} sub="期待打率" highlight />
            )}
            {statcast.xSLG !== null && (
              <StatCard label="xSLG" value={statcast.xSLG} sub="期待長打率" />
            )}
            {statcast.xWOBA !== null && (
              <StatCard label="xwOBA" value={statcast.xWOBA} sub="期待wOBA" highlight />
            )}
          </div>
          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
            ※ Statcast (Baseball Savant) より取得
          </p>
        </section>
      )}

      {/* Hot/Cold Zone Heat Map */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          ゾーン別打撃ヒートマップ
        </h2>
        <ZoneHeatMap categories={zones} title="打撃ゾーン分析" />
      </section>

      {/* Advanced Metrics */}
      {adv && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            セイバーメトリクス（打撃）
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <StatCard label="ISO" value={adv.iso} sub="Isolated Power" highlight />
            <StatCard label="BABIP" value={adv.babip} sub="インプレー打率" />
            <StatCard label="BB%" value={adv.bbRate} sub="四球率" />
            <StatCard label="K%" value={adv.kRate} sub="三振率" />
            <StatCard label="BB/K" value={adv.bbPerK} sub="四球/三振比" highlight />
            <StatCard label="AB/HR" value={adv.abPerHr} sub="本塁打効率" />
            <StatCard label="SecAVG" value={adv.secAvg} sub="二次打率" highlight />
            <StatCard label="TA" value={adv.ta} sub="Total Average" />
            <StatCard label="RC" value={adv.rc} sub="Runs Created" highlight />
            {batting && <StatCard label="OBP" value={batting.obp} sub="出塁率" />}
            {batting && <StatCard label="SLG" value={batting.slg} sub="長打率" />}
            <StatCard label="PA/BB" value={adv.paPerBb} sub="打席/四球" />
          </div>
          <div className="mt-3 rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">📊 指標の見方:</span>
              {" "}ISO（長打力）= SLG - AVG。BABIP（インプレー打率）は運と打球の質を測る（平均.300前後）。
              BB/K（四球三振比）は選球眼の指標。RC（得点創出）はビル・ジェームズ考案の得点貢献度。
            </p>
          </div>
        </section>
      )}

      {/* Season Progress */}
      {battingLog.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {currentYear}シーズン 打撃推移
          </h2>
          <SeasonProgressChart games={battingLog} />
        </section>
      )}

      {/* No Data */}
      {!batting && (
        <section className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            打撃データを取得できませんでした
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            シーズン開始後にデータが表示されます
          </p>
        </section>
      )}
    </div>
  );
}
