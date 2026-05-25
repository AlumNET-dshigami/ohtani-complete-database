interface CompareGaugeProps {
  /** 自分（大谷）の値 */
  value: number;
  /** 比較対象（首位 or 2位）の値 */
  leader: number;
  /** ゲージの最大値。未指定なら max(value, leader) を基準に少し余白を取る */
  max?: number;
  /** 自分側ラベル（"大谷" 等） */
  valueLabel?: string;
  /** 比較側ラベル（"首位 Schwarber" 等） */
  leaderLabel?: string;
  /** 値の整形関数（打率は ".300"、本数は "20" 等） */
  format?: (n: number) => string;
  /** 大谷が首位かどうか（首位なら王冠を自分側に） */
  isLeading?: boolean;
  /** 値が小さいほど良い指標（ERAなど）。trueだと達成方向が逆転 */
  lowerIsBetter?: boolean;
  className?: string;
}

const defaultFormat = (n: number) => String(n);

/**
 * 比較ゲージ。サンジ設計の <CompareGauge value leader>。
 * - トラック = slate、達成部分 = dodger-blue
 * - 自分(大谷)の位置にドット、首位位置にマーカー(縦線＋王冠/旗)
 * - タイトル争い・WAR で共用
 */
export default function CompareGauge({
  value,
  leader,
  max,
  valueLabel = "大谷",
  leaderLabel = "首位",
  format = defaultFormat,
  isLeading = false,
  lowerIsBetter = false,
  className = "",
}: CompareGaugeProps) {
  // スケール: 0 を基準に value/leader を配置。ERA等の低い方が良い指標も
  // 「絶対値の大きさ」で棒を描くと直感に反するため、両者の大きい方を100%基準にする。
  const ceiling = max ?? Math.max(value, leader, 0.0001) * 1.08;
  const pct = (n: number) => Math.max(0, Math.min(100, (n / ceiling) * 100));

  const valuePct = pct(value);
  const leaderPct = pct(leader);

  // 差分（lowerIsBetter の場合は符号反転して「良い差」を正にする）
  const rawDiff = value - leader;
  const diff = lowerIsBetter ? -rawDiff : rawDiff;
  const ahead = diff > 0.0000001;
  const tie = Math.abs(diff) < 0.0000001;

  return (
    <div className={className}>
      {/* ラベル行 */}
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-bold text-dodger-blue">
          {valueLabel} {format(value)}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          {leaderLabel} {format(leader)}
        </span>
      </div>

      {/* ゲージ本体 */}
      <div className="relative h-4 w-full overflow-visible rounded-full bg-slate-200 dark:bg-slate-700/60">
        {/* 達成部分（大谷の値） */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-dodger-blue to-dodger-blue-dark transition-[width] duration-700 ease-out"
          style={{ width: `${valuePct}%` }}
        />

        {/* 大谷の位置ドット */}
        <div
          className="absolute top-1/2 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-dodger-blue shadow-md dark:border-slate-900"
          style={{ left: `${valuePct}%` }}
          title={`${valueLabel}: ${format(value)}`}
        />

        {/* 首位（または比較対象）のマーカー縦線 */}
        <div
          className="absolute top-1/2 z-10 h-7 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-diff-orange"
          style={{ left: `${leaderPct}%` }}
          title={`${leaderLabel}: ${format(leader)}`}
        />
        {/* 王冠（首位側） */}
        <div
          className="absolute z-10 -translate-x-1/2 text-sm leading-none"
          style={{ left: `${isLeading ? valuePct : leaderPct}%`, top: "-1.35rem" }}
          aria-hidden
        >
          👑
        </div>
      </div>

      {/* 差分メッセージ */}
      <div className="mt-2 text-xs">
        {tie ? (
          <span className="font-bold text-gray-500 dark:text-gray-400">同値で並走中</span>
        ) : ahead ? (
          <span className="font-bold text-dodger-blue">
            首位独走中（+{format(Math.abs(diff))}）
          </span>
        ) : (
          <span className="font-bold text-diff-orange">
            首位まであと {format(Math.abs(diff))}
          </span>
        )}
      </div>
    </div>
  );
}
