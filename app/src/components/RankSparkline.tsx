"use client";

import {
  LineChart,
  Line,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface SparklinePoint {
  date: string;
  rank: number | null;
}

interface RankSparklineProps {
  data: SparklinePoint[];
  /** 表示幅（px）。デフォルト 100 */
  width?: number;
  /** 表示高さ（px）。デフォルト 40 */
  height?: number;
}

const OHTANI_COLOR = "#f97316"; // orange-500（大谷カラー）

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function RankSparkline({ data, width = 100, height = 40 }: RankSparklineProps) {
  // null ランクを除外して有効なポイントのみ
  const validPoints = data.filter((p): p is { date: string; rank: number } => p.rank !== null);

  if (validPoints.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-gray-400"
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  // Y軸: 1位が上になるよう反転（rank=1が最大値として扱う）
  const ranks = validPoints.map((p) => p.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  // 少しパディングを加える
  const yMin = Math.max(1, minRank - 1);
  const yMax = maxRank + 1;

  // 最新のランク（右端）
  const latestRank = validPoints[validPoints.length - 1].rank;
  const isFirst = latestRank === 1;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validPoints} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis
            domain={[yMin, yMax]}
            reversed // 1位が上
            hide
          />
          {/* 1位ライン */}
          <ReferenceLine y={1} stroke="rgba(249,115,22,0.2)" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface, #1e293b)",
              border: "1px solid rgba(249,115,22,0.4)",
              borderRadius: "6px",
              fontSize: "11px",
              padding: "4px 8px",
            }}
            labelFormatter={(_, payload) => {
              const d = payload?.[0]?.payload?.date;
              return d ? formatDate(d) : "";
            }}
            formatter={(value: number | undefined) => [`${value ?? "-"}位`, "順位"]}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke={isFirst ? "#f59e0b" : OHTANI_COLOR}
            strokeWidth={1.5}
            dot={(props) => {
              // 最後のポイントのみドット表示
              const { cx, cy, index } = props;
              if (index !== validPoints.length - 1) return <g key={`dot-${index}`} />;
              return (
                <circle
                  key={`dot-last-${index}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={isFirst ? "#f59e0b" : OHTANI_COLOR}
                  stroke="white"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 4, fill: OHTANI_COLOR }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
