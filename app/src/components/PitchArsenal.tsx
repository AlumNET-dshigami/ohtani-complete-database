"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PitchTypeEntry } from "@/lib/statcast-api";
import { getJapanesePitchName } from "@/lib/statcast-api";

interface PitchArsenalProps {
  data: PitchTypeEntry[];
}

const PITCH_COLORS: Record<string, string> = {
  FF: "#EF4444",
  SI: "#F97316",
  FC: "#EAB308",
  SL: "#22C55E",
  CU: "#3B82F6",
  CH: "#8B5CF6",
  FS: "#EC4899",
  KC: "#06B6D4",
  ST: "#10B981",
  SV: "#10B981",
  KN: "#6B7280",
};

export default function PitchArsenal({ data }: PitchArsenalProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          球種構成
        </h3>
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          球種データはまだ集計されていません
        </div>
        <p className="mt-2 text-center text-[10px] text-gray-400">
          ※ Baseball Savantのリーダーボード集計後に表示されます（通常シーズン開幕後数試合）
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: getJapanesePitchName(d.pitchType),
    code: d.pitchType,
    percentage: Math.round(d.percentage * 10) / 10,
    speed: d.avgSpeed,
    ba: d.ba,
    slg: d.slg,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        球種構成
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              domain={[0, "auto"]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid #005A9C",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number | undefined, _name: string | undefined, props: { payload?: { speed?: string; ba?: string } }) => {
                const speed = props?.payload?.speed ?? "-";
                const ba = props?.payload?.ba ?? "-";
                return [`${value ?? 0}% (${speed} km/h, 被打率: ${ba})`, "使用率"];
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.code}
                  fill={PITCH_COLORS[entry.code] ?? "#6B7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-gray-500 dark:text-gray-400">
              <th className="px-2 py-1.5 text-left font-medium">球種</th>
              <th className="px-2 py-1.5 text-right font-medium">使用率</th>
              <th className="px-2 py-1.5 text-right font-medium">平均球速</th>
              <th className="px-2 py-1.5 text-right font-medium">被打率</th>
              <th className="px-2 py-1.5 text-right font-medium">被長打率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.pitchType} className="border-b border-border/50">
                <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200">
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PITCH_COLORS[d.pitchType] ?? "#6B7280" }}
                  />
                  {getJapanesePitchName(d.pitchType)}
                  <span className="ml-1 text-gray-400">({d.pitchType})</span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono">{d.percentage.toFixed(1)}%</td>
                <td className="px-2 py-1.5 text-right font-mono">{d.avgSpeed}</td>
                <td className="px-2 py-1.5 text-right font-mono">{d.ba}</td>
                <td className="px-2 py-1.5 text-right font-mono">{d.slg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ データはBaseball Savant (Statcast) より取得
      </p>
    </div>
  );
}
