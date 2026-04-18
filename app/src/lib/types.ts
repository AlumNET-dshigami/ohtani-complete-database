export interface BattingStats {
  season: string;
  team: string;
  league: string;
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  baseOnBalls: number;
  strikeOuts: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
}

export interface PitchingStats {
  season: string;
  team: string;
  league: string;
  wins: number;
  losses: number;
  era: string;
  gamesPlayed: number;
  gamesStarted: number;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  baseOnBalls: number;
  strikeOuts: number;
  whip: string;
  strikeoutsPer9: string;
}

export interface SeasonStats {
  season: string;
  batting: BattingStats | null;
  pitching: PitchingStats | null;
}

export interface PlayerInfo {
  id: number;
  fullName: string;
  currentTeam: string;
  position: string;
  batSide: string;
  throwSide: string;
  height: string;
  weight: number;
  birthDate: string;
  birthCountry: string;
  number: string;
}

export interface GameLogBatting {
  date: string;
  rawDate: string;
  opponent: string;
  gamePk: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  baseOnBalls: number;
  strikeOuts: number;
  stolenBases: number;
  avg: string;
}

export interface GameLogPitching {
  date: string;
  rawDate: string;
  opponent: string;
  gamePk: number;
  result: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  baseOnBalls: number;
  strikeOuts: number;
  homeRuns: number;
  era: string;
}

export interface VideoHighlight {
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface PeriodStats {
  period: string;
  games: number;
  atBats: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  avg: string;
  ops: string;
}

export interface WARChartEntry {
  season: string;
  bWAR: number | null;
  fWAR: number | null;
  estimate: number | null;
  league: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}
