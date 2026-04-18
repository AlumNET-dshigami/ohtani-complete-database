// Top MLB star players for comparison with Ohtani

export interface StarPlayer {
  id: number;
  nameJa: string;
  type: "batter" | "pitcher" | "both";
}

export const MLB_STAR_BATTERS: StarPlayer[] = [
  { id: 660271, nameJa: "大谷 翔平", type: "both" },
  { id: 592450, nameJa: "アーロン・ジャッジ", type: "batter" },
  { id: 665742, nameJa: "フアン・ソト", type: "batter" },
  { id: 605141, nameJa: "ムーキー・ベッツ", type: "batter" },
  { id: 518692, nameJa: "フレディ・フリーマン", type: "batter" },
  { id: 660670, nameJa: "ロナルド・アクーニャ Jr.", type: "batter" },
  { id: 677951, nameJa: "ボビー・ウィット Jr.", type: "batter" },
  { id: 608070, nameJa: "ホセ・ラミレス", type: "batter" },
  { id: 665489, nameJa: "ブラディミール・ゲレーロ Jr.", type: "batter" },
  { id: 608369, nameJa: "コーリー・シーガー", type: "batter" },
];

export const MLB_STAR_PITCHERS: StarPlayer[] = [
  { id: 660271, nameJa: "大谷 翔平", type: "both" },
  { id: 694973, nameJa: "ポール・スキーンズ", type: "pitcher" },
  { id: 669373, nameJa: "タリック・スクーバル", type: "pitcher" },
  { id: 543037, nameJa: "ゲリット・コール", type: "pitcher" },
  { id: 808967, nameJa: "山本 由伸", type: "pitcher" },
  { id: 605400, nameJa: "ザック・ウィーラー", type: "pitcher" },
  { id: 656302, nameJa: "コール・レーガンズ", type: "pitcher" },
  { id: 592332, nameJa: "フレディー・パラルタ", type: "pitcher" },
];
