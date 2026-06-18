"use client";

import type { AwardRace } from "@/lib/award-model";

const HEADSHOT_URL = (id: number) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/r_max/w_64,q_auto:best/v1/people/${id}/headshot/67/current`;

const AWARD_META: Record<AwardRace["award"], { title: string; subtitle: string; accent: string }> = {
  "cy-young": { title: "CY YOUNG HEAT CHECK", subtitle: "NL · 2026 RACE", accent: "from-emerald-500 to-teal-600" },
  "hank-aaron": { title: "HANK AARON HEAT CHECK", subtitle: "NL · 2026 RACE", accent: "from-amber-500 to-orange-600" },
  "mvp": { title: "MVP HEAT CHECK", subtitle: "NL · 2026 RACE", accent: "from-violet-500 to-purple-700" },
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-16 text-right text-xl font-black tabular-nums"
        style={{ color: score >= 80 ? "#f97316" : score >= 65 ? "#fbbf24" : "#94a3b8" }}
      >
        {score.toFixed(1)}
      </span>
      <span className="text-xs text-slate-500">/100</span>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: score >= 80 ? "#f97316" : score >= 65 ? "#fbbf24" : "#64748b",
          }}
        />
      </div>
    </div>
  );
}

export default function AwardRaceCard({ race }: { race: AwardRace }) {
  const meta = AWARD_META[race.award];

  return (
    <div className="overflow-hidden rounded-2xl bg-[#0f1923] shadow-xl">
      {/* Header */}
      <div className="relative px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-widest text-white">{meta.title}</h3>
            <p className="mt-0.5 text-xs font-semibold tracking-widest text-slate-400">{meta.subtitle}</p>
          </div>
          <div className={`rounded-lg bg-gradient-to-r ${meta.accent} px-3 py-1.5`}>
            <span className="text-[10px] font-bold tracking-wider text-white">ORIGINAL MODEL</span>
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div className="divide-y divide-slate-800">
        {race.candidates.map((c) => (
          <div
            key={c.playerId}
            className={`relative flex items-center gap-3 px-4 py-3 transition-colors ${
              c.isOhtani
                ? "bg-amber-400/10 ring-inset ring-1 ring-amber-400/40"
                : "hover:bg-slate-800/40"
            }`}
          >
            {/* Rank */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                c.rank === 1
                  ? "bg-amber-400 text-slate-900"
                  : c.rank === 2
                  ? "bg-slate-400 text-slate-900"
                  : c.rank === 3
                  ? "bg-amber-700 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {c.rank}
            </div>

            {/* Headshot */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-1 ring-slate-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEADSHOT_URL(c.playerId)}
                alt={c.playerName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Name + team */}
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-bold tracking-wide ${
                  c.isOhtani ? "text-amber-300" : "text-white"
                }`}
              >
                {c.playerName.toUpperCase()}
              </p>
              <p className="text-xs text-slate-500">{c.teamAbbrv}</p>
            </div>

            {/* Stats */}
            <div className="hidden items-center gap-3 sm:flex">
              {c.stats.map((st) => (
                <div key={st.label} className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{st.label}</p>
                  <p className="text-sm font-bold text-slate-200 tabular-nums">{st.value}</p>
                </div>
              ))}
            </div>

            {/* Score */}
            <div className="ml-2 shrink-0">
              <ScoreBar score={c.score} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-700/60 px-5 py-2.5">
        <p className="text-[10px] text-slate-500">{race.modelNote}</p>
        <p className="text-[10px] text-slate-500">as of Jun {new Date().getDate()}, {race.season}</p>
      </div>
    </div>
  );
}
