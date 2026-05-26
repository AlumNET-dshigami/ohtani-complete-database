"use client";

import { useMemo, useState } from "react";
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
import type { PitchArsenalDetail, PitchRole } from "@/lib/statcast-api";
import RankBar from "./RankBar";
import CountUp from "./CountUp";

interface Props {
  batter: PitchArsenalDetail[];
  pitcher: PitchArsenalDetail[];
  season: number;
  /** 初期ロール（URLクエリ由来）。未指定はbatter */
  initialRole?: PitchRole;
}

const DODGER = "#005A9C";
const DODGER_LIGHT = "#4a90d9";
const SLATE = "#94a3b8";

type SortKey = "usage" | "ba" | "woba" | "whiff" | "hardHit";

const toNum = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export default function PitchDeepDive({ batter, pitcher, season, initialRole = "batter" }: Props) {
  const [role, setRole] = useState<PitchRole>(initialRole);
  const data = role === "batter" ? batter : pitcher;
  const hasData = data.length > 0;

  return (
    <div className="space-y-6">
      {/* 大タブ: 打者 | 投手 */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => setRole("batter")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
            role === "batter"
              ? "bg-dodger-blue text-white shadow-sm"
              : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
          }`}
        >
          🏏 打者として（対戦球種別）
        </button>
        <button
          onClick={() => setRole("pitcher")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
            role === "pitcher"
              ? "bg-dodger-blue text-white shadow-sm"
              : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
          }`}
        >
          ⚾ 投手として（投球球種別）
        </button>
      </div>

      {!hasData ? (
        <FallbackPanel role={role} season={season} />
      ) : role === "batter" ? (
        <BatterView data={data} />
      ) : (
        <PitcherView data={data} />
      )}
    </div>
  );
}

/** データ未取得時のフォールバック（既存空状態パターンに準拠） */
function FallbackPanel({ role, season }: { role: PitchRole; season: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <p className="text-lg text-gray-500 dark:text-gray-400">
        {role === "pitcher"
          ? `${season}シーズンの投球球種データをまだ取得できません`
          : `${season}シーズンの対戦球種データをまだ取得できません`}
      </p>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        {role === "pitcher"
          ? "投手として登板し、一定の投球数が集計されると表示されます"
          : "シーズンが進み打席が集計されると表示されます"}
      </p>
    </div>
  );
}

/** ヒーロー: 決め球（投手=最多使用の変化球で空振り率最大 / 打者=最も打てている球種） */
function HeroPitch({ d, role }: { d: PitchArsenalDetail; role: PitchRole }) {
  if (role === "pitcher") {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-dodger-blue/30 bg-gradient-to-br from-dodger-blue/10 via-surface to-surface p-6 ring-1 ring-dodger-blue/15 sm:p-8 dark:border-white/5">
        <div className="relative">
          <span className="rounded-full bg-dodger-blue px-2.5 py-1 text-[11px] font-bold text-white">
            決め球の空振り率
          </span>
          <h3 className="mt-3 text-lg font-bold text-gray-700 dark:text-gray-200">
            {d.jpName}（{d.pitchName}）
          </h3>
          <div className="mt-3 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">空振り率</p>
              <p className="gradient-text count-up text-6xl font-bold leading-none sm:text-7xl">
                <CountUp value={d.whiffPercent ?? 0} decimals={1} suffix="%" />
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                使用率 {d.usage.toFixed(1)}% / 被打率 {d.ba}
                {d.avgSpeed !== null && <> / {d.avgSpeed.toFixed(1)} mph</>}
                {d.avgSpin !== null && <> / {Math.round(d.avgSpin)} rpm</>}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  // 打者ヒーロー: 最も打てている球種（wOBA最大）
  return (
    <section className="relative overflow-hidden rounded-2xl border border-dodger-blue/30 bg-gradient-to-br from-dodger-blue/10 via-surface to-surface p-6 ring-1 ring-dodger-blue/15 sm:p-8 dark:border-white/5">
      <div className="relative">
        <span className="rounded-full bg-dodger-blue px-2.5 py-1 text-[11px] font-bold text-white">
          最も打てている球種
        </span>
        <h3 className="mt-3 text-lg font-bold text-gray-700 dark:text-gray-200">
          {d.jpName}（{d.pitchName}）
        </h3>
        <div className="mt-3 flex flex-wrap items-end gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">被対戦wOBA</p>
            <p className="gradient-text count-up text-6xl font-bold leading-none sm:text-7xl">
              <span className="tabular">.{toNum(d.woba).toFixed(3).slice(2)}</span>
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              対戦率 {d.usage.toFixed(1)}% / 打率 {d.ba} / hard-hit {d.hardHitPercent?.toFixed(1) ?? "-"}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 打者ビュー: 球種別横棒(被打率) 主役 → ソート可能テーブル */
function BatterView({ data }: { data: PitchArsenalDetail[] }) {
  const [sort, setSort] = useState<SortKey>("usage");

  // ヒーロー: wOBA最大（最も打てている球種、対戦20打席以上を優先）
  const hero = useMemo(() => {
    const qualified = data.filter((d) => d.pa >= 10);
    const pool = qualified.length ? qualified : data;
    return [...pool].sort((a, b) => toNum(b.woba) - toNum(a.woba))[0];
  }, [data]);

  // 横棒: 被打率（高いほど打ててる＝大谷視点で良い）
  const baBars = useMemo(
    () =>
      [...data]
        .sort((a, b) => toNum(b.ba) - toNum(a.ba))
        .map((d) => ({
          key: d.pitchType,
          label: d.jpName,
          value: toNum(d.ba),
          display: d.ba,
          sub: `対戦${d.usage.toFixed(0)}%`,
          highlight: d.pitchType === hero?.pitchType,
        })),
    [data, hero]
  );

  const sorted = useMemo(() => sortRows(data, sort), [data, sort]);

  return (
    <div className="space-y-6">
      {hero && <HeroPitch d={hero} role="batter" />}

      {/* 球種別 被打率 横棒（主役） */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 dark:border-white/5">
        <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">
          対戦球種別 打率ランキング
        </h3>
        <RankBar items={baBars} showRank={false} />
      </section>

      {/* 詳細テーブル（ソート可能） */}
      <DetailTable data={sorted} role="batter" sort={sort} onSort={setSort} />
    </div>
  );
}

/** 投手ビュー: 球種別被打率横棒 + 球速分布 + 回転数KPI */
function PitcherView({ data }: { data: PitchArsenalDetail[] }) {
  const [sort, setSort] = useState<SortKey>("usage");

  // ヒーロー: 変化球（FF/SI/FC以外）で空振り率 > 0 の球種の中から空振り率最大の決め球
  // 空振り率 0.0% の球種（データ不足・投球なし）は除外する
  const hero = useMemo(() => {
    const breaking = data.filter((d) => !["FF", "SI", "FC"].includes(d.pitchType));
    const pool = breaking.length ? breaking : data;
    const withWhiff = pool.filter((d) => (d.whiffPercent ?? 0) > 0);
    const candidates = withWhiff.length ? withWhiff : pool;
    return [...candidates].sort((a, b) => (b.whiffPercent ?? 0) - (a.whiffPercent ?? 0))[0];
  }, [data]);

  // 被打率横棒（低いほど良い）
  const baBars = useMemo(
    () =>
      [...data]
        .sort((a, b) => toNum(a.ba) - toNum(b.ba))
        .map((d) => ({
          key: d.pitchType,
          label: d.jpName,
          value: toNum(d.ba),
          display: d.ba,
          sub: `使用${d.usage.toFixed(0)}%`,
          highlight: d.pitchType === hero?.pitchType,
        })),
    [data, hero]
  );

  // 球速分布（球種別 平均球速の棒）
  const speedData = useMemo(
    () =>
      data
        .filter((d) => d.avgSpeed !== null)
        .map((d) => ({
          name: d.jpName,
          code: d.pitchType,
          speed: d.avgSpeed as number,
          isHero: d.pitchType === hero?.pitchType,
        }))
        .sort((a, b) => b.speed - a.speed),
    [data, hero]
  );

  const hasSpeed = speedData.length > 0;
  const sorted = useMemo(() => sortRows(data, sort), [data, sort]);

  return (
    <div className="space-y-6">
      {hero && <HeroPitch d={hero} role="pitcher" />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 被打率横棒 */}
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 dark:border-white/5">
          <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">
            球種別 被打率ランキング
          </h3>
          <RankBar items={baBars} showRank={false} lowerIsBetter />
        </section>

        {/* 球速分布 */}
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 dark:border-white/5">
          <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">
            球種別 平均球速（mph）
          </h3>
          {hasSpeed ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
                  <XAxis type="number" domain={[70, 102]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid #005A9C",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [`${Number(v).toFixed(1)} mph`, "平均球速"]}
                  />
                  <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
                    {speedData.map((d) => (
                      <Cell key={d.code} fill={d.isHero ? DODGER : SLATE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">
              球速データは未取得です（被打率・空振り率で評価しています）
            </p>
          )}
        </section>
      </div>

      {/* 回転数KPI（横並びカード） */}
      <SpinKpis data={data} heroCode={hero?.pitchType} />

      {/* 詳細テーブル */}
      <DetailTable data={sorted} role="pitcher" sort={sort} onSort={setSort} />
    </div>
  );
}

/** 回転数KPIカード群 */
function SpinKpis({ data, heroCode }: { data: PitchArsenalDetail[]; heroCode?: string }) {
  const withSpin = data.filter((d) => d.avgSpin !== null);
  if (withSpin.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 dark:border-white/5">
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">回転数</h3>
        <p className="text-sm text-gray-400">
          回転数データは未取得です（球速・被打率で成立しています）
        </p>
      </section>
    );
  }
  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">球種別 回転数（rpm）</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {withSpin
          .sort((a, b) => (b.avgSpin ?? 0) - (a.avgSpin ?? 0))
          .map((d) => (
            <div
              key={d.pitchType}
              className={`glow-hover rounded-xl border bg-surface p-4 ${
                d.pitchType === heroCode
                  ? "border-dodger-blue/30 ring-1 ring-dodger-blue/15"
                  : "border-border dark:border-white/5"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">
                {d.jpName}
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900 tabular dark:text-white">
                {Math.round(d.avgSpin as number)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                rpm{d.avgSpeed !== null && ` / ${d.avgSpeed.toFixed(1)}mph`}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
}

function sortRows(data: PitchArsenalDetail[], sort: SortKey): PitchArsenalDetail[] {
  const arr = [...data];
  switch (sort) {
    case "ba":
      return arr.sort((a, b) => toNum(b.ba) - toNum(a.ba));
    case "woba":
      return arr.sort((a, b) => toNum(b.woba) - toNum(a.woba));
    case "whiff":
      return arr.sort((a, b) => (b.whiffPercent ?? 0) - (a.whiffPercent ?? 0));
    case "hardHit":
      return arr.sort((a, b) => (b.hardHitPercent ?? 0) - (a.hardHitPercent ?? 0));
    default:
      return arr.sort((a, b) => b.usage - a.usage);
  }
}

/** ソート可能な詳細テーブル */
function DetailTable({
  data,
  role,
  sort,
  onSort,
}: {
  data: PitchArsenalDetail[];
  role: PitchRole;
  sort: SortKey;
  onSort: (k: SortKey) => void;
}) {
  const Th = ({ k, children, className = "" }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`cursor-pointer select-none px-3 py-2 font-medium transition-colors hover:text-dodger-blue ${
        sort === k ? "text-dodger-blue" : ""
      } ${className}`}
      onClick={() => onSort(k)}
    >
      {children}
      {sort === k && <span className="ml-0.5">▾</span>}
    </th>
  );

  return (
    <section className="overflow-x-auto rounded-2xl border border-border bg-surface dark:border-white/5">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-slate-50 text-gray-500 dark:bg-slate-800/50 dark:text-gray-400">
            <th className="px-3 py-2 text-left font-medium">球種</th>
            <Th k="usage" className="text-right">使用率</Th>
            <Th k="ba" className="text-right">被打率</Th>
            <Th k="woba" className="text-right">wOBA</Th>
            <Th k="whiff" className="text-right">空振率</Th>
            <Th k="hardHit" className="text-right">HardHit</Th>
            {role === "pitcher" && <th className="px-3 py-2 text-right font-medium">球速</th>}
            {role === "pitcher" && <th className="px-3 py-2 text-right font-medium">回転</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.pitchType} className="border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">
                {d.jpName}
                <span className="ml-1 text-[10px] text-gray-400">{d.pitchType}</span>
              </td>
              <td className="px-3 py-2 text-right tabular">{d.usage.toFixed(1)}%</td>
              <td className="px-3 py-2 text-right tabular font-bold text-dodger-blue">{d.ba}</td>
              <td className="px-3 py-2 text-right tabular">{d.woba}</td>
              <td className="px-3 py-2 text-right tabular">{d.whiffPercent?.toFixed(1) ?? "-"}%</td>
              <td className="px-3 py-2 text-right tabular">{d.hardHitPercent?.toFixed(1) ?? "-"}%</td>
              {role === "pitcher" && (
                <td className="px-3 py-2 text-right tabular">{d.avgSpeed?.toFixed(1) ?? "-"}</td>
              )}
              {role === "pitcher" && (
                <td className="px-3 py-2 text-right tabular">{d.avgSpin ? Math.round(d.avgSpin) : "-"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
