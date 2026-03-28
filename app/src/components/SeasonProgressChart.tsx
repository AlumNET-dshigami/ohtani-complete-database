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
import type { GameLogBatting } from "@/lib/types";

interface SeasonProgressChartProps {
  games: GameLogBatting[];
}

export default function SeasonProgressChart({ games }: SeasonProgressChartProps) {
  if (games.length === 0) return null;

  // Build cumulative HR data and running avg/OPS
  let cumulativeHR = 0;
  const chartData = games.map((g, i) => {
    cumulativeHR += g.homeRuns;
    return {
      game: i + 1,
      date: g.date,
      opponent: g.opponent,
      HR: cumulativeHR,
      AVG: parseFloat(g.avg) || 0,
      dailyHR: g.homeRuns,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cumulative HR chart */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          本塁打の推移（累積）
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#005A9C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#005A9C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11 }}
                label={{ value: "試合数", position: "insideBottomRight", offset: -5, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid #005A9C",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  if (name === "HR") return [`${value} 本`, "累積HR"];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const d = chartData.find((c) => c.game === label);
                  return d ? `第${label}試合 (${d.date}) ${d.opponent}` : `第${label}試合`;
                }}
              />
              <Area
                type="stepAfter"
                dataKey="HR"
                stroke="#005A9C"
                strokeWidth={2}
                fill="url(#hrGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#D4A843" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AVG progression */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          打率の推移
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11 }}
                label={{ value: "試合数", position: "insideBottomRight", offset: -5, fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={(v) => v.toFixed(3)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid #005A9C",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => {
                  if (typeof value === "number") return [value.toFixed(3), "打率"];
                  return [value, "打率"];
                }}
                labelFormatter={(label) => {
                  const d = chartData.find((c) => c.game === label);
                  return d ? `第${label}試合 (${d.date}) ${d.opponent}` : `第${label}試合`;
                }}
              />
              <Legend formatter={(value) => (value === "AVG" ? "打率" : value)} />
              <Line
                type="monotone"
                dataKey="AVG"
                stroke="#D4A843"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#D4A843" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
