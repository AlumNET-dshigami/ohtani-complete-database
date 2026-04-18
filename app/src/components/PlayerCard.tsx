import type { PlayerSummary } from "@/lib/mlb-players";

interface PlayerCardProps {
  player: PlayerSummary;
  highlight?: boolean;
}

export default function PlayerCard({ player, highlight }: PlayerCardProps) {
  const hasBatting = player.batting && player.batting.atBats > 0;
  const hasPitching = player.pitching && parseFloat(player.pitching.inningsPitched) > 0;

  return (
    <div
      className={`card-hover rounded-2xl border bg-surface p-5 shadow-sm transition-all ${
        highlight
          ? "border-dodger-blue ring-2 ring-dodger-blue/20"
          : "border-border hover:border-dodger-blue/40"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={player.headshotUrl}
            alt={player.fullName}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          {player.nameJa && (
            <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
              {player.nameJa}
            </h3>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {player.fullName}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">
            #{player.number} {player.team} | {player.position}
          </p>
        </div>
      </div>

      {hasBatting && player.batting && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase text-gray-400">打撃</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-400">AVG</p>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {player.batting.avg}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">HR</p>
              <p className="font-mono text-sm font-bold text-dodger-red">
                {player.batting.homeRuns}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">RBI</p>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {player.batting.rbi}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">OPS</p>
              <p className="font-mono text-sm font-bold text-dodger-blue">
                {player.batting.ops}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasPitching && player.pitching && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase text-gray-400">投球</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-400">ERA</p>
              <p className="font-mono text-sm font-bold text-dodger-red">
                {player.pitching.era}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">W-L</p>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {player.pitching.wins}-{player.pitching.losses}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">SO</p>
              <p className="font-mono text-sm font-bold text-dodger-blue">
                {player.pitching.strikeOuts}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">WHIP</p>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {player.pitching.whip}
              </p>
            </div>
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-400">
            IP: {player.pitching.inningsPitched}
          </p>
        </div>
      )}

      {!hasBatting && !hasPitching && (
        <div className="mt-4 border-t border-border pt-3 text-center">
          <p className="text-xs text-gray-400">今季のデータなし</p>
        </div>
      )}
    </div>
  );
}
