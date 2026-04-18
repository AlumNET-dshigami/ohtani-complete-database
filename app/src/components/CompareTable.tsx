import type { PlayerSummary } from "@/lib/mlb-players";

interface CompareTableProps {
  players: PlayerSummary[];
  mode: "batting" | "pitching";
}

interface StatRow {
  key: string;
  label: string;
  higherBetter: boolean;
  format?: (v: string | number) => string;
}

const BATTING_ROWS: StatRow[] = [
  { key: "gamesPlayed", label: "試合", higherBetter: true },
  { key: "avg", label: "打率", higherBetter: true },
  { key: "homeRuns", label: "本塁打", higherBetter: true },
  { key: "rbi", label: "打点", higherBetter: true },
  { key: "runs", label: "得点", higherBetter: true },
  { key: "hits", label: "安打", higherBetter: true },
  { key: "stolenBases", label: "盗塁", higherBetter: true },
  { key: "baseOnBalls", label: "四球", higherBetter: true },
  { key: "strikeOuts", label: "三振", higherBetter: false },
  { key: "obp", label: "出塁率", higherBetter: true },
  { key: "slg", label: "長打率", higherBetter: true },
  { key: "ops", label: "OPS", higherBetter: true },
];

const PITCHING_ROWS: StatRow[] = [
  { key: "gamesStarted", label: "先発", higherBetter: true },
  { key: "wins", label: "勝利", higherBetter: true },
  { key: "losses", label: "敗戦", higherBetter: false },
  { key: "era", label: "ERA", higherBetter: false },
  { key: "inningsPitched", label: "IP", higherBetter: true },
  { key: "strikeOuts", label: "奪三振", higherBetter: true },
  { key: "baseOnBalls", label: "与四球", higherBetter: false },
  { key: "hits", label: "被安打", higherBetter: false },
  { key: "homeRuns", label: "被HR", higherBetter: false },
  { key: "whip", label: "WHIP", higherBetter: false },
  { key: "strikeoutsPer9", label: "K/9", higherBetter: true },
];

function parseValue(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return 0;
}

export default function CompareTable({ players, mode }: CompareTableProps) {
  const rows = mode === "batting" ? BATTING_ROWS : PITCHING_ROWS;
  const activePlayers = players.filter((p) =>
    mode === "batting"
      ? p.batting && p.batting.atBats > 0
      : p.pitching && parseFloat(p.pitching.inningsPitched) > 0
  );

  if (activePlayers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {mode === "batting" ? "打撃" : "投手"}成績のあるデータなし
        </p>
      </div>
    );
  }

  // Find best value per row for highlighting
  const bestByRow = new Map<string, number>();
  for (const row of rows) {
    const values = activePlayers
      .map((p) => {
        const stat = mode === "batting" ? p.batting : p.pitching;
        if (!stat) return null;
        return parseValue((stat as unknown as Record<string, unknown>)[row.key]);
      })
      .filter((v): v is number => v !== null && !isNaN(v));
    if (values.length === 0) continue;
    bestByRow.set(row.key, row.higherBetter ? Math.max(...values) : Math.min(...values));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-gradient-to-r from-dodger-blue/10 to-transparent">
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-3 py-3 text-left font-bold text-gray-700 dark:text-gray-300">
              指標
            </th>
            {activePlayers.map((p) => (
              <th
                key={p.id}
                className={`min-w-[120px] px-3 py-3 text-center font-bold ${
                  p.id === 660271
                    ? "text-dodger-blue"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.headshotUrl}
                      alt={p.fullName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-xs truncate max-w-[100px]">
                    {p.nameJa ?? p.fullName}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const best = bestByRow.get(row.key);
            return (
              <tr
                key={row.key}
                className="border-b border-border last:border-b-0 hover:bg-surface-alt/50"
              >
                <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                  {row.label}
                </td>
                {activePlayers.map((p) => {
                  const stat = mode === "batting" ? p.batting : p.pitching;
                  if (!stat) {
                    return (
                      <td key={p.id} className="px-3 py-2 text-center text-gray-300">
                        -
                      </td>
                    );
                  }
                  const rawValue = (stat as unknown as Record<string, unknown>)[row.key];
                  const numValue = parseValue(rawValue);
                  const isBest = best !== undefined && Math.abs(numValue - best) < 0.001;
                  const displayValue = String(rawValue ?? "-");

                  return (
                    <td
                      key={p.id}
                      className={`px-3 py-2 text-center font-mono ${
                        isBest
                          ? "bg-accent-gold/15 font-bold text-accent-gold"
                          : p.id === 660271
                          ? "font-semibold text-dodger-blue"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
