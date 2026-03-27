import { getPlayerInfo, getCurrentSeasonStats, getYearByYearStats, getGameLogBatting, getGameLogPitching, OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import StatCard from "@/components/StatCard";
import HrChart from "@/components/HrChart";
import PitchingChart from "@/components/PitchingChart";
import OpsChart from "@/components/OpsChart";
import AutoRefresh from "@/components/AutoRefresh";
import SeasonProgressChart from "@/components/SeasonProgressChart";
import PitchingProgressChart from "@/components/PitchingProgressChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [player, current, allStats, battingLog, pitchingLog] = await Promise.all([
    getPlayerInfo(),
    getCurrentSeasonStats(),
    getYearByYearStats(),
    getGameLogBatting(currentYear, "R"),
    getGameLogPitching(currentYear, "R"),
  ]);

  return (
    <div className="space-y-8">
      {/* Auto-refresh indicator */}
      <div className="flex justify-end">
        <AutoRefresh intervalMs={300000} />
      </div>

      {/* Player Profile */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-dodger-blue via-dodger-blue to-dodger-blue-dark p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/30 bg-white/10 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OHTANI_HEADSHOT_URL}
              alt={player.fullName}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {player.fullName}
            </h1>
            <p className="mt-1 text-lg font-medium text-white/80">
              #{player.number} | {player.currentTeam} | {player.position}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
              <span>{player.height} / {player.weight}lbs</span>
              <span>打席: {player.batSide}</span>
              <span>投球: {player.throwSide}</span>
              <span>出身: {player.birthCountry}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Current Season Batting */}
      {current?.batting && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {current.season}シーズン 打撃成績
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard label="打率" value={current.batting.avg} sub="AVG" highlight />
            <StatCard label="本塁打" value={current.batting.homeRuns} sub="HR" highlight />
            <StatCard label="打点" value={current.batting.rbi} sub="RBI" />
            <StatCard label="OPS" value={current.batting.ops} highlight />
            <StatCard label="盗塁" value={current.batting.stolenBases} sub="SB" />
            <StatCard label="安打" value={current.batting.hits} sub="H" />
            <StatCard label="得点" value={current.batting.runs} sub="R" />
            <StatCard label="四球" value={current.batting.baseOnBalls} sub="BB" />
            <StatCard label="三振" value={current.batting.strikeOuts} sub="SO" />
            <StatCard label="試合" value={current.batting.gamesPlayed} sub="G" />
          </div>
        </section>
      )}

      {/* Current Season Pitching */}
      {current?.pitching && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {current.season}シーズン 投球成績
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard label="防御率" value={current.pitching.era} sub="ERA" highlight />
            <StatCard label="勝敗" value={`${current.pitching.wins}-${current.pitching.losses}`} sub="W-L" />
            <StatCard label="奪三振" value={current.pitching.strikeOuts} sub="SO" highlight />
            <StatCard label="WHIP" value={current.pitching.whip} />
            <StatCard label="投球回" value={current.pitching.inningsPitched} sub="IP" />
            <StatCard label="先発" value={current.pitching.gamesStarted} sub="GS" />
            <StatCard label="被安打" value={current.pitching.hits} sub="H" />
            <StatCard label="四球" value={current.pitching.baseOnBalls} sub="BB" />
            <StatCard label="被本塁打" value={current.pitching.homeRuns} sub="HR" />
            <StatCard label="K/9" value={current.pitching.strikeoutsPer9} />
          </div>
        </section>
      )}

      {/* No data message */}
      {!current && allStats.length === 0 && (
        <section className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            MLB APIからデータを取得できませんでした
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            インターネット接続を確認してページをリロードしてください
          </p>
        </section>
      )}

      {/* Current Season Progress */}
      {(battingLog.length > 0 || pitchingLog.length > 0) && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {currentYear}シーズン 推移
          </h2>
          {battingLog.length > 0 && <SeasonProgressChart games={battingLog} />}
          {pitchingLog.length > 0 && (
            <div className="mt-6">
              <PitchingProgressChart games={pitchingLog} />
            </div>
          )}
        </section>
      )}

      {/* Career Charts */}
      {allStats.length > 0 && (
        <>
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              通算成績チャート
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <HrChart data={allStats} />
              <PitchingChart data={allStats} />
            </div>
          </section>
          <section>
            <OpsChart data={allStats} />
          </section>
        </>
      )}
    </div>
  );
}
