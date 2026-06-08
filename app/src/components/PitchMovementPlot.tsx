"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

/** pitch-movement.json のピッチエントリ */
export interface PitchMovementEntry {
  pfx_x_avg: number;
  pfx_z_avg: number;
  speed_avg: number;
  spin_avg: number | null;
  count: number;
  label: string;
}

export interface PitchMovementData {
  season: number;
  generatedAt: string;
  totalPitches: number;
  pitches: Record<string, PitchMovementEntry>;
}

interface Props {
  data: PitchMovementData;
}

/** 球種ごとのカラーマッピング */
const PITCH_COLORS: Record<string, string> = {
  FF: "#1E4AC5", // 4シーム: ドジャーブルー
  SI: "#3B82F6", // シンカー: 青
  FC: "#06B6D4", // カット: シアン
  CH: "#F59E0B", // チェンジアップ: アンバー
  SL: "#10B981", // スライダー: グリーン
  ST: "#22C55E", // スウィーパー: 明るいグリーン
  CU: "#8B5CF6", // カーブ: パープル
  KC: "#A855F7", // ナックルカーブ: バイオレット
  FS: "#EF4444", // スプリット: レッド
  EP: "#F97316", // エフューズ: オレンジ
  KN: "#6B7280", // ナックル: グレー
  CS: "#EC4899", // スローカーブ: ピンク
};

function getColor(pitchType: string): string {
  return PITCH_COLORS[pitchType] ?? "#6B7280";
}

/** 球速をバブルサイズに変換（min 40, max 120） */
function speedToSize(speed: number): number {
  const min = 70;
  const max = 100;
  const normalized = Math.min(1, Math.max(0, (speed - min) / (max - min)));
  return Math.round(40 + normalized * 80);
}

interface ScatterPoint {
  x: number;
  y: number;
  size: number;
  pitchType: string;
  label: string;
  speed: number;
  spin: number | null;
  count: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-lg dark:bg-gray-800">
      <p className="font-bold text-gray-900 dark:text-white">
        {d.label} ({d.pitchType})
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        水平変化: {d.x > 0 ? "+" : ""}{d.x.toFixed(1)} in
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        垂直変化: {d.y > 0 ? "+" : ""}{d.y.toFixed(1)} in
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        平均球速: {d.speed.toFixed(1)} mph
      </p>
      {d.spin !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          回転数: {d.spin?.toLocaleString()} rpm
        </p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        サンプル: {d.count.toLocaleString()} 球
      </p>
    </div>
  );
}

export default function PitchMovementPlot({ data }: Props) {
  const points: ScatterPoint[] = Object.entries(data.pitches).map(
    ([pt, entry]) => ({
      x: entry.pfx_x_avg,
      y: entry.pfx_z_avg,
      size: speedToSize(entry.speed_avg),
      pitchType: pt,
      label: entry.label,
      speed: entry.speed_avg,
      spin: entry.spin_avg,
      count: entry.count,
    })
  );

  // x / y の範囲を自動計算（余白20%）
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.floor(Math.min(...xs) - 5);
  const xMax = Math.ceil(Math.max(...xs) + 5);
  const yMin = Math.floor(Math.min(...ys) - 5);
  const yMax = Math.ceil(Math.max(...ys) + 5);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            球種変化量マップ（{data.season}）
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.totalPitches.toLocaleString()} 球のデータ / 点の大きさ = 球速
          </p>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          出典: Baseball Savant (Statcast)
        </p>
      </div>

      {/* Axis labels */}
      <div className="relative">
        <p className="mb-1 text-center text-[10px] text-gray-400">
          垂直変化量 (in) ↑
        </p>
        <div className="flex items-center gap-1">
          <p
            className="text-[10px] text-gray-400"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", minWidth: 16 }}
          >
            ← 捕手視点 左（スライド方向）
          </p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart
                margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[xMin, xMax]}
                  tickCount={7}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  label={{
                    value: "水平変化量 (in)",
                    position: "insideBottom",
                    offset: -15,
                    fontSize: 10,
                    fill: "#9CA3AF",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yMin, yMax]}
                  tickCount={7}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                {/* ゼロ基準線（点線） */}
                <ReferenceLine
                  x={0}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  y={0}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={points} dataKey="y">
                  {points.map((p) => (
                    <Cell
                      key={p.pitchType}
                      fill={getColor(p.pitchType)}
                      fillOpacity={0.85}
                      stroke={getColor(p.pitchType)}
                      strokeWidth={2}
                      r={Math.sqrt(p.size / Math.PI) + 8}
                    />
                  ))}
                  <LabelList
                    dataKey="label"
                    position="top"
                    style={{ fontSize: 10, fontWeight: "bold", fill: "#374151" }}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* pfx_x は捕手視点。プラス=捕手右=右投手シュート方向、マイナス=捕手左=スライド方向 */}
        <p className="text-center text-[10px] text-gray-400">
          ← 捕手視点 左（スライド方向）　　　右（シュート方向）→
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {points
          .sort((a, b) => b.count - a.count)
          .map((p) => (
            <div
              key={p.pitchType}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1"
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: getColor(p.pitchType) }}
              />
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                {p.label}
              </span>
              <span className="text-[10px] text-gray-400">
                {p.speed.toFixed(1)}mph・{p.count}球
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
