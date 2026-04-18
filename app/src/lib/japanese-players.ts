// Japanese name translations for players (when we know them)
// The list of players is fetched dynamically via birthCountry === "Japan"
export const JAPANESE_NAME_OVERRIDES: Record<number, string> = {
  660271: "大谷 翔平",
  683002: "山本 由伸",
  684007: "今永 昇太",
  808982: "佐々木 朗希",
  673540: "千賀 滉大",
  673548: "鈴木 誠也",
  676127: "吉田 正尚",
  506433: "ダルビッシュ 有",
  628317: "前田 健太",
  695338: "上沢 直之",
};

export function getJapaneseName(playerId: number): string | undefined {
  return JAPANESE_NAME_OVERRIDES[playerId];
}
