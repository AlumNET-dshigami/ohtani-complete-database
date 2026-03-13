"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeasonStats } from "@/lib/types";

interface OpsChartProps {
  data: SeasonStats[];
}

export default function OpsChart({ data }: OpsChartProps) {
  const chartData = data
    .filter((s) => s.batting)
    .map((s) => ({
      season: s.season,
      OPS: parseFloat(s.batting!.ops),
      OBP: parseFloat(s.batting!.obp),
      SLG: parseFloat(s.batting!.slg),
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        OPS推移
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="opsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#005A9C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#005A9C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="season" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid #005A9C",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="OPS"
              stroke="#005A9C"
              fill="url(#opsGradient)"
              strokeWidth={2}
              dot={{ r: 4, fill: "#005A9C" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
