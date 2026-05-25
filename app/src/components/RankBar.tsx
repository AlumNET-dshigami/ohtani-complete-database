export interface RankBarItem {
  /** 一意キー（選手ID・球種コード等） */
  key: string;
  /** 表示ラベル（選手名・球種名） */
  label: string;
  /** バーの長さを決める数値 */
  value: number;
  /** バー右に出す整形済み表示値（".258" 等）。未指定なら value をそのまま */
  display?: string;
  /** 補助テキスト（チーム名・使用率 等） */
  sub?: string;
  /** このアイテムが大谷（強調対象）か */
  highlight?: boolean;
}

interface RankBarProps {
  items: RankBarItem[];
  /** highlight=true のアイテムを強調。highlightKey 指定時は key 一致でも強調 */
  highlightKey?: string;
  /** 値が小さいほど良い指標（被打率・ERA等）。バー長は相対表示のまま、文脈用フラグ */
  lowerIsBetter?: boolean;
  /** バー最大スケール。未指定なら items の最大値 */
  max?: number;
  /** 順位番号を出すか */
  showRank?: boolean;
  className?: string;
}

/**
 * 横棒ランキング。サンジ設計の <RankBar items highlightKey="大谷">。
 * - 大谷だけ dodger-blue 濃＋★、他選手は淡いグレー（信号色は使わない）
 * - 球種ランキング・WAR TOP20・タイトル別で共用
 */
export default function RankBar({
  items,
  highlightKey,
  lowerIsBetter = false,
  max,
  showRank = true,
  className = "",
}: RankBarProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-gray-400">
        データなし
      </div>
    );
  }

  const ceiling = max ?? Math.max(...items.map((i) => Math.abs(i.value)), 0.0001);

  const isHi = (item: RankBarItem) =>
    item.highlight || (highlightKey !== undefined && item.key === highlightKey);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {items.map((item, idx) => {
        const hi = isHi(item);
        const widthPct = Math.max(2, Math.min(100, (Math.abs(item.value) / ceiling) * 100));
        return (
          <div
            key={item.key}
            className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
              hi ? "bg-dodger-blue/10" : "hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            }`}
          >
            {showRank && (
              <span
                className={`w-6 shrink-0 text-right text-xs font-bold tabular ${
                  hi ? "text-dodger-blue" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {idx + 1}
              </span>
            )}

            {/* ラベル */}
            <div className="w-28 shrink-0 sm:w-36">
              <span
                className={`block truncate text-xs font-semibold ${
                  hi ? "text-dodger-blue" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {hi && <span className="mr-0.5">★</span>}
                {item.label}
              </span>
              {item.sub && (
                <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                  {item.sub}
                </span>
              )}
            </div>

            {/* バー */}
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800/60">
              <div
                className={`h-full rounded transition-[width] duration-700 ease-out ${
                  hi
                    ? "bg-gradient-to-r from-dodger-blue to-dodger-blue-dark"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {/* 値 */}
            <span
              className={`w-12 shrink-0 text-right text-xs font-bold tabular ${
                hi ? "text-dodger-blue" : "text-gray-700 dark:text-gray-200"
              }`}
            >
              {item.display ?? item.value}
            </span>
          </div>
        );
      })}
      {lowerIsBetter && (
        <p className="pt-1 text-[10px] text-gray-400 dark:text-gray-500">
          ※ 値が小さいほど良い指標です
        </p>
      )}
    </div>
  );
}
