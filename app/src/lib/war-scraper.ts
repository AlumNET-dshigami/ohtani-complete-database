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
