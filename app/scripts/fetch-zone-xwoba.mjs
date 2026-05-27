/**
 * fetch-zone-xwoba.mjs
 * Baseball Savant の Statcast CSV から大谷翔平のゾーン別 xwOBA・バレル率を集計し、
 * zone-xwoba.json に保存する。
 * GitHub Actions から毎日21:00 JST (12:00 UTC) に実行される。
 *
 * Baseball Savant のゾーン番号 (MLB標準):
 *   ストライクゾーン: 1〜9 (3×3グリッド、左上=1, 右下=9)
 *   ボールゾーン   : 11(左上), 12(右上), 13(左下), 14(右下)
 *
 * バレル判定: launch_speed_angle === "6" (MLBの分類コード)
 * xwOBA     : estimated_woba_using_speedangle フィールド
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OHTANI_PLAYER_ID = 660271;
// 2026シーズン開幕日
const SEASON_START = "2026-03-28";
const BARREL_LSA_CODE = "6"; // launch_speed_angle=6 がバレル

const OUTPUT_FILE = join(__dirname, "../public/data/zone-xwoba.json");

/** Baseball Savant から Statcast CSVを取得してテキストを返す */
async function fetchStatcastCsv(season) {
  const today = new Date().toISOString().slice(0, 10);
  const seasonStart = season === 2026 ? SEASON_START : `${season}-03-28`;

  const url =
    `https://baseballsavant.mlb.com/statcast_search/csv` +
    `?player_id=${OHTANI_PLAYER_ID}` +
    `&player_type=batter` +
    `&type=details` +
    `&game_date_gt=${seasonStart}` +
    `&game_date_lt=${today}` +
    `&sort_col=pitches` +
    `&sort_order=desc`;

  console.log(`[INFO] Fetching Statcast CSV: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "OhtaniDB/1.0 (educational; github.com/AlumNET-dshigami/ohtani-complete-database)",
      Accept: "text/csv,*/*",
    },
    // GitHub Actions では Node 20 の fetch を使う（タイムアウトなし設定はシグナルで行う）
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Baseball Savant responded with HTTP ${res.status}`);
  }

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  console.log(`[INFO] CSV received: ${lines.length} lines (including header)`);
  return text;
}

/** CSV テキストを解析してゾーン別統計を集計する */
function aggregateCsv(csvText) {
  const lines = csvText.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    throw new Error("CSV has no data rows");
  }

  // ヘッダー解析（BOMを除去）
  const headerLine = lines[0].replace(/^﻿/, "");
  const headers = parseCSVLine(headerLine);

  const idxZone = headers.indexOf("zone");
  const idxXwoba = headers.indexOf("estimated_woba_using_speedangle");
  const idxLsa = headers.indexOf("launch_speed_angle");

  if (idxZone === -1 || idxXwoba === -1 || idxLsa === -1) {
    throw new Error(
      `Required columns not found. zone=${idxZone}, estimated_woba_using_speedangle=${idxXwoba}, launch_speed_angle=${idxLsa}`
    );
  }

  console.log(
    `[INFO] Column indices: zone=${idxZone}, xwoba=${idxXwoba}, lsa=${idxLsa}`
  );

  // ゾーン別集計
  const zoneStats = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < Math.max(idxZone, idxXwoba, idxLsa) + 1) continue;

    const zone = (cols[idxZone] ?? "").trim().replace(/^"(.*)"$/, "$1");
    const xwobaStr = (cols[idxXwoba] ?? "").trim().replace(/^"(.*)"$/, "$1");
    const lsa = (cols[idxLsa] ?? "").trim().replace(/^"(.*)"$/, "$1");

    if (!zone) continue;

    if (!zoneStats[zone]) {
      zoneStats[zone] = {
        pitches: 0,
        xwobaSum: 0.0,
        xwobaCount: 0,
        barrels: 0,
        battedBalls: 0,
      };
    }

    zoneStats[zone].pitches++;

    // xwOBA は投球毎に存在することがある（スイングのみ or 全投球）
    if (xwobaStr !== "") {
      const xwoba = parseFloat(xwobaStr);
      if (Number.isFinite(xwoba)) {
        zoneStats[zone].xwobaSum += xwoba;
        zoneStats[zone].xwobaCount++;
      }
    }

    // バレル: launch_speed_angle がある＝打球結果あり
    if (lsa !== "") {
      zoneStats[zone].battedBalls++;
      if (lsa === BARREL_LSA_CODE) {
        zoneStats[zone].barrels++;
      }
    }
  }

  // 結果オブジェクトに変換
  const zones = {};
  for (const [zone, stats] of Object.entries(zoneStats)) {
    const xwoba =
      stats.xwobaCount > 0
        ? Math.round((stats.xwobaSum / stats.xwobaCount) * 1000) / 1000
        : null;
    const barrelRate =
      stats.battedBalls > 0
        ? Math.round((stats.barrels / stats.battedBalls) * 1000) / 1000
        : null;

    zones[zone] = {
      xwoba,
      barrelRate,
      pitches: stats.pitches,
      battedBalls: stats.battedBalls,
      barrels: stats.barrels,
    };
  }

  return zones;
}

/**
 * シンプルなCSV行パーサー（ダブルクォート内のカンマを考慮）
 * RFC 4180 に準拠した最小実装
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const season = new Date().getFullYear();
  console.log(`[INFO] Starting zone xwOBA fetch for season ${season}`);

  // 既存ファイルのバックアップ（エラー時に上書きしないため）
  let existingContent = null;
  if (existsSync(OUTPUT_FILE)) {
    existingContent = readFileSync(OUTPUT_FILE, "utf-8");
    console.log("[INFO] Existing zone-xwoba.json found, will backup on error");
  }

  let csvText;
  try {
    csvText = await fetchStatcastCsv(season);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch Statcast CSV: ${err.message}`);
    // 既存ファイルがあれば上書きしない
    if (existingContent) {
      console.log("[INFO] Keeping existing zone-xwoba.json unchanged");
    }
    process.exit(1);
  }

  let zones;
  try {
    zones = aggregateCsv(csvText);
  } catch (err) {
    console.error(`[ERROR] Failed to aggregate CSV: ${err.message}`);
    if (existingContent) {
      console.log("[INFO] Keeping existing zone-xwoba.json unchanged");
    }
    process.exit(1);
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    season,
    zones,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `[INFO] zone-xwoba.json saved. Zones: ${Object.keys(zones).join(", ")}`
  );

  // サマリーログ
  for (const [zone, stats] of Object.entries(zones)) {
    const zoneInt = parseInt(zone);
    const label = zoneInt >= 1 && zoneInt <= 9 ? `SZ${zone}` : `BZ${zone}`;
    console.log(
      `[INFO]   ${label}: pitches=${stats.pitches}, xwoba=${stats.xwoba ?? "N/A"}, barrelRate=${stats.barrelRate ?? "N/A"} (${stats.barrels}/${stats.battedBalls} batted)`
    );
  }
}

main().catch((err) => {
  console.error("[ERROR] Unhandled:", err);
  process.exit(1);
});
