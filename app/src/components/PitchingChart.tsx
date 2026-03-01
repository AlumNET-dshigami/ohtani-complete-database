"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SeasonStats } from "@/lib/types";

interface PitchingChartProps {
  data: SeasonStats[];
}

export default function PitchingChart({ data }: PitchingChartProps) {
  const chartData = data
    .filter((s) => s.pitching)
    .map((s) => ({
      season: s.season,
      防御率: parseFloat(s.pitching!.era),
      奪三振: s.pitching!.strikeOuts,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-xl border border-dodger-blue/15 bg-white p-6 dark:border-dodger-blue/25 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        シーズン別投球成績
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="season" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="era" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="so" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #005A9C",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              yAxisId="era"
              type="monotone"
              dataKey="防御率"
              stroke="#EF3E42"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="so"
              type="monotone"
              dataKey="奪三振"
              stroke="#005A9C"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
