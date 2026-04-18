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
  ReferenceLine,
} from "recharts";
import type { WARChartEntry } from "@/lib/types";

interface WARChartProps {
  data: WARChartEntry[];
}

export default function WARChart({ data }: WARChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
        WAR推移
      </h3>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        fWAR（<a href="https://www.fangraphs.com/leaders/war" target="_blank" rel="noopener noreferrer" className="underline hover:text-dodger-blue">FanGraphs</a>） / bWAR（Baseball-Reference） — 今季進行中は推定値
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="season" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[-1, 11]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid #005A9C",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number | undefined, name: string | undefined) => {
                if (value === null || value === undefined) return ["-", name ?? ""];
                const labels: Record<string, string> = {
                  bWAR: "bWAR (B-Ref)",
                  fWAR: "fWAR (FanGraphs)",
                  estimate: "推定値",
                };
                return [value.toFixed(1), labels[name ?? ""] ?? name ?? ""];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  bWAR: "bWAR (Baseball-Ref)",
                  fWAR: "fWAR (FanGraphs)",
                  estimate: "推定値（今季）",
                };
                return labels[value] ?? value;
              }}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <ReferenceLine y={0} stroke="#888" />
            <Line
              type="monotone"
              dataKey="bWAR"
              stroke="#005A9C"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#005A9C" }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="fWAR"
              stroke="#EF3E42"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#EF3E42" }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="estimate"
              stroke="#F5A623"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: "#F5A623" }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
        ※ データソース: FanGraphs / Baseball-Reference（過去シーズン）、今季はOPS/ERAからの簡易推定
      </p>
    </div>
  );
}
