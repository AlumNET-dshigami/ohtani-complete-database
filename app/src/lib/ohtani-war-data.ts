// WAR data for Shohei Ohtani
// Source: FanGraphs Leaders (https://www.fangraphs.com/leaders/war)
// bWAR: Baseball-Reference (https://www.baseball-reference.com/players/o/ohtansh01.shtml)
// fWAR: FanGraphs
// Updated with season-end values. Current in-progress season falls back to simple estimate.

export interface OhtaniWAREntry {
  season: string;
  league: "NPB" | "MLB";
  bWAR: number | null;  // Baseball-Reference WAR
  fWAR: number | null;  // FanGraphs WAR (primary source)
  note?: string;
}

export const OHTANI_WAR_HISTORY: OhtaniWAREntry[] = [
  { season: "2013", league: "NPB", bWAR: 0.3, fWAR: 0.3, note: "NPBルーキー" },
  { season: "2014", league: "NPB", bWAR: 3.4, fWAR: 3.4 },
  { season: "2015", league: "NPB", bWAR: 2.5, fWAR: 2.5 },
  { season: "2016", league: "NPB", bWAR: 5.8, fWAR: 5.8, note: "NPB MVP" },
  { season: "2017", league: "NPB", bWAR: 2.0, fWAR: 2.0 },
  { season: "2018", league: "MLB", bWAR: 2.8, fWAR: 3.8, note: "AL新人王" },
  { season: "2019", league: "MLB", bWAR: -0.1, fWAR: -0.2, note: "打者専念" },
  { season: "2020", league: "MLB", bWAR: -0.4, fWAR: -0.4, note: "短縮60試合" },
  { season: "2021", league: "MLB", bWAR: 9.1, fWAR: 8.1, note: "AL MVP（満票）" },
  { season: "2022", league: "MLB", bWAR: 9.6, fWAR: 9.5 },
  { season: "2023", league: "MLB", bWAR: 10.0, fWAR: 9.0, note: "AL MVP（満票）" },
  { season: "2024", league: "MLB", bWAR: 9.2, fWAR: 9.1, note: "NL MVP・50-50達成（DH専念）" },
  { season: "2025", league: "MLB", bWAR: 9.5, fWAR: 9.4, note: "NL MVP（二刀流復活・打7.5+投1.9）" },
];

export function getRealWAR(season: string): OhtaniWAREntry | null {
  return OHTANI_WAR_HISTORY.find((e) => e.season === season) ?? null;
}
