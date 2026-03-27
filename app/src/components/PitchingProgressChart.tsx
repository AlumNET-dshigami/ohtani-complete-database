"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GameLogPitching } from "@/lib/types";

interface PitchingProgressChartProps {
  games: GameLogPitching[];
}

export default function PitchingProgressChart({ games }: PitchingProgressChartProps) {
  if (games.length === 0) return null;

  let cumulativeSO = 0;
  const chartData = games.map((g, i) => {
    cumulativeSO += g.strikeOuts;
    return {
      game: i + 1,
      date: g.date,
      opponent: g.opponent,
      result: g.result,
      ERA: parseFloat(g.era) || 0,
      SO: cumulativeSO,
      dailySO: g.strikeOuts,
      IP: g.inningsPitched,
    };
  });

  return (
    <div className="space-y-6">
      {/* ERA progression */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          防御率（ERA）の推移
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11 }}
                label={{ value: "登板数", position: "insideBottomRight", offset: -5, fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid #EF3E42",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => {
                  if (typeof value === "number") return [value.toFixed(2), "防御率"];
                  return [value, "防御率"];
                }}
                labelFormatter={(label) => {
                  const d = chartData.find((c) => c.game === label);
                  if (!d) return `第${label}登板`;
                  return `第${label}登板 (${d.date}) ${d.opponent} [${d.result}] ${d.IP}回`;
                }}
              />
              <Legend formatter={(value) => (value === "ERA" ? "防御率" : value)} />
              <Line
                type="monotone"
                dataKey="ERA"
                stroke="#EF3E42"
                strokeWidth={2}
                dot={{ r: 3, fill: "#EF3E42" }}
                activeDot={{ r: 5, fill: "#EF3E42" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative strikeouts */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          奪三振の推移（累積）
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="soGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF3E42" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF3E42" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11 }}
                label={{ value: "登板数", position: "insideBottomRight", offset: -5, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid #EF3E42",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => {
                  return [`${value} K`, "累積奪三振"];
                }}
                labelFormatter={(label) => {
                  const d = chartData.find((c) => c.game === label);
                  if (!d) return `第${label}登板`;
                  return `第${label}登板 (${d.date}) ${d.opponent}`;
                }}
              />
              <Area
                type="monotone"
                dataKey="SO"
                stroke="#EF3E42"
                strokeWidth={2}
                fill="url(#soGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#EF3E42" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
