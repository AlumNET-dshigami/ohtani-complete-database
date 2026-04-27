import { getCurrentSeasonStats, getGameLogPitching, OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import { calcAdvancedPitching } from "@/lib/sabermetrics";
import { getHotColdZones, getPitchArsenal } from "@/lib/statcast-api";
import StatCard from "@/components/StatCard";
import ZoneHeatMap from "@/components/ZoneHeatMap";
import PitchArsenal from "@/components/PitchArsenal";
import PitchingProgressChart from "@/components/PitchingProgressChart";

export const dynamic = "force-dynamic";

export default async function PitchingPage() {
  const currentYear = new Date().getFullYear();
  const [current, pitchingLog, zones, arsenal] = await Promise.all([
    getCurrentSeasonStats(),
    getGameLogPitching(currentYear, "R"),
    getHotColdZones(currentYear, "pitching"),
    getPitchArsenal(currentYear),
  ]);

  const pitching = current?.pitching;
  const adv = pitching ? calcAdvancedPitching(pitching) : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-red-600 via-red-500 to-red-700 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-3 border-white/30 bg-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OHTANI_HEADSHOT_URL} alt="Shohei Ohtani" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">投手分析</h1>
            <p className="text-sm text-white/70">大谷翔平 — {currentYear}シーズン ピッチングデータ</p>
          </div>
        </div>
      </section>

      {/* Basic Pitching Stats */}
      {pitching && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {current.season}シーズン 投球成績
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard label="防御率" value={pitching.era} sub="ERA" highlight />
            <StatCard label="勝敗" value={`${pitching.wins}-${pitching.losses}`} sub="W-L" />
            <StatCard label="奪三振" value={pitching.strikeOuts} sub="SO" highlight />
            <StatCard label="WHIP" value={pitching.whip} />
            <StatCard label="投球回" value={pitching.inningsPitched} sub="IP" />
            <StatCard label="先発" value={pitching.gamesStarted} sub="GS" />
            <StatCard label="被安打" value={pitching.hits} sub="H" />
            <StatCard label="四球" value={pitching.baseOnBalls} sub="BB" />
            <StatCard label="被本塁打" value={pitching.homeRuns} sub="HR" />
            <StatCard label="K/9" value={pitching.strikeoutsPer9} />
          </div>
        </section>
      )}

      {/* Pitch Arsenal */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          球種分析
        </h2>
        <PitchArsenal data={arsenal} />
      </section>

      {/* Pitching Zone Heat Map */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          投球ゾーンヒートマップ
        </h2>
        <ZoneHeatMap categories={zones} title="投球ゾーン分析（被打率）" />
      </section>

      {/* Advanced Pitching Metrics */}
      {adv && pitching && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            セイバーメトリクス（投球）
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <StatCard label="FIP" value={adv.fip} sub="守備非依存防御率" highlight />
            <StatCard label="K/9" value={adv.kPer9} sub="9イニングK" highlight />
            <StatCard label="BB/9" value={adv.bbPer9} sub="9イニングBB" />
            <StatCard label="H/9" value={adv.hPer9} sub="9イニング被安打" />
            <StatCard label="HR/9" value={adv.hrPer9} sub="9イニング被HR" />
            <StatCard label="K/BB" value={adv.kPerBb} sub="奪三振/与四球" highlight />
            <StatCard label="K%" value={adv.kRate} sub="奪三振率" highlight />
            <StatCard label="BB%" value={adv.bbRate} sub="与四球率" />
            <StatCard label="LOB%" value={adv.lob} sub="残塁率" />
            <StatCard label="WHIP" value={pitching.whip} sub="出塁許可率" />
            <StatCard label="ERA" value={pitching.era} sub="防御率" />
            <StatCard label="IP" value={pitching.inningsPitched} sub="投球回" />
          </div>
          <div className="mt-3 rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">📊 指標の見方:</span>
              {" "}FIP（守備非依存防御率）は被本塁打・与四球・奪三振のみから算出。ERAより投手の真の実力を反映。
              K/BB比は制球力の総合指標で、3.0以上がエリート級。LOB%は出塁を許した走者を返さなかった割合。
            </p>
          </div>
        </section>
      )}

      {/* Pitching Progress */}
      {pitchingLog.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {currentYear}シーズン 投球推移
          </h2>
          <PitchingProgressChart games={pitchingLog} />

          {/* Game-by-Game Table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 text-left font-medium">日付</th>
                  <th className="px-3 py-2 text-left font-medium">対戦</th>
                  <th className="px-3 py-2 text-center font-medium">結果</th>
                  <th className="px-3 py-2 text-right font-medium">IP</th>
                  <th className="px-3 py-2 text-right font-medium">K</th>
                  <th className="px-3 py-2 text-right font-medium">BB</th>
                  <th className="px-3 py-2 text-right font-medium">H</th>
                  <th className="px-3 py-2 text-right font-medium">ER</th>
                  <th className="px-3 py-2 text-right font-medium">ERA</th>
                </tr>
              </thead>
              <tbody>
                {pitchingLog.map((g, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{g.date}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{g.opponent}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        g.result === "W" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        g.result === "L" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {g.result}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{g.inningsPitched}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-dodger-blue">{g.strikeOuts}</td>
                    <td className="px-3 py-2 text-right font-mono">{g.baseOnBalls}</td>
                    <td className="px-3 py-2 text-right font-mono">{g.hits}</td>
                    <td className="px-3 py-2 text-right font-mono">{g.earnedRuns}</td>
                    <td className="px-3 py-2 text-right font-mono">{g.era}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* No Data */}
      {!pitching && (
        <section className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            投球データを取得できませんでした
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            投手として登板後にデータが表示されます
          </p>
        </section>
      )}
    </div>
  );
}
