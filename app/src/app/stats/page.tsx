import { getYearByYearStats } from "@/lib/mlb-api";
import StatsTable from "@/components/StatsTable";
import type { BattingStats, PitchingStats } from "@/lib/types";

export const dynamic = "force-dynamic";

const BATTING_COLUMNS: { key: keyof BattingStats; label: string }[] = [
  { key: "season", label: "年度" },
  { key: "team", label: "チーム" },
  { key: "gamesPlayed", label: "試合" },
  { key: "atBats", label: "打数" },
  { key: "hits", label: "安打" },
  { key: "doubles", label: "二塁打" },
  { key: "triples", label: "三塁打" },
  { key: "homeRuns", label: "本塁打" },
  { key: "rbi", label: "打点" },
  { key: "runs", label: "得点" },
  { key: "stolenBases", label: "盗塁" },
  { key: "baseOnBalls", label: "四球" },
  { key: "strikeOuts", label: "三振" },
  { key: "avg", label: "打率" },
  { key: "obp", label: "出塁率" },
  { key: "slg", label: "長打率" },
  { key: "ops", label: "OPS" },
];

const PITCHING_COLUMNS: { key: keyof PitchingStats; label: string }[] = [
  { key: "season", label: "年度" },
  { key: "team", label: "チーム" },
  { key: "wins", label: "勝" },
  { key: "losses", label: "敗" },
  { key: "era", label: "防御率" },
  { key: "gamesPlayed", label: "登板" },
  { key: "gamesStarted", label: "先発" },
  { key: "inningsPitched", label: "投球回" },
  { key: "hits", label: "被安打" },
  { key: "earnedRuns", label: "自責点" },
  { key: "homeRuns", label: "被本塁打" },
  { key: "baseOnBalls", label: "四球" },
  { key: "strikeOuts", label: "奪三振" },
  { key: "whip", label: "WHIP" },
  { key: "strikeoutsPer9", label: "K/9" },
];

export default async function StatsPage() {
  const allStats = await getYearByYearStats();

  const battingData = allStats
    .filter((s) => s.batting)
    .map((s) => s.batting!);

  const pitchingData = allStats
    .filter((s) => s.pitching)
    .map((s) => s.pitching!);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          通算成績
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          NPB・MLB全シーズンの打撃・投球成績
        </p>
      </div>

      <StatsTable
        title="打撃成績（全シーズン）"
        columns={BATTING_COLUMNS}
        data={battingData}
      />

      <StatsTable
        title="投球成績（全シーズン）"
        columns={PITCHING_COLUMNS}
        data={pitchingData}
      />
    </div>
  );
}
