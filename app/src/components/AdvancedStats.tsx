"use client";

import { useState } from "react";

interface StatItem {
  label: string;
  value: string;
  desc: string;
  highlight?: boolean;
}

interface AdvancedStatsProps {
  battingStats: StatItem[];
  pitchingStats: StatItem[];
}

export default function AdvancedStats({ battingStats, pitchingStats }: AdvancedStatsProps) {
  const [tab, setTab] = useState<"batting" | "pitching">("batting");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const stats = tab === "batting" ? battingStats : pitchingStats;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          セイバーメトリクス
        </h2>
        <div className="flex rounded-lg border border-border bg-surface-alt p-0.5">
          <button
            onClick={() => setTab("batting")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "batting"
                ? "bg-dodger-blue text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            打撃
          </button>
          <button
            onClick={() => setTab("pitching")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "pitching"
                ? "bg-dodger-blue text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            投球
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`group relative rounded-xl border p-3 transition-all ${
              stat.highlight
                ? "border-accent-gold/40 bg-surface ring-1 ring-accent-gold/20"
                : "border-border bg-surface hover:border-dodger-blue/30"
            }`}
            onMouseEnter={() => setShowTooltip(stat.label)}
            onMouseLeave={() => setShowTooltip(null)}
            onTouchStart={() => setShowTooltip(showTooltip === stat.label ? null : stat.label)}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-dodger-blue">
              {stat.label}
            </p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${
              stat.highlight ? "gradient-text" : "text-gray-900 dark:text-white"
            }`}>
              {stat.value}
            </p>

            {/* Tooltip */}
            {showTooltip === stat.label && (
              <div className="absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-surface p-2 text-xs text-gray-600 shadow-lg dark:text-gray-300">
                {stat.desc}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
