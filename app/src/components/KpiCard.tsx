import CountUp from "./CountUp";

interface KpiCardProps {
  /** ラベル（"本塁打" 等。日本語） */
  label: string;
  /** 主数字（数値）。カウントアップ対象 */
  value: number;
  /** 小数桁。打率系=3, 本数系=0 */
  decimals?: number;
  /** 主数字の接頭辞（".300" の "." など） */
  prefix?: string;
  /** 主数字の接尾辞（"%", " mph"） */
  suffix?: string;
  /** 文脈テキスト（"NL 2位 / リーグ平均比 +180%" 等）。三点セットの3つ目 */
  context?: string;
  /** ミニ可視化用の達成率(0-100)。順位やリーグ平均比をバーで表す。未指定なら非表示 */
  miniPct?: number;
  /** 強調（ヒーロー寄り） */
  highlight?: boolean;
  /** 角の小バッジ（"👑 首位" 等） */
  badge?: string;
  className?: string;
}

/**
 * KPIカード。サンジ設計の <KpiCard>。
 * - 主数字 text-5xl 太字 ＋ ラベル ＋ 文脈(text-sm slate) ＋ ミニ可視化バー
 * - 「数字を裸で置かない（三点セット必須）」を構造で強制
 * - ホーム＆各機能で再利用
 */
export default function KpiCard({
  label,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  context,
  miniPct,
  highlight = false,
  badge,
  className = "",
}: KpiCardProps) {
  return (
    <div
      className={`glow-hover relative overflow-hidden rounded-2xl border bg-surface p-5 sm:p-6 ${
        highlight
          ? "border-dodger-blue/30 ring-1 ring-dodger-blue/15"
          : "border-border dark:border-white/5"
      } ${className}`}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-accent-gold/15 px-2 py-0.5 text-[10px] font-bold text-accent-gold">
          {badge}
        </span>
      )}

      {/* ラベル（小さく） */}
      <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">
        {label}
      </p>

      {/* 主数字（大きく） */}
      <p
        className={`count-up mt-1 font-bold leading-none ${
          highlight ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
        } ${highlight ? "gradient-text" : "text-gray-900 dark:text-white"}`}
      >
        <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </p>

      {/* 文脈（小さく・三点セットの3つ目） */}
      {context && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{context}</p>
      )}

      {/* ミニ可視化（順位 or リーグ平均比をバーで） */}
      {miniPct !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-dodger-blue to-dodger-blue-dark"
            style={{ width: `${Math.max(0, Math.min(100, miniPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}
