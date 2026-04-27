"use client";

import type { HotColdZoneCategory } from "@/lib/statcast-api";
import { useState } from "react";

interface ZoneHeatMapProps {
  categories: HotColdZoneCategory[];
  title: string;
}

const STAT_LABELS: Record<string, string> = {
  battingAverage: "打率 (AVG)",
  onBasePlusSlugging: "OPS",
  sluggingPercentage: "長打率 (SLG)",
  onBasePercentage: "出塁率 (OBP)",
  homeRuns: "本塁打 (HR)",
  exitVelocity: "打球速度",
};

const ZONE_POSITIONS: Record<string, { row: number; col: number }> = {
  "01": { row: 0, col: 0 },
  "02": { row: 0, col: 1 },
  "03": { row: 0, col: 2 },
  "04": { row: 1, col: 0 },
  "05": { row: 1, col: 1 },
  "06": { row: 1, col: 2 },
  "07": { row: 2, col: 0 },
  "08": { row: 2, col: 1 },
  "09": { row: 2, col: 2 },
};

function parseRgbaOpacity(color: string): number {
  const match = color.match(/rgba?\([\d\s,]+,\s*([\d.]+)\)/);
  return match ? parseFloat(match[1]) : 0.3;
}

function getHeatColor(temp: string, value: string): string {
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return "bg-gray-200 dark:bg-gray-700";

  if (temp === "hot") return "bg-red-500/70";
  if (temp === "cold") return "bg-blue-500/70";
  return "bg-gray-300/50 dark:bg-gray-600/50";
}

function getHeatBg(color: string, temp: string): string {
  if (color && color.startsWith("rgba")) {
    const opacity = parseRgbaOpacity(color);
    if (temp === "hot" || opacity > 0.4) {
      return `rgba(220, 38, 38, ${Math.min(opacity + 0.2, 0.9)})`;
    }
    if (temp === "cold") {
      return `rgba(59, 130, 246, ${Math.min(opacity + 0.2, 0.9)})`;
    }
    return `rgba(156, 163, 175, ${opacity})`;
  }
  return "rgba(156, 163, 175, 0.3)";
}

export default function ZoneHeatMap({ categories, title }: ZoneHeatMapProps) {
  const availableStats = categories.map((c) => c.statName);
  const [selectedStat, setSelectedStat] = useState(availableStats[0] ?? "battingAverage");

  const category = categories.find((c) => c.statName === selectedStat);

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          ゾーンデータを取得できませんでした
        </div>
      </div>
    );
  }

  const strikeZoneZones = category?.zones.filter((z) => ZONE_POSITIONS[z.zone]) ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>

      {availableStats.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {availableStats.map((stat) => (
            <button
              key={stat}
              onClick={() => setSelectedStat(stat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedStat === stat
                  ? "bg-dodger-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {STAT_LABELS[stat] ?? stat}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="mb-1 text-center text-[10px] text-gray-400">
            ← インコース　　　アウトコース →
          </div>

          <div className="grid grid-cols-3 gap-0.5 rounded-lg border-2 border-gray-400 dark:border-gray-500 p-0.5">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => {
                const zoneNum = String(row * 3 + col + 1).padStart(2, "0");
                const zoneData = strikeZoneZones.find((z) => z.zone === zoneNum);
                const value = zoneData?.value ?? "-";
                const bgColor = zoneData
                  ? getHeatBg(zoneData.color, zoneData.temp)
                  : "rgba(156, 163, 175, 0.2)";

                return (
                  <div
                    key={zoneNum}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded transition-transform hover:scale-105 sm:h-24 sm:w-24"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="text-lg font-bold text-white drop-shadow-md sm:text-xl">
                      {value}
                    </span>
                    <span className="text-[9px] text-white/70 drop-shadow">
                      Zone {zoneNum}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-red-500/70" />
              <span>ホット</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-gray-300/70" />
              <span>平均</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-blue-500/70" />
              <span>コールド</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ ストライクゾーンを9分割した{STAT_LABELS[selectedStat] ?? selectedStat}（MLB公式APIより）
      </p>
    </div>
  );
}
