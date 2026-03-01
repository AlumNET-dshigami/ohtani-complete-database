"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SeasonStats } from "@/lib/types";

interface HrChartProps {
  data: SeasonStats[];
}

export default function HrChart({ data }: HrChartProps) {
  const chartData = data
    .filter((s) => s.batting)
    .map((s) => ({
      season: s.season,
      HR: s.batting!.homeRuns,
      打率: parseFloat(s.batting!.avg),
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-xl border border-dodger-blue/15 bg-white p-6 dark:border-dodger-blue/25 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        シーズン別ホームラン数
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="season" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #005A9C",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="HR" fill="#005A9C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
