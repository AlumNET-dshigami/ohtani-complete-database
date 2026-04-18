import { getPlayerInfo, getCurrentSeasonStats, getYearByYearStats, getGameLogBatting, getGameLogPitching, OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import { calcAdvancedBatting, calcAdvancedPitching, getCurrentWARDisplay, buildCareerWARChartData } from "@/lib/sabermetrics";
import StatCard from "@/components/StatCard";
import HrChart from "@/components/HrChart";
import PitchingChart from "@/components/PitchingChart";
import OpsChart from "@/components/OpsChart";
import WARChart from "@/components/WARChart";
import AutoRefresh from "@/components/AutoRefresh";
import SeasonProgressChart from "@/components/SeasonProgressChart";
import PitchingProgressChart from "@/components/PitchingProgressChart";
import AdvancedStats from "@/components/AdvancedStats";
import JapaneseVideoLinks from "@/components/JapaneseVideoLinks";
import RakutenGoods from "@/components/RakutenGoods";

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

      {/* Advanced Sabermetrics */}
      {current?.batting && current?.pitching && (() => {
        const advBat = calcAdvancedBatting(current.batting);
        const advPit = calcAdvancedPitching(current.pitching);

        const battingStats = [
          { label: "ISO", value: advBat.iso, desc: "Isolated Power（長打力）= 長打率 - 打率。純粋なパワーを測る", highlight: true },
          { label: "BABIP", value: advBat.babip, desc: "インプレー打球の打率。運と打球の質を測る指標（平均.300前後）" },
          { label: "BB%", value: advBat.bbRate, desc: "四球率。打席に対する四球の割合。選球眼を測る" },
          { label: "K%", value: advBat.kRate, desc: "三振率。打席に対する三振の割合。低いほど良い" },
          { label: "BB/K", value: advBat.bbPerK, desc: "四球と三振の比率。高いほど選球眼が良い", highlight: true },
          { label: "AB/HR", value: advBat.abPerHr, desc: "本塁打を1本打つのに必要な打数。低いほど効率的" },
          { label: "SecAVG", value: advBat.secAvg, desc: "二次打率 = (塁打 - 安打 + 四球 + 盗塁) / 打数。打率以外の貢献", highlight: true },
          { label: "TA", value: advBat.ta, desc: "Total Average（総合指標）。全攻撃イベントを考慮した打撃評価" },
          { label: "RC", value: advBat.rc, desc: "Runs Created（得点創出）。ビル・ジェームズ考案の得点貢献度" },
          { label: "OBP", value: current.batting.obp, desc: "出塁率。打率+四球+死球。最重要指標の一つ", highlight: true },
          { label: "SLG", value: current.batting.slg, desc: "長打率。塁打数/打数。パワーの指標" },
          { label: "PA/BB", value: advBat.paPerBb, desc: "四球1つあたりの打席数。選球眼の別指標" },
        ];

        const pitchingStats = [
          { label: "FIP", value: advPit.fip, desc: "Fielding Independent Pitching。守備に依存しない投球力。ERAより真の実力を反映", highlight: true },
          { label: "K/9", value: advPit.kPer9, desc: "9イニングあたりの奪三振数。支配力を測る" },
          { label: "BB/9", value: advPit.bbPer9, desc: "9イニングあたりの与四球数。制球力を測る" },
          { label: "H/9", value: advPit.hPer9, desc: "9イニングあたりの被安打数" },
          { label: "HR/9", value: advPit.hrPer9, desc: "9イニングあたりの被本塁打数。低いほど良い" },
          { label: "K/BB", value: advPit.kPerBb, desc: "奪三振と与四球の比率。制球力の総合指標", highlight: true },
          { label: "K%", value: advPit.kRate, desc: "対戦打者に対する三振割合。高いほど支配的", highlight: true },
          { label: "BB%", value: advPit.bbRate, desc: "対戦打者に対する四球割合。低いほど良い" },
          { label: "LOB%", value: advPit.lob, desc: "残塁率。出塁した走者をホームに返さなかった割合" },
          { label: "WHIP", value: current.pitching.whip, desc: "1イニングあたりの出塁許可数（安打+四球）。1.00以下がエース級" },
          { label: "ERA", value: current.pitching.era, desc: "防御率。9イニングあたりの自責点。投手の基本指標" },
          { label: "IP", value: current.pitching.inningsPitched, desc: "投球回数。長く投げるほどチームへの貢献大" },
        ];

        return <AdvancedStats battingStats={battingStats} pitchingStats={pitchingStats} />;
      })()}

      {/* WAR Display */}
      {current && (() => {
        const war = getCurrentWARDisplay(current.season, current.batting, current.pitching);
        return (
          <section>
            <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
              {current.season}シーズン WAR
            </h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              データソース:{" "}
              <a
                href="https://www.fangraphs.com/leaders/war"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dodger-blue hover:underline"
              >
                FanGraphs
              </a>
              {" / "}Baseball-Reference
            </p>
            {war.source === "real" ? (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="fWAR" value={war.fWAR} sub="FanGraphs" highlight />
                <StatCard label="bWAR" value={war.bWAR} sub="Baseball-Reference" highlight />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard label="WAR（推定）" value={war.estimate} sub="今季進行中" highlight />
                <div className="rounded-xl border border-border bg-surface p-4 text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-bold text-gray-700 dark:text-gray-300">📊 WARについて</p>
                  <p className="mt-1">シーズン終了後、FanGraphs / Baseball-Referenceの公式値に自動更新されます。</p>
                </div>
              </div>
            )}
          </section>
        );
      })()}

      {/* Rakuten Affiliate Goods */}
      <RakutenGoods />

      {/* Japanese Video Links */}
      <JapaneseVideoLinks />

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
      {allStats.length > 0 && (() => {
        const careerWAR = buildCareerWARChartData(allStats);
        return (
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
              <WARChart data={careerWAR} />
            </section>
            <section>
              <OpsChart data={allStats} />
            </section>
          </>
        );
      })()}
    </div>
  );
}
