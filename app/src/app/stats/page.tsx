import { getYearByYearStats } from "@/lib/mlb-api";
import StatsTable from "@/components/StatsTable";
import AutoRefresh from "@/components/AutoRefresh";
import type { BattingStats, PitchingStats } from "@/lib/types";

export const dynamic = "force-dynamic";

function computeBattingTotals(data: BattingStats[]): BattingStats {
  const totals = data.reduce(
    (acc, s) => ({
      gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
      atBats: acc.atBats + s.atBats,
      runs: acc.runs + s.runs,
      hits: acc.hits + s.hits,
      doubles: acc.doubles + s.doubles,
      triples: acc.triples + s.triples,
      homeRuns: acc.homeRuns + s.homeRuns,
      rbi: acc.rbi + s.rbi,
      stolenBases: acc.stolenBases + s.stolenBases,
      baseOnBalls: acc.baseOnBalls + s.baseOnBalls,
      strikeOuts: acc.strikeOuts + s.strikeOuts,
    }),
    { gamesPlayed: 0, atBats: 0, runs: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, stolenBases: 0, baseOnBalls: 0, strikeOuts: 0 }
  );

  const avg = totals.atBats > 0 ? (totals.hits / totals.atBats).toFixed(3) : ".000";
  const pa = totals.atBats + totals.baseOnBalls;
  const obp = pa > 0 ? (((totals.hits + totals.baseOnBalls) / pa)).toFixed(3) : ".000";
  const tb = totals.hits + totals.doubles + totals.triples * 2 + totals.homeRuns * 3;
  const slg = totals.atBats > 0 ? (tb / totals.atBats).toFixed(3) : ".000";
  const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);

  return {
    season: "通算",
    team: "-",
    league: "-",
    ...totals,
    avg,
    obp,
    slg,
    ops,
  };
}

function computePitchingTotals(data: PitchingStats[]): PitchingStats {
  const totals = data.reduce(
    (acc, s) => ({
      wins: acc.wins + s.wins,
      losses: acc.losses + s.losses,
      gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
      gamesStarted: acc.gamesStarted + s.gamesStarted,
      hits: acc.hits + s.hits,
      runs: acc.runs + s.runs,
      earnedRuns: acc.earnedRuns + s.earnedRuns,
      homeRuns: acc.homeRuns + s.homeRuns,
      baseOnBalls: acc.baseOnBalls + s.baseOnBalls,
      strikeOuts: acc.strikeOuts + s.strikeOuts,
      inningsTotal: acc.inningsTotal + parseInnings(s.inningsPitched),
    }),
    { wins: 0, losses: 0, gamesPlayed: 0, gamesStarted: 0, hits: 0, runs: 0, earnedRuns: 0, homeRuns: 0, baseOnBalls: 0, strikeOuts: 0, inningsTotal: 0 }
  );

  const ip = formatInnings(totals.inningsTotal);
  const era = totals.inningsTotal > 0 ? ((totals.earnedRuns / totals.inningsTotal) * 9).toFixed(2) : "0.00";
  const whip = totals.inningsTotal > 0 ? ((totals.hits + totals.baseOnBalls) / totals.inningsTotal).toFixed(2) : "0.00";
  const k9 = totals.inningsTotal > 0 ? ((totals.strikeOuts / totals.inningsTotal) * 9).toFixed(2) : "0.00";

  return {
    season: "通算",
    team: "-",
    league: "-",
    wins: totals.wins,
    losses: totals.losses,
    era,
    gamesPlayed: totals.gamesPlayed,
    gamesStarted: totals.gamesStarted,
    inningsPitched: ip,
    hits: totals.hits,
    runs: totals.runs,
    earnedRuns: totals.earnedRuns,
    homeRuns: totals.homeRuns,
    baseOnBalls: totals.baseOnBalls,
    strikeOuts: totals.strikeOuts,
    whip,
    strikeoutsPer9: k9,
  };
}

function parseInnings(ip: string): number {
  const parts = ip.split(".");
  const full = parseInt(parts[0] || "0", 10);
  const partial = parseInt(parts[1] || "0", 10);
  return full + partial / 3;
}

function formatInnings(totalInnings: number): string {
  const full = Math.floor(totalInnings);
  const partial = Math.round((totalInnings - full) * 3);
  return `${full}.${partial}`;
}

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

  const battingWithTotals = battingData.length > 0
    ? [...battingData, computeBattingTotals(battingData)]
    : battingData;

  const pitchingWithTotals = pitchingData.length > 0
    ? [...pitchingData, computePitchingTotals(pitchingData)]
    : pitchingData;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            通算成績
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            NPB・MLB全シーズンの打撃・投球成績
          </p>
        </div>
        <AutoRefresh intervalMs={300000} />
      </div>

      <StatsTable
        title="打撃成績（全シーズン）"
        columns={BATTING_COLUMNS}
        data={battingWithTotals}
        highlightKey="season"
        highlightValue="通算"
      />

      <StatsTable
        title="投球成績（全シーズン）"
        columns={PITCHING_COLUMNS}
        data={pitchingWithTotals}
        highlightKey="season"
        highlightValue="通算"
      />
    </div>
  );
}
