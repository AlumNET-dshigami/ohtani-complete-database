"use client";

import { useState } from "react";
import type { TwoWayStats } from "@/lib/two-way-games";

interface Props {
  stats: TwoWayStats;
  currentYear: number;
}

type FilterMode = "all" | "twoWay" | "pureHitter";

interface StatRow {
  label: string;
  twoWay: string | number;
  pureHitter: string | number;
  all?: string | number;
}

export default function TwoWayFilter({ stats, currentYear }: Props) {
  const [mode, setMode] = useState<FilterMode>("all");

  const totalGames = stats.twoWayGames + stats.pureHitterGames;

  const statRows: StatRow[] = [
    {
      label: "打率",
      twoWay: stats.twoWayAvg,
      pureHitter: stats.pureHitterAvg,
    },
    {
      label: "OPS（簡易）",
      twoWay: stats.twoWayOps,
      pureHitter: stats.pureHitterOps,
    },
    {
      label: "本塁打",
      twoWay: stats.twoWayHR,
      pureHitter: stats.pureHitterHR,
      all: stats.twoWayHR + stats.pureHitterHR,
    },
    {
      label: "打点",
      twoWay: stats.twoWayRBI,
      pureHitter: stats.pureHitterRBI,
      all: stats.twoWayRBI + stats.pureHitterRBI,
    },
  ];

  function getDisplayValue(row: StatRow): string | number {
    if (mode === "twoWay") return row.twoWay;
    if (mode === "pureHitter") return row.pureHitter;
    return row.all ?? "—";
  }

  const displayGames =
    mode === "all"
      ? totalGames
      : mode === "twoWay"
      ? stats.twoWayGames
      : stats.pureHitterGames;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          二刀流試合フィルター — {currentYear}シーズン
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          同じ日に打者 AND 投手として出場した試合を「二刀流試合」として分類
        </p>
      </div>

      {/* Summary */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 dark:from-blue-950/20 dark:to-indigo-950/20">
          <span className="text-lg">⚔️</span>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">二刀流試合</p>
            <p className="text-xl font-black text-dodger-blue">
              {stats.twoWayGames}
              <span className="ml-0.5 text-xs font-normal text-gray-400">試合</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/40">
          <span className="text-lg">🏏</span>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">純打者試合</p>
            <p className="text-xl font-black text-gray-700 dark:text-gray-300">
              {stats.pureHitterGames}
              <span className="ml-0.5 text-xs font-normal text-gray-400">試合</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/40">
          <span className="text-lg">📊</span>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">総試合数</p>
            <p className="text-xl font-black text-gray-700 dark:text-gray-300">
              {totalGames}
              <span className="ml-0.5 text-xs font-normal text-gray-400">試合</span>
            </p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="mb-4 flex rounded-xl border border-border p-1 bg-gray-50 dark:bg-gray-800/40">
        {(["all", "twoWay", "pureHitter"] as FilterMode[]).map((m) => {
          const labels: Record<FilterMode, string> = {
            all: "全試合",
            twoWay: "二刀流試合のみ",
            pureHitter: "純打者試合のみ",
          };
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white shadow-sm text-dodger-blue dark:bg-gray-700 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Stats display */}
      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        表示: {displayGames} 試合
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statRows.map((row) => {
          const val = getDisplayValue(row);
          return (
            <div
              key={row.label}
              className="rounded-xl border border-border bg-white p-3 text-center dark:bg-gray-800"
            >
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {row.label}
              </p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                {val}
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                指標
              </th>
              <th className="px-3 py-2 text-center font-semibold text-dodger-blue">
                ⚔️ 二刀流 ({stats.twoWayGames}試合)
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-300">
                🏏 純打者 ({stats.pureHitterGames}試合)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {statRows.map((row) => {
              const twVal = Number(row.twoWay) || 0;
              const phVal = Number(row.pureHitter) || 0;
              const twoWayBetter = twVal >= phVal;
              return (
                <tr
                  key={row.label}
                  className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-gray-800/20"
                >
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                    {row.label}
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-bold ${
                      twoWayBetter
                        ? "text-dodger-blue"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {row.twoWay}
                    {twoWayBetter && (
                      <span className="ml-1 text-[9px] text-green-500">▲</span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-bold ${
                      !twoWayBetter
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {row.pureHitter}
                    {!twoWayBetter && (
                      <span className="ml-1 text-[9px] text-green-500">▲</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stats.twoWayGames === 0 && (
        <p className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
          {new Date().getFullYear()}シーズンの二刀流試合はまだありません
        </p>
      )}

      <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500">
        ※ OPSは簡易計算値（塁打数を HR×4 + 安打で近似）。打率は実測値。
        データはMLB Stats API ゲームログより取得（1時間キャッシュ）。
      </p>
    </div>
  );
}
