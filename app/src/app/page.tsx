import { getPlayerInfo, getCurrentSeasonStats, getYearByYearStats } from "@/lib/mlb-api";
import StatCard from "@/components/StatCard";
import HrChart from "@/components/HrChart";
import PitchingChart from "@/components/PitchingChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [player, current, allStats] = await Promise.all([
    getPlayerInfo(),
    getCurrentSeasonStats(),
    getYearByYearStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Player Profile */}
      <section className="rounded-xl border border-dodger-blue/15 bg-white p-6 dark:border-dodger-blue/25 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dodger-blue text-3xl text-white">
            ⚾
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {player.fullName}
            </h1>
            <p className="text-dodger-blue font-medium dark:text-dodger-blue">
              #{player.number} | {player.currentTeam} | {player.position}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              {player.height} / {player.weight}lbs | 打席: {player.batSide} | 投球: {player.throwSide}
            </p>
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
            <StatCard label="打率" value={current.batting.avg} sub="AVG" />
            <StatCard label="本塁打" value={current.batting.homeRuns} sub="HR" />
            <StatCard label="打点" value={current.batting.rbi} sub="RBI" />
            <StatCard label="OPS" value={current.batting.ops} />
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
            <StatCard label="防御率" value={current.pitching.era} sub="ERA" />
            <StatCard label="勝敗" value={`${current.pitching.wins}-${current.pitching.losses}`} sub="W-L" />
            <StatCard label="奪三振" value={current.pitching.strikeOuts} sub="SO" />
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

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <HrChart data={allStats} />
        <PitchingChart data={allStats} />
      </section>
    </div>
  );
}
