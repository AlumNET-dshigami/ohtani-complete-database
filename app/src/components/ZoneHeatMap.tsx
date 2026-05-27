"use client";

import type { HotColdZoneCategory } from "@/lib/statcast-api";
import { useMemo, useState } from "react";

/** zone-xwoba.json の1ゾーン分の型 */
export interface ZoneXwobaEntry {
  xwoba: number | null;
  barrelRate: number | null;
  pitches: number;
  battedBalls: number;
  barrels: number;
}

/** zone-xwoba.json のルート型 */
export interface ZoneXwobaData {
  fetchedAt: string;
  season: number;
  zones: Record<string, ZoneXwobaEntry>;
}

interface ZoneHeatMapProps {
  categories: HotColdZoneCategory[];
  title: string;
  /** zone-xwoba.json から読み込んだStatcastデータ（オプション） */
  zoneXwoba?: ZoneXwobaData | null;
}

const STAT_LABELS: Record<string, string> = {
  battingAverage: "打率",
  onBasePlusSlugging: "OPS",
  sluggingPercentage: "長打率",
  onBasePercentage: "出塁率",
  homeRuns: "本塁打",
  exitVelocity: "打球速度",
  // Statcast拡張タブ
  xwoba: "xwOBA",
  barrelRate: "バレル率",
};

const STAT_SHORT: Record<string, string> = {
  battingAverage: "AVG",
  onBasePlusSlugging: "OPS",
  sluggingPercentage: "SLG",
  onBasePercentage: "OBP",
  homeRuns: "HR",
  exitVelocity: "EV",
  xwoba: "xwOBA",
  barrelRate: "Barrel%",
};

/** Statcast拡張タブのキー */
const STATCAST_TABS = ["xwoba", "barrelRate"] as const;
type StatcastTab = (typeof STATCAST_TABS)[number];

// ボールゾーン: 11=左上, 12=右上, 13=左下, 14=右下
// レイアウト:
//   [11][1 ][2 ][3 ][12]
//   [  ][4 ][5 ][6 ][  ]
//   [  ][7 ][8 ][9 ][  ]
//   [13][  ][  ][  ][14]
const BALL_ZONE_CORNERS: Record<string, { gridRow: number; gridCol: number }> = {
  "11": { gridRow: 0, gridCol: 0 },
  "12": { gridRow: 0, gridCol: 4 },
  "13": { gridRow: 3, gridCol: 0 },
  "14": { gridRow: 3, gridCol: 4 },
};

function parseValue(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function getHeatStyle(color: string, temp: string): string {
  // MLBのAPI colorをそのまま使う。ない場合はtempで補完
  if (color && color.startsWith("rgba")) {
    return color;
  }
  if (temp === "hot") return "rgba(220, 38, 38, 0.65)";
  if (temp === "cold") return "rgba(59, 130, 246, 0.65)";
  return "rgba(156, 163, 175, 0.3)";
}

function getBallZoneStyle(color: string, temp: string): string {
  // ボールゾーンは少し薄めに
  if (color && color.startsWith("rgba")) {
    // opacityを下げる
    return color.replace(/,\s*([\d.]+)\)$/, (_, op) => `, ${Math.max(parseFloat(op) * 0.7, 0.15)})`);
  }
  if (temp === "hot") return "rgba(220, 38, 38, 0.4)";
  if (temp === "cold") return "rgba(59, 130, 246, 0.4)";
  return "rgba(156, 163, 175, 0.15)";
}

/**
 * xwOBA / バレル率のヒートカラーを計算する（0〜1の値域）
 * xwOBA: リーグ平均 ~0.320 を中央、0.5以上=ホット、0.1以下=コールド
 * バレル率: 0.15以上=ホット、0以下=コールド
 */
function getStatcastHeatStyle(
  value: number | null,
  tab: StatcastTab,
  isBall: boolean = false
): string {
  if (value === null) return "rgba(156, 163, 175, 0.2)";

  let ratio: number; // 0.0(コールド) 〜 1.0(ホット)

  if (tab === "xwoba") {
    // xwOBA: 0.100=コールド, 0.320=中央, 0.600=ホット
    ratio = Math.min(Math.max((value - 0.1) / 0.5, 0), 1);
  } else {
    // barrelRate: 0=コールド, 0.10=中央, 0.30=ホット
    ratio = Math.min(Math.max(value / 0.3, 0), 1);
  }

  const alpha = isBall ? 0.5 : 0.7;

  if (ratio >= 0.7) {
    // ホット: 赤
    return `rgba(220, 38, 38, ${alpha})`;
  } else if (ratio >= 0.4) {
    // 平均: オレンジ系
    const intensity = (ratio - 0.4) / 0.3;
    const r = Math.round(220 + (255 - 220) * (1 - intensity));
    const g = Math.round(38 + (165 - 38) * (1 - intensity));
    return `rgba(${r}, ${g}, 60, ${alpha * 0.85})`;
  } else {
    // コールド: 青
    return `rgba(59, 130, 246, ${alpha})`;
  }
}

interface ZoneInsight {
  bestZone: string | null;
  bestValue: string;
  worstZone: string | null;
  worstValue: string;
  tendency: string;
}

function analyzeZones(
  zones: Array<{ zone: string; value: string; count: number; temp: string }>,
  statName: string
): ZoneInsight {
  const strikeZones = zones.filter((z) => {
    const n = parseInt(z.zone);
    return n >= 1 && n <= 9;
  });

  const withValue = strikeZones.filter((z) => parseValue(z.value) !== null && z.count >= 5);

  if (withValue.length === 0) {
    return { bestZone: null, bestValue: "-", worstZone: null, worstValue: "-", tendency: "データ不足" };
  }

  const sorted = [...withValue].sort((a, b) => (parseValue(b.value) ?? 0) - (parseValue(a.value) ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // 傾向分析: インサイド(col=0: zone1,4,7) vs アウトサイド(col=2: zone3,6,9)
  const insideZones = withValue.filter((z) => ["1", "4", "7"].includes(z.zone));
  const outsideZones = withValue.filter((z) => ["3", "6", "9"].includes(z.zone));
  const highZones = withValue.filter((z) => ["1", "2", "3"].includes(z.zone));
  const lowZones = withValue.filter((z) => ["7", "8", "9"].includes(z.zone));

  const avgInside = insideZones.reduce((s, z) => s + (parseValue(z.value) ?? 0), 0) / (insideZones.length || 1);
  const avgOutside = outsideZones.reduce((s, z) => s + (parseValue(z.value) ?? 0), 0) / (outsideZones.length || 1);
  const avgHigh = highZones.reduce((s, z) => s + (parseValue(z.value) ?? 0), 0) / (highZones.length || 1);
  const avgLow = lowZones.reduce((s, z) => s + (parseValue(z.value) ?? 0), 0) / (lowZones.length || 1);

  const insideBetter = avgInside > avgOutside;
  const highBetter = avgHigh > avgLow;
  const tendency = `${highBetter ? "高め" : "低め"}${insideBetter ? "インサイド" : "アウトサイド"}が強め`;

  const isRate = ["battingAverage", "sluggingPercentage", "onBasePercentage", "onBasePlusSlugging"].includes(statName);
  const fmt = (v: string) => {
    const n = parseValue(v);
    if (n === null) return v;
    if (isRate && n < 2) return `.${n.toFixed(3).slice(2)}`;
    return n.toFixed(1);
  };

  return {
    bestZone: best.zone,
    bestValue: fmt(best.value),
    worstZone: worst.zone,
    worstValue: fmt(worst.value),
    tendency,
  };
}

function ZoneLabel({ zone }: { zone: string }) {
  const zoneInt = parseInt(zone);
  if (zoneInt >= 1 && zoneInt <= 9) return <span className="text-[8px] text-white/50">Z{zoneInt}</span>;
  return <span className="text-[8px] text-white/40">B{zone}</span>;
}

function ZoneCell({
  value,
  count,
  color,
  temp,
  zone,
  size = "md",
  isBall = false,
}: {
  value: string;
  count: number;
  color: string;
  temp: string;
  zone: string;
  size?: "sm" | "md";
  isBall?: boolean;
}) {
  const bgColor = isBall ? getBallZoneStyle(color, temp) : getHeatStyle(color, temp);
  const isLowCount = count < 5;
  const numVal = parseValue(value);
  const isRate = numVal !== null && numVal < 2;
  const displayValue = numVal === null ? "-" : isRate ? `.${numVal.toFixed(3).slice(2)}` : numVal.toFixed(1);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded transition-transform hover:scale-105 ${
        size === "sm" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20"
      } ${isLowCount ? "opacity-60" : ""}`}
      style={{ backgroundColor: bgColor }}
      title={`Zone ${zone}: ${displayValue} (${count}打席)`}
      aria-label={`Zone ${zone}: ${displayValue}（${count}打席）`}
    >
      <span
        className={`font-bold text-white drop-shadow-md ${
          size === "sm" ? "text-xs" : "text-base sm:text-lg"
        }`}
      >
        {displayValue}
      </span>
      <ZoneLabel zone={zone} />
    </div>
  );
}

/** Statcast拡張タブ（xwOBA/バレル率）のゾーンセル */
function StatcastZoneCell({
  value,
  battedBalls,
  zone,
  tab,
  size = "md",
  isBall = false,
}: {
  value: number | null;
  battedBalls: number;
  zone: string;
  tab: StatcastTab;
  size?: "sm" | "md";
  isBall?: boolean;
}) {
  const bgColor = getStatcastHeatStyle(value, tab, isBall);
  const isLowCount = battedBalls < 5;

  let displayValue: string;
  if (value === null) {
    displayValue = "-";
  } else if (tab === "xwoba") {
    // xwOBA: .XXX 形式
    displayValue = value < 0.001 ? "-" : `.${value.toFixed(3).slice(2)}`;
  } else {
    // barrelRate: XX% 形式
    displayValue = value === 0 ? "0%" : `${Math.round(value * 100)}%`;
  }

  const tooltipText =
    tab === "xwoba"
      ? `Zone ${zone}: xwOBA ${displayValue} (${battedBalls}打球)`
      : `Zone ${zone}: バレル率 ${displayValue} (${battedBalls}打球中${Math.round((value ?? 0) * battedBalls)}バレル)`;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded transition-transform hover:scale-105 ${
        size === "sm" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20"
      } ${isLowCount ? "opacity-50" : ""}`}
      style={{ backgroundColor: bgColor }}
      title={tooltipText}
      aria-label={tooltipText}
    >
      <span
        className={`font-bold text-white drop-shadow-md ${
          size === "sm" ? "text-[10px]" : tab === "barrelRate" ? "text-sm sm:text-base" : "text-base sm:text-lg"
        }`}
      >
        {displayValue}
      </span>
      <ZoneLabel zone={zone} />
    </div>
  );
}

function EmptyCell({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      className={`rounded ${
        size === "sm" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
    />
  );
}

export default function ZoneHeatMap({ categories, title, zoneXwoba }: ZoneHeatMapProps) {
  const mlbStats = categories.map((c) => c.statName);
  // Statcast拡張タブはzoneXwobaがある場合のみ表示
  const statcastTabs: string[] = zoneXwoba ? (STATCAST_TABS as unknown as string[]) : [];
  const availableStats = [...mlbStats, ...statcastTabs];

  const [selectedStat, setSelectedStat] = useState(availableStats[0] ?? "battingAverage");
  const isStatcastTab = (STATCAST_TABS as readonly string[]).includes(selectedStat);

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

  // ゾーンをzoneキーで引けるMapに変換
  const zoneMap = useMemo(() => {
    const map = new Map<string, { value: string; count: number; color: string; temp: string }>();
    for (const z of category?.zones ?? []) {
      // APIは "1"〜"9", "11"〜"14" で返す。ゼロパディングなし。
      map.set(z.zone, {
        value: z.value,
        count: (z as { zone: string; value: string; color: string; temp: string; count?: number }).count ?? 0,
        color: z.color,
        temp: z.temp,
      });
    }
    return map;
  }, [category]);

  const insight = useMemo(() => {
    if (!category) return null;
    const zonesWithCount = category.zones.map((z) => ({
      ...z,
      count: (z as { zone: string; value: string; color: string; temp: string; count?: number }).count ?? 0,
    }));
    return analyzeZones(zonesWithCount, selectedStat);
  }, [category, selectedStat]);

  // 13ゾーングリッドを描画する
  // 5列4行のグリッド:
  //   row0: [ball-11] [sz1] [sz2] [sz3] [ball-12]
  //   row1: [empty  ] [sz4] [sz5] [sz6] [empty  ]
  //   row2: [empty  ] [sz7] [sz8] [sz9] [empty  ]
  //   row3: [ball-13] [   ] [   ] [   ] [ball-14]

  function renderGrid() {
    const rows = [];
    for (let row = 0; row < 4; row++) {
      const cols = [];
      for (let col = 0; col < 5; col++) {
        // ボールゾーン（四隅）
        const ballEntry = Object.entries(BALL_ZONE_CORNERS).find(
          ([, pos]) => pos.gridRow === row && pos.gridCol === col
        );
        if (ballEntry) {
          const [ballZone] = ballEntry;

          if (isStatcastTab && zoneXwoba) {
            const entry = zoneXwoba.zones[ballZone];
            const statValue = entry
              ? selectedStat === "xwoba"
                ? entry.xwoba
                : entry.barrelRate
              : null;
            cols.push(
              <StatcastZoneCell
                key={`b${ballZone}`}
                zone={ballZone}
                value={statValue ?? null}
                battedBalls={entry?.battedBalls ?? 0}
                tab={selectedStat as StatcastTab}
                size="sm"
                isBall
              />
            );
          } else {
            const zd = zoneMap.get(ballZone);
            if (zd) {
              cols.push(
                <ZoneCell
                  key={`b${ballZone}`}
                  zone={ballZone}
                  value={zd.value}
                  count={zd.count}
                  color={zd.color}
                  temp={zd.temp}
                  size="sm"
                  isBall
                />
              );
            } else {
              cols.push(<EmptyCell key={`b${ballZone}`} size="sm" />);
            }
          }
          continue;
        }

        // ストライクゾーン (row0-2, col1-3)
        if (row >= 0 && row <= 2 && col >= 1 && col <= 3) {
          const szNum = row * 3 + (col - 1) + 1; // 1〜9
          const zoneKey = String(szNum);

          if (isStatcastTab && zoneXwoba) {
            const entry = zoneXwoba.zones[zoneKey];
            const statValue = entry
              ? selectedStat === "xwoba"
                ? entry.xwoba
                : entry.barrelRate
              : null;
            cols.push(
              <StatcastZoneCell
                key={`sz${szNum}`}
                zone={zoneKey}
                value={statValue ?? null}
                battedBalls={entry?.battedBalls ?? 0}
                tab={selectedStat as StatcastTab}
                size="md"
              />
            );
          } else {
            const paddedKey = szNum.toString().padStart(2, "0"); // 既存ZonePositionsとの互換
            const zd = zoneMap.get(zoneKey) ?? zoneMap.get(paddedKey);
            if (zd) {
              cols.push(
                <ZoneCell
                  key={`sz${szNum}`}
                  zone={zoneKey}
                  value={zd.value}
                  count={zd.count}
                  color={zd.color}
                  temp={zd.temp}
                  size="md"
                />
              );
            } else {
              cols.push(<EmptyCell key={`sz${szNum}`} size="md" />);
            }
          }
          continue;
        }

        // それ以外 (row3の中央3マス、row1-2のcol0/col4)
        cols.push(<div key={`empty-${row}-${col}`} className="h-16 w-16 sm:h-20 sm:w-20" />);
      }
      rows.push(
        <div key={`row${row}`} className="flex items-center gap-0.5">
          {cols}
        </div>
      );
    }
    return rows;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>

      {/* 指標タブ */}
      {availableStats.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
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
              {STAT_SHORT[stat] && (
                <span className="ml-1 opacity-60">({STAT_SHORT[stat]})</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
        {/* ヒートマップグリッド */}
        <div className="flex-shrink-0">
          <div className="mb-1 flex items-center justify-between px-10 text-[10px] text-gray-400">
            <span>インコース</span>
            <span>アウトコース</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {renderGrid()}
          </div>
          {/* 凡例 */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(220,38,38,0.65)" }} />
              <span>ホット</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(156,163,175,0.35)" }} />
              <span>平均</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(59,130,246,0.65)" }} />
              <span>コールド</span>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
            ※ 外枠=ボールゾーン / 中央=ストライクゾーン（9分割）
          </p>
        </div>

        {/* 読み解きパネル: MLB Stats API タブ */}
        {!isStatcastTab && insight && (
          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {STAT_LABELS[selectedStat] ?? selectedStat} 読み解き
            </h4>

            {insight.bestZone && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-900/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
                  最強ゾーン
                </p>
                <p className="mt-0.5 text-xl font-bold text-red-600 dark:text-red-400">
                  Zone {insight.bestZone}
                  <span className="ml-2 text-base">{insight.bestValue}</span>
                </p>
                <p className="mt-1 text-xs text-red-500/80 dark:text-red-400/70">
                  このゾーンが最も数値が高い
                </p>
              </div>
            )}

            {insight.worstZone && insight.worstZone !== insight.bestZone && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-900/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                  苦手ゾーン（5打席以上）
                </p>
                <p className="mt-0.5 text-xl font-bold text-blue-600 dark:text-blue-400">
                  Zone {insight.worstZone}
                  <span className="ml-2 text-base">{insight.worstValue}</span>
                </p>
                <p className="mt-1 text-xs text-blue-500/80 dark:text-blue-400/70">
                  このゾーンが最も数値が低い
                </p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                打撃傾向
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {insight.tendency}
              </p>
              <p className="mt-1 text-[10px] text-gray-400">
                ストライクゾーン内の{STAT_LABELS[selectedStat] ?? selectedStat}分布より自動判定
              </p>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              MLB Stats API hotColdZones より取得。5打席未満のゾーンは薄く表示。
            </p>
          </div>
        )}

        {/* 読み解きパネル: Statcast拡張タブ (xwOBA / バレル率) */}
        {isStatcastTab && zoneXwoba && (
          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {STAT_LABELS[selectedStat]} 読み解き
            </h4>

            {/* 最高ゾーン */}
            {(() => {
              const szEntries = Object.entries(zoneXwoba.zones)
                .filter(([z, e]) => {
                  const n = parseInt(z);
                  return n >= 1 && n <= 9 && e.battedBalls >= 5;
                })
                .map(([z, e]) => ({
                  zone: z,
                  val: selectedStat === "xwoba" ? e.xwoba : e.barrelRate,
                  battedBalls: e.battedBalls,
                }))
                .filter((e) => e.val !== null)
                .sort((a, b) => (b.val ?? 0) - (a.val ?? 0));

              if (szEntries.length === 0) return null;
              const best = szEntries[0];
              const worst = szEntries[szEntries.length - 1];
              const fmt = (v: number | null) => {
                if (v === null) return "-";
                if (selectedStat === "xwoba") return `.${v.toFixed(3).slice(2)}`;
                return `${Math.round(v * 100)}%`;
              };

              return (
                <>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-900/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
                      最強ゾーン（5打球以上）
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-red-600 dark:text-red-400">
                      Zone {best.zone}
                      <span className="ml-2 text-base">{fmt(best.val)}</span>
                    </p>
                    <p className="mt-1 text-xs text-red-500/80 dark:text-red-400/70">
                      {best.battedBalls}打球での{STAT_LABELS[selectedStat]}
                    </p>
                  </div>

                  {worst.zone !== best.zone && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-900/20">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                        最低ゾーン（5打球以上）
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-blue-600 dark:text-blue-400">
                        Zone {worst.zone}
                        <span className="ml-2 text-base">{fmt(worst.val)}</span>
                      </p>
                      <p className="mt-1 text-xs text-blue-500/80 dark:text-blue-400/70">
                        {worst.battedBalls}打球での{STAT_LABELS[selectedStat]}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                データソース
              </p>
              <p className="mt-0.5 text-xs text-gray-700 dark:text-gray-300">
                {selectedStat === "xwoba"
                  ? "打球の速度・角度から期待値を算出した指標。実際の打球の質を反映。"
                  : "打球速度98mph以上かつ打球角度26〜30°の理想的な打球の割合。"}
              </p>
              <p className="mt-1 text-[10px] text-gray-400">
                データ取得: {new Date(zoneXwoba.fetchedAt).toLocaleDateString("ja-JP")}
              </p>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Baseball Savant (Statcast) より取得。5打球未満のゾーンは薄く表示。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
