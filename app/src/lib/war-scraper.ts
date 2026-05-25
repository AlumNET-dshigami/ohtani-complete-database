// Source: https://nobita-retire.com/{year}-mlb-war/
// fWAR origin: FanGraphs / rWAR origin: Baseball Reference (per source page disclosure).

import * as cheerio from "cheerio";

export interface WARSplit {
  fWAR: number | null;
  rWAR: number | null;
}

export interface WARSnapshot {
  year: number;
  fetchedAt: string; // ISO datetime
  sourceUpdatedAt: string | null; // YYYY-MM-DD parsed from page text
  batting: WARSplit;
  pitching: WARSplit;
  total: WARSplit;
  extras: {
    ops: string | null;
    era: string | null;
    hr: number | null;
    wins: number | null;
  };
  sourceUrl: string;
}

const USER_AGENT =
  "OhtaniCompleteDatabase/1.0 (+https://ohtani-complete-database.vercel.app; respect-robots)";

// Vercel's Hobby plan caps serverless function execution at 10s, so the
// previous hard-coded 15s timeout could never actually fire — the platform
// would kill the request first. Default to 8s (safely inside the 10s
// budget, leaves ~2s for parsing + render) and allow override via env for
// Pro plans / local dev that have longer budgets. Clamped to a sane range
// so a stray "WAR_FETCH_TIMEOUT_MS=foo" or "WAR_FETCH_TIMEOUT_MS=999999"
// can't silently break fetches.
const DEFAULT_FETCH_TIMEOUT_MS = 8_000;
const MIN_FETCH_TIMEOUT_MS = 1_000;
const MAX_FETCH_TIMEOUT_MS = 30_000;

function resolveFetchTimeoutMs(): number {
  const raw = process.env.WAR_FETCH_TIMEOUT_MS;
  if (raw === undefined || raw === "") return DEFAULT_FETCH_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_FETCH_TIMEOUT_MS;
  return Math.min(MAX_FETCH_TIMEOUT_MS, Math.max(MIN_FETCH_TIMEOUT_MS, parsed));
}

const FETCH_TIMEOUT_MS = resolveFetchTimeoutMs();

function buildSourceUrl(year: number): string {
  return `https://nobita-retire.com/${year}-mlb-war/`;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.replace(/[^\d.\-]/g, "");
  if (trimmed === "" || trimmed === "-" || trimmed === ".") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseInteger(value: string | undefined): number | null {
  const n = parseNumber(value);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * Parse "※2026年4月29日更新" or "2026年4月29日" style text into "YYYY-MM-DD".
 * Exported for unit testing; production callers should use parseWARHtml.
 */
export function parseUpdatedDate(text: string): string | null {
  if (!text) return null;
  const m = text.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * One table from the page paired with the most recent heading and its
 * row-by-row text + parsed cells, so downstream code can classify it
 * without re-walking the DOM.
 *
 * The source page uses many headless tables (no class/id), so heading text
 * and header column composition are the only reliable classifiers.
 */
interface TableSnapshot {
  heading: string;
  headerCells: string[];
  rows: Array<{ cells: string[]; rowText: string }>;
}

function collectTables($: cheerio.CheerioAPI): TableSnapshot[] {
  const snapshots: TableSnapshot[] = [];
  let currentHeading = "";

  $("body")
    .find("h1, h2, h3, h4, table")
    .each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      if (!tag) return;

      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
        currentHeading = $(el).text().trim();
        return;
      }

      if (tag !== "table") return;

      const $table = $(el);
      const $rows = $table.find("tr");
      const headerRow = $rows.filter((__, tr) => $(tr).find("th").length > 0).first();
      const $headerRow = headerRow.length > 0 ? headerRow : $rows.first();
      const headerCells: string[] = [];
      $headerRow.find("th, td").each((__, c) => {
        headerCells.push($(c).text().trim());
      });

      const rows: Array<{ cells: string[]; rowText: string }> = [];
      $rows.each((__, tr) => {
        const $tr = $(tr);
        if ($tr.find("th").length > 0) return; // header row
        const cells: string[] = [];
        $tr.find("td").each((___, c) => {
          cells.push($(c).text().trim());
        });
        if (cells.length === 0) return;
        rows.push({ cells, rowText: $tr.text() });
      });

      snapshots.push({ heading: currentHeading, headerCells, rows });
    });

  return snapshots;
}

function zipRow(headers: string[], cells: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  cells.forEach((value, i) => {
    const key = headers[i] ?? `col${i}`;
    result[key] = value;
  });
  return result;
}

function extractWARPair(cells: Record<string, string>): WARSplit {
  const fKey = Object.keys(cells).find((k) => /fWAR/i.test(k));
  const rKey = Object.keys(cells).find((k) => /rWAR/i.test(k));
  return {
    fWAR: fKey ? parseNumber(cells[fKey]) : null,
    rWAR: rKey ? parseNumber(cells[rKey]) : null,
  };
}

function findOhtaniRow(
  table: TableSnapshot
): Record<string, string> | null {
  const row = table.rows.find(
    (r) => r.rowText.includes("大谷翔平") || r.rowText.includes("大谷 翔平")
  );
  if (!row) return null;
  return zipRow(table.headerCells, row.cells);
}

export async function fetchWARFromNobitaRetire(year: number): Promise<WARSnapshot> {
  const url = buildSourceUrl(year);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    }
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  return parseWARHtml(html, year, url);
}

export function parseWARHtml(html: string, year: number, url: string): WARSnapshot {
  const $ = cheerio.load(html);
  const tables = collectTables($);
  const fetchedAt = new Date().toISOString();
  const sourceUpdatedAt = parseUpdatedDate($("body").text());

  // 1) The page contains a dedicated <大谷の内訳> table with two rows
  //    ("大谷・野手" / "大谷・投手"). When present, it is the most reliable
  //    source for batting-only and pitching-only WAR.
  let batting: WARSplit = { fWAR: null, rWAR: null };
  let pitching: WARSplit = { fWAR: null, rWAR: null };

  for (const t of tables) {
    const isBreakdown = t.headerCells.some((h) => /大谷/.test(h) && /内訳/.test(h));
    if (!isBreakdown) continue;
    for (const r of t.rows) {
      const label = r.cells[0] ?? "";
      const row = zipRow(t.headerCells, r.cells);
      if (label.includes("野手")) batting = extractWARPair(row);
      else if (label.includes("投手")) pitching = extractWARPair(row);
    }
    break;
  }

  // 2) The "野手＋投手" leaderboard gives the consolidated total directly.
  const isTotalHeader = (t: TableSnapshot) =>
    t.headerCells.some((h) => /OPS/i.test(h)) &&
    t.headerCells.some((h) => /ERA/i.test(h));
  const isPitchingHeader = (t: TableSnapshot) =>
    t.headerCells.some((h) => /ERA/i.test(h)) &&
    !t.headerCells.some((h) => /OPS/i.test(h));
  const isBattingHeader = (t: TableSnapshot) =>
    t.headerCells.some((h) => /OPS/i.test(h)) &&
    !t.headerCells.some((h) => /ERA/i.test(h));

  const pickWith = (
    filter: (t: TableSnapshot) => boolean,
    headingPriority: string[]
  ): { table: TableSnapshot; row: Record<string, string> } | null => {
    const candidates = tables.filter(filter);
    for (const kw of headingPriority) {
      for (const t of candidates) {
        if (!t.heading.includes(kw)) continue;
        const row = findOhtaniRow(t);
        if (row) return { table: t, row };
      }
    }
    for (const t of candidates) {
      const row = findOhtaniRow(t);
      if (row) return { table: t, row };
    }
    return null;
  };

  const totalHit = pickWith(isTotalHeader, ["MLB全体", "ナ・リーグ", "ア・リーグ"]);
  const total: WARSplit = totalHit
    ? extractWARPair(totalHit.row)
    : { fWAR: null, rWAR: null };

  // 3) Pitcher leaderboard gives ERA + wins for the extras block, and is a
  //    secondary source for pitching WAR if the breakdown table is missing.
  const pitchingHit = pickWith(isPitchingHeader, [
    "MLB全体",
    "ナ・リーグ",
    "ア・リーグ",
  ]);
  if (pitching.fWAR === null && pitchingHit) {
    pitching = extractWARPair(pitchingHit.row);
  }

  // 4) Batting leaderboard rarely lists Ohtani while he is on a pitcher
  //    track, but try anyway for OPS/HR extras.
  const battingHit = pickWith(isBattingHeader, [
    "MLB全体",
    "ナ・リーグ",
    "ア・リーグ",
  ]);
  if (batting.fWAR === null && battingHit) {
    batting = extractWARPair(battingHit.row);
  }

  // Derive missing legs from the others when possible (e.g. batting WAR
  // when the breakdown table is gone but total + pitching are present).
  if (batting.fWAR === null && total.fWAR !== null && pitching.fWAR !== null) {
    batting.fWAR = Math.round((total.fWAR - pitching.fWAR) * 100) / 100;
  }
  if (batting.rWAR === null && total.rWAR !== null && pitching.rWAR !== null) {
    batting.rWAR = Math.round((total.rWAR - pitching.rWAR) * 100) / 100;
  }
  if (total.fWAR === null && batting.fWAR !== null && pitching.fWAR !== null) {
    total.fWAR = Math.round((batting.fWAR + pitching.fWAR) * 100) / 100;
  }
  if (total.rWAR === null && batting.rWAR !== null && pitching.rWAR !== null) {
    total.rWAR = Math.round((batting.rWAR + pitching.rWAR) * 100) / 100;
  }

  // Extras: prefer total table for OPS, pitching table for ERA / wins,
  // batting table for HR.
  const opsRow = totalHit?.row ?? battingHit?.row;
  const opsKey = opsRow ? Object.keys(opsRow).find((k) => /OPS/i.test(k)) : undefined;
  const ops = opsRow && opsKey ? opsRow[opsKey] || null : null;

  let era: string | null = null;
  let wins: number | null = null;
  if (pitchingHit) {
    const eraKey = Object.keys(pitchingHit.row).find((k) => /ERA/i.test(k));
    if (eraKey) era = pitchingHit.row[eraKey] || null;
    const winKey = Object.keys(pitchingHit.row).find((k) => /勝/.test(k));
    if (winKey) wins = parseInteger(pitchingHit.row[winKey]);
  }

  let hr: number | null = null;
  if (battingHit) {
    const hrKey = Object.keys(battingHit.row).find(
      (k) => /本/.test(k) && !/勝/.test(k)
    );
    if (hrKey) hr = parseInteger(battingHit.row[hrKey]);
  }

  return {
    year,
    fetchedAt,
    sourceUpdatedAt,
    batting,
    pitching,
    total,
    extras: { ops, era, hr, wins },
    sourceUrl: url,
  };
}

// ============================================================================
// 機能C: WARランキング（TOP20 + 大谷の二刀流内訳）
// ----------------------------------------------------------------------------
// nobita-retire の「野手＋投手」合算テーブル（各20行=TOP20）からランキングを取得。
// 実データ検証で確認: table heading が「MLB全体（野手＋投手）」「ナ・リーグ（野手＋
// 投手）」で、列は 順位|Name|Team|fWAR|rWAR|平均WAR|OPS|ERA。
// ============================================================================

export type WARScope = "MLB" | "NL" | "AL";
export type WARMetric = "fWAR" | "rWAR";

export interface WARRankEntry {
  rank: number;
  name: string;
  team: string;
  fWAR: number | null;
  rWAR: number | null;
  isOhtani: boolean;
}

export interface WARRankingResult {
  scope: WARScope;
  entries: WARRankEntry[];
  /** 大谷の順位（ランキング内に居れば） */
  ohtaniRank: number | null;
  ohtaniEntry: WARRankEntry | null;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
}

const SCOPE_KEYWORDS: Record<WARScope, string[]> = {
  MLB: ["MLB全体"],
  NL: ["ナ・リーグ", "ナリーグ"],
  AL: ["ア・リーグ", "アリーグ"],
};

function isOhtaniName(name: string): boolean {
  return name.includes("大谷");
}

/** 「野手＋投手」合算テーブルか（ヘッダにOPSとERAの両方を含むのが合算表の特徴） */
function isCombinedTable(t: TableSnapshot): boolean {
  const h = t.headerCells.join("|");
  return /OPS/i.test(h) && /ERA/i.test(h) && /fWAR/i.test(h);
}

/**
 * 指定スコープの「野手＋投手」合算 WAR ランキング（TOP20）を抽出。
 */
export function parseWARRankingHtml(
  html: string,
  scope: WARScope,
  url: string
): WARRankingResult {
  const $ = cheerio.load(html);
  const tables = collectTables($);
  const fetchedAt = new Date().toISOString();
  const sourceUpdatedAt = parseUpdatedDate($("body").text());

  // スコープ一致 ＆ 合算テーブルを探す。「野手＋投手」見出しを優先。
  const keywords = SCOPE_KEYWORDS[scope];
  const candidates = tables.filter(
    (t) => isCombinedTable(t) && keywords.some((kw) => t.heading.includes(kw))
  );
  // 「野手＋投手」を明示的に含むものを最優先
  const combined =
    candidates.find((t) => /野手.?＋?.?投手|野手\+投手/.test(t.heading)) ??
    candidates[0] ??
    null;

  const empty: WARRankingResult = {
    scope,
    entries: [],
    ohtaniRank: null,
    ohtaniEntry: null,
    sourceUrl: url,
    sourceUpdatedAt,
    fetchedAt,
  };
  if (!combined) return empty;

  const H = combined.headerCells;
  const idxOf = (re: RegExp) => H.findIndex((h) => re.test(h));
  const iName = idxOf(/Name|名前|選手/i);
  const iTeam = idxOf(/Team|チーム/i);
  const iF = idxOf(/fWAR/i);
  const iR = idxOf(/rWAR/i);

  if (iName === -1 || (iF === -1 && iR === -1)) return empty;

  const entries: WARRankEntry[] = combined.rows
    .map((row, i) => {
      const cells = row.cells;
      const name = (cells[iName] ?? "").trim();
      if (!name) return null;
      return {
        rank: i + 1,
        name,
        team: iTeam >= 0 ? (cells[iTeam] ?? "").trim() : "",
        fWAR: iF >= 0 ? parseNumber(cells[iF]) : null,
        rWAR: iR >= 0 ? parseNumber(cells[iR]) : null,
        isOhtani: isOhtaniName(name),
      } as WARRankEntry;
    })
    .filter((e): e is WARRankEntry => e !== null);

  const ohtaniIdx = entries.findIndex((e) => e.isOhtani);
  const ohtaniEntry = ohtaniIdx >= 0 ? entries[ohtaniIdx] : null;

  return {
    scope,
    entries,
    ohtaniRank: ohtaniEntry?.rank ?? null,
    ohtaniEntry,
    sourceUrl: url,
    sourceUpdatedAt,
    fetchedAt,
  };
}

/**
 * TOP20 WAR ランキングをライブ取得（失敗時は entries 空で返る＝graceful degrade）。
 */
export async function fetchWARRanking(
  year: number,
  scope: WARScope
): Promise<WARRankingResult> {
  const url = buildSourceUrl(year);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8",
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return parseWARRankingHtml(html, scope, url);
  } catch {
    return {
      scope,
      entries: [],
      ohtaniRank: null,
      ohtaniEntry: null,
      sourceUrl: url,
      sourceUpdatedAt: null,
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
