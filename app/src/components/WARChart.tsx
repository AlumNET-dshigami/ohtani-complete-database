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
  ReferenceLine,
} from "recharts";
import type { CareerWAREntry } from "@/lib/sabermetrics";

interface WARChartProps {
  data: CareerWAREntry[];
}

export default function WARChart({ data }: WARChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        WAR推移（推定値）
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="season" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid #005A9C",
                borderRadius: "8px",
              }}
              formatter={(value: number | undefined, name: string | undefined) => {
                const labels: Record<string, string> = {
                  battingWAR: "打撃WAR",
                  pitchingWAR: "投球WAR",
                };
                return [(value ?? 0).toFixed(1), labels[name ?? ""] ?? name ?? ""];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  battingWAR: "打撃WAR",
                  pitchingWAR: "投球WAR",
                };
                return labels[value] ?? value;
              }}
            />
            <ReferenceLine y={0} stroke="#888" />
            <Bar
              dataKey="battingWAR"
              stackId="war"
              fill="#005A9C"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pitchingWAR"
              stackId="war"
              fill="#EF3E42"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
        ※ WAR値はOPS・ERA等から簡易推定した参考値です
      </p>
    </div>
  );
}
