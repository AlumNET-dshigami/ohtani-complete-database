"use client";

import { useMemo, useState } from "react";
import type { WARRankingResult, WARScope, WARMetric } from "@/lib/war-scraper";
import RankBar from "./RankBar";
import CountUp from "./CountUp";

interface Props {
  /** スコープ別のランキング（サーバーで取得して渡す） */
  byScope: Partial<Record<WARScope, WARRankingResult>>;
  /** 大谷の二刀流内訳（合算の内訳バー用） */
  breakdown: {
    battingFWar: number | null;
    pitchingFWar: number | null;
    battingRWar: number | null;
    pitchingRWar: number | null;
    totalFWar: number | null;
    totalRWar: number | null;
  };
  season: number;
  /** ソースが手動フォールバックか */
  isManual: boolean;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
}

const SCOPES: { key: WARScope; label: string }[] = [
  { key: "MLB", label: "MLB全体" },
  { key: "NL", label: "ナ・リーグ" },
  { key: "AL", label: "ア・リーグ" },
];

const METRICS: { key: WARMetric; label: string; source: string }[] = [
  { key: "fWAR", label: "fWAR", source: "FanGraphs" },
  { key: "rWAR", label: "bWAR", source: "Baseball Ref." },
];

export default function WARRankingDashboard({
  byScope,
  breakdown,
  season,
  isManual,
  sourceUrl,
  sourceUpdatedAt,
}: Props) {
  // 大谷がランクインしてるスコープを初期選択（無ければMLB）
  const defaultScope: WARScope =
    (["MLB", "NL", "AL"] as WARScope[]).find((s) => byScope[s]?.ohtaniRank != null) ?? "MLB";
  const [scope, setScope] = useState<WARScope>(defaultScope);
  const [metric, setMetric] = useState<WARMetric>("fWAR");

  const result = byScope[scope];
  const entries = result?.entries ?? [];
  const hasRanking = entries.length > 0;

  // 内訳（指標に応じて）
  const battingWar = metric === "fWAR" ? breakdown.battingFWar : breakdown.battingRWar;
  const pitchingWar = metric === "fWAR" ? breakdown.pitchingFWar : breakdown.pitchingRWar;
  const totalWar = metric === "fWAR" ? breakdown.totalFWar : breakdown.totalRWar;

  // 内訳が両方取れているか（取れなければ合算1本で成立させる）
  const hasBreakdown = battingWar !== null && pitchingWar !== null;

  // TOP20 横棒データ
  const bars = useMemo(
    () =>
      entries.map((e) => {
        const v = metric === "fWAR" ? e.fWAR : e.rWAR;
        return {
          key: `${e.rank}-${e.name}`,
          label: e.name,
          value: v ?? 0,
          display: v !== null ? v.toFixed(2) : "-",
          sub: e.team,
          highlight: e.isOhtani,
        };
      }),
    [entries, metric]
  );

  return (
    <div className="space-y-6">
      {/* 切替コントロール */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                scope === s.key
                  ? "bg-dodger-blue text-white shadow-sm"
                  : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                metric === m.key
                  ? "bg-dodger-blue text-white shadow-sm"
                  : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
              }`}
              title={m.source}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ヒーロー: 二刀流合算の内訳積み上げバー */}
      <BreakdownHero
        battingWar={battingWar}
        pitchingWar={pitchingWar}
        totalWar={totalWar}
        hasBreakdown={hasBreakdown}
        metric={metric}
        scope={scope}
        ohtaniRank={result?.ohtaniRank ?? null}
      />

      {/* メイン: TOP20 横棒ランキング */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 dark:border-white/5">
        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
          {SCOPES.find((s) => s.key === scope)?.label} WAR TOP{entries.length || 20}
        </h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {METRICS.find((m) => m.key === metric)?.label}（野手＋投手 合算）。大谷翔平を強調表示
        </p>
        {hasRanking ? (
          <RankBar items={bars} highlightKey={bars.find((b) => b.highlight)?.key} />
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {season}シーズンの{SCOPES.find((s) => s.key === scope)?.label}WARランキングを
              取得できませんでした
            </p>
            <p className="mt-1 text-xs text-gray-400">
              別の範囲タブ、またはシーズン進行後にご確認ください
            </p>
          </div>
        )}
      </section>

      {/* 出典 */}
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        出典:{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-dodger-blue hover:underline">
          nobita-retire.com
        </a>
        （fWAR=FanGraphs / bWAR=Baseball Reference）
        {sourceUpdatedAt ? ` / 最終更新: ${sourceUpdatedAt}` : ""}
        {isManual && <span className="ml-1 text-amber-600 dark:text-amber-400">⚠️ 一部手動更新値</span>}
      </p>
    </div>
  );
}

/** 二刀流合算の内訳積み上げバー */
function BreakdownHero({
  battingWar,
  pitchingWar,
  totalWar,
  hasBreakdown,
  metric,
  scope,
  ohtaniRank,
}: {
  battingWar: number | null;
  pitchingWar: number | null;
  totalWar: number | null;
  hasBreakdown: boolean;
  metric: WARMetric;
  scope: WARScope;
  ohtaniRank: number | null;
}) {
  const total = totalWar ?? (hasBreakdown ? (battingWar ?? 0) + (pitchingWar ?? 0) : null);
  const scopeLabel = SCOPES.find((s) => s.key === scope)?.label ?? scope;
  const metricLabel = metric === "fWAR" ? "fWAR" : "bWAR";

  if (total === null) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 text-center dark:border-white/5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {metricLabel}の合算値を取得できませんでした
        </p>
      </section>
    );
  }

  // 積み上げ幅（合計を100%として打者分/投手分の割合）
  const bat = Math.max(0, battingWar ?? 0);
  const pit = Math.max(0, pitchingWar ?? 0);
  const denom = bat + pit > 0 ? bat + pit : 1;
  const batPct = hasBreakdown ? (bat / denom) * 100 : 100;
  const pitPct = hasBreakdown ? (pit / denom) * 100 : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-dodger-blue/30 bg-gradient-to-br from-dodger-blue/10 via-surface to-surface p-6 ring-1 ring-dodger-blue/15 sm:p-8 dark:border-white/5">
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-dodger-blue px-2.5 py-1 text-[11px] font-bold text-white">
            二刀流 合算{metricLabel}
          </span>
          {ohtaniRank !== null && (
            <span className="rounded-full bg-accent-gold/20 px-2 py-1 text-[11px] font-bold text-accent-gold">
              {scopeLabel} {ohtaniRank}位
            </span>
          )}
        </div>

        {/* 合計値（特大） */}
        <div className="mt-3 flex items-end gap-4">
          <p className="gradient-text count-up text-6xl font-bold leading-none sm:text-7xl">
            <CountUp value={total} decimals={2} />
          </p>
          <p className="pb-2 text-sm text-gray-500 dark:text-slate-400">
            {hasBreakdown ? (
              <>
                打者 {(battingWar ?? 0).toFixed(2)} ＋ 投手 {(pitchingWar ?? 0).toFixed(2)}
              </>
            ) : (
              <>合算値（内訳は未分離）</>
            )}
          </p>
        </div>

        {/* 積み上げバー */}
        <div className="mt-5">
          <div className="flex h-7 w-full overflow-hidden rounded-lg">
            <div
              className="flex items-center justify-center bg-gradient-to-r from-dodger-blue to-dodger-blue-dark text-[11px] font-bold text-white transition-[width] duration-700"
              style={{ width: `${batPct}%` }}
            >
              {hasBreakdown && batPct > 12 && `打者 ${(battingWar ?? 0).toFixed(2)}`}
            </div>
            {hasBreakdown && (
              <div
                className="flex items-center justify-center bg-diff-orange text-[11px] font-bold text-white transition-[width] duration-700"
                style={{ width: `${pitPct}%` }}
              >
                {pitPct > 12 && `投手 ${(pitchingWar ?? 0).toFixed(2)}`}
              </div>
            )}
          </div>
          {/* 凡例 */}
          {hasBreakdown && (
            <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-dodger-blue" />打者WAR
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-diff-orange" />投手WAR
              </span>
            </div>
          )}
          {!hasBreakdown && (
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              ※ 打者/投手の内訳が分離取得できないため合算値で表示しています
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
