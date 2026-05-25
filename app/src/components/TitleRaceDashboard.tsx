"use client";

import { useMemo, useState } from "react";
import type { LeagueScope, TitleRace } from "@/lib/rankings-api";
import { formatTitleValue } from "@/lib/rankings-api";
import CompareGauge from "./CompareGauge";
import CountUp from "./CountUp";

interface Props {
  /** スコープ別のタイトル争いデータ（サーバーで3スコープ分取得して渡す） */
  byScope: Record<LeagueScope, TitleRace[]>;
  season: number;
}

const SCOPES: { key: LeagueScope; label: string }[] = [
  { key: "NL", label: "ナ・リーグ" },
  { key: "AL", label: "ア・リーグ" },
  { key: "MLB", label: "MLB全体" },
];

/** カードの主数字をパースのままfloatで（カウントアップ用） */
function decimalsFor(unit: TitleRace["unit"]): number {
  if (unit === "avg") return 3;
  if (unit === "era") return 2;
  return 0;
}
/** カード主数字用の値・桁数 */
function heroValueParts(race: TitleRace): { value: number; decimals: number } {
  const v = race.ohtaniValue ?? 0;
  if (race.unit === "avg") return { value: v, decimals: 3 };
  if (race.unit === "era") return { value: v, decimals: 2 };
  return { value: v, decimals: 0 };
}

/** 差分（lowerIsBetter考慮）。大谷が首位なら2位との差、それ以外は首位との差 */
function gapInfo(race: TitleRace): { gap: number | null; vs: "leader" | "second" | null } {
  if (race.ohtaniValue === null) return { gap: null, vs: null };
  if (race.ohtaniIsLeader) {
    if (race.secondValue === null) return { gap: null, vs: null };
    const raw = race.ohtaniValue - race.secondValue;
    return { gap: Math.abs(raw), vs: "second" };
  }
  if (race.leaderValue === null) return { gap: null, vs: null };
  const raw = race.leaderValue - race.ohtaniValue;
  return { gap: Math.abs(race.lowerIsBetter ? -raw : raw) || Math.abs(raw), vs: "leader" };
}

export default function TitleRaceDashboard({ byScope, season }: Props) {
  const [scope, setScope] = useState<LeagueScope>("NL");
  const races = byScope[scope] ?? [];

  // ヒーロー候補: 大谷がランクインしていて、首位との差が最小（=最も僅差で競っている）もの。
  // 大谷が全カテゴリ圏外なら null（フォールバック表示）。
  const hero = useMemo(() => {
    const ranked = races.filter((r) => r.ohtaniValue !== null && r.ohtaniRank !== null);
    if (ranked.length === 0) return null;
    // 首位なら2位との差、それ以外は首位との差。差が小さいほど競っている。
    const scored = ranked.map((r) => {
      const { gap } = gapInfo(r);
      return { race: r, gap: gap ?? Number.POSITIVE_INFINITY };
    });
    scored.sort((a, b) => a.gap - b.gap);
    return scored[0].race;
  }, [races]);

  const anyData = races.some((r) => r.totalRanked > 0);

  return (
    <div className="space-y-6">
      {/* リーグ切替タブ */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
              scope === s.key
                ? "bg-dodger-blue text-white shadow-sm"
                : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!anyData && (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {season}シーズンのランキングデータをまだ取得できません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            シーズンが進むと各タイトル争いが表示されます
          </p>
        </div>
      )}

      {/* ヒーロー: 今一番競ってるタイトル */}
      {hero && (
        <HeroRace race={hero} />
      )}

      {anyData && !hero && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-base text-gray-500 dark:text-gray-400">
            {SCOPES.find((s) => s.key === scope)?.label}では大谷翔平はまだ各タイトルの
            ランキング圏内にいません
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            別リーグ（NL）タブ、またはシーズン進行後にご確認ください
          </p>
        </div>
      )}

      {/* タイトル別カードグリッド */}
      {anyData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <TitleCard key={race.apiKey} race={race} isHero={hero?.apiKey === race.apiKey} />
          ))}
        </div>
      )}
    </div>
  );
}

/** ヒーロー: 大ゲージ＋特大コピー */
function HeroRace({ race }: { race: TitleRace }) {
  const { gap, vs } = gapInfo(race);
  const fmt = (n: number | null) => formatTitleValue(n, race.unit);
  const leadLabel = race.ohtaniIsLeader
    ? `2位 ${race.secondName ?? ""}`
    : `首位 ${race.leaderName ?? ""}`;
  const compareValue = race.ohtaniIsLeader ? race.secondValue : race.leaderValue;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-dodger-blue/30 bg-gradient-to-br from-dodger-blue/10 via-surface to-surface p-6 ring-1 ring-dodger-blue/15 sm:p-8 dark:border-white/5">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-dodger-blue/5 to-transparent" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-dodger-blue px-2.5 py-1 text-[11px] font-bold text-white">
            今いちばん競っているタイトル
          </span>
          {race.ohtaniIsLeader && (
            <span className="rounded-full bg-accent-gold/20 px-2 py-1 text-[11px] font-bold text-accent-gold">
              👑 首位
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold text-gray-700 dark:text-gray-200">
          {race.label}
          <span className="ml-2 text-sm font-medium text-gray-400">
            （大谷 {race.ohtaniRank}位）
          </span>
        </h3>

        {/* 特大コピー */}
        <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
          {race.ohtaniIsLeader ? (
            gap !== null ? (
              <>
                {race.label}を独走<span className="text-dodger-blue"> 2位に+{fmt(gap)}</span>
              </>
            ) : (
              <>{race.label}で首位</>
            )
          ) : gap !== null ? (
            <>
              {race.label}まで
              <span className="text-diff-orange"> あと {fmt(gap)}</span>
            </>
          ) : (
            <>{race.label}を追走中</>
          )}
        </p>

        {/* 主数字（カウントアップ） */}
        <div className="mt-4 flex items-end gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">大谷の現在値</p>
            <p className="gradient-text count-up text-6xl font-bold leading-none sm:text-7xl">
              {race.unit === "avg" ? (
                <span className="tabular">.{(race.ohtaniValue ?? 0).toFixed(3).slice(2)}</span>
              ) : (
                <CountUp value={race.ohtaniValue ?? 0} decimals={decimalsFor(race.unit)} />
              )}
            </p>
          </div>
        </div>

        {/* 大ゲージ */}
        <div className="mt-6">
          <CompareGauge
            value={race.ohtaniValue ?? 0}
            leader={compareValue ?? race.ohtaniValue ?? 0}
            valueLabel="大谷"
            leaderLabel={leadLabel}
            format={(n) => fmt(n)}
            isLeading={race.ohtaniIsLeader}
            lowerIsBetter={race.lowerIsBetter}
          />
        </div>
        {vs === "second" && (
          <p className="mt-2 text-[11px] text-gray-400">※ 首位独走中のため2位との差を表示</p>
        )}
      </div>
    </section>
  );
}

/** タイトル別カード */
function TitleCard({ race, isHero }: { race: TitleRace; isHero: boolean }) {
  const fmt = (n: number | null) => formatTitleValue(n, race.unit);
  const { gap } = gapInfo(race);
  const hero = heroValueParts(race);

  const ranked = race.ohtaniValue !== null && race.ohtaniRank !== null;
  const compareValue = race.ohtaniIsLeader ? race.secondValue : race.leaderValue;
  const compareLabel = race.ohtaniIsLeader
    ? `2位 ${race.secondName ?? ""}`
    : `首位 ${race.leaderName ?? ""}`;

  // 僅差判定: 本数=1差以内, 打率=.005以内, ERA=0.20以内
  const isClose =
    gap !== null &&
    ((race.unit === "count" && gap <= 1) ||
      (race.unit === "avg" && gap <= 0.005) ||
      (race.unit === "era" && gap <= 0.2));

  return (
    <div
      className={`glow-hover relative overflow-hidden rounded-2xl border bg-surface p-5 ${
        isHero
          ? "border-dodger-blue/40 ring-1 ring-dodger-blue/20"
          : "border-border dark:border-white/5"
      }`}
    >
      {/* ヘッダ: タイトル名＋順位バッジ */}
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">{race.label}</h4>
        {ranked ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              race.ohtaniIsLeader
                ? "bg-accent-gold/20 text-accent-gold"
                : race.ohtaniRank! <= 3
                ? "bg-dodger-blue text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {race.ohtaniIsLeader ? "👑 首位" : `${race.ohtaniRank}位`}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            圏外
          </span>
        )}
      </div>

      {ranked ? (
        <>
          {/* 主数字特大 */}
          <p className="gradient-text count-up mt-2 text-5xl font-bold leading-none">
            {race.unit === "avg" ? (
              <span className="tabular">.{String((hero.value).toFixed(3)).slice(2)}</span>
            ) : (
              <CountUp value={hero.value} decimals={hero.decimals} />
            )}
          </p>

          {/* 文脈（三点セット） */}
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {compareLabel} {fmt(compareValue)}
            {gap !== null && (
              <span className={`ml-1 font-bold ${isClose ? "text-diff-orange" : "text-dodger-blue"}`}>
                （{race.ohtaniIsLeader ? "+" : "あと"}
                {fmt(gap)}）
              </span>
            )}
          </p>

          {/* ゲージ */}
          <div className="mt-4">
            <CompareGauge
              value={race.ohtaniValue ?? 0}
              leader={compareValue ?? race.ohtaniValue ?? 0}
              valueLabel="大谷"
              leaderLabel={compareLabel}
              format={(n) => fmt(n)}
              isLeading={race.ohtaniIsLeader}
              lowerIsBetter={race.lowerIsBetter}
            />
          </div>
        </>
      ) : (
        <div className="mt-6 mb-2">
          <p className="text-3xl font-bold text-slate-300 dark:text-slate-600">—</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            このリーグ・カテゴリではランキング圏外
            {race.leaderValue !== null && (
              <>（首位 {race.leaderName}：{fmt(race.leaderValue)}）</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
