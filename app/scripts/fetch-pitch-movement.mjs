/**
 * fetch-pitch-movement.mjs
 * Baseball Savant Statcast Search CSV から大谷翔平（投手）の球種変化量を取得し、
 * public/data/pitch-movement.json に出力する。
 *
 * 実行: node scripts/fetch-pitch-movement.mjs
 * GitHub Actions: .github/workflows/daily-snapshot.yml に追記済み
 *
 * 出力フォーマット:
 * {
 *   "FF": { "pfx_x_avg": -8.2, "pfx_z_avg": 16.1, "speed_avg": 97.8, "spin_avg": 2290, "count": 234 },
 *   ...
 * }
 *
 * pfx_x / pfx_z は Statcast のフィート単位を インチ（×12）に変換して出力
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OHTANI_PLAYER_ID = 660271;
const OUTPUT_FILE = join(__dirname, "../public/data/pitch-movement.json");
const USER_AGENT = "OhtaniDB/1.0 (educational; github.com/AlumNET-dshigami)";

/** 球種の日本語ラベルマッピング */
const PITCH_LABELS = {
  FF: "4シーム",
  SI: "シンカー",
  FC: "カット",
  CH: "チェンジアップ",
  SL: "スライダー",
  ST: "スウィーパー",
  CU: "カーブ",
  KC: "ナックルカーブ",
  EP: "エフューズ",
  FO: "フォーク",
  SC: "スクリュー",
  KN: "ナックル",
  CS: "スローカーブ",
  SV: "スライダーバリアント",
  FS: "スプリット",
  PO: "パスボール",
};

/** CSV テキストをパース（ヘッダー + データ行に分割） */
function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvRow(lines[i]);
    if (values.length !== headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].replace(/"/g, "").trim();
    }
    rows.push(row);
  }
  return rows;
}

/** CSVの1行をカンマ分割（引用符内のカンマを考慮） */
function splitCsvRow(line) {
  const result = [];
  let current = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function fetchStatcastCsv(season) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const endDate = `${yyyy}-${mm}-${dd}`;

  const startDate = `${season}-03-20`;

  const url =
    `https://baseballsavant.mlb.com/statcast_search/csv` +
    `?player_id=${OHTANI_PLAYER_ID}` +
    `&player_type=pitcher` +
    `&type=details` +
    `&game_date_gt=${startDate}` +
    `&game_date_lt=${endDate}` +
    `&sort_col=pitches` +
    `&sort_order=desc`;

  console.log(`[fetch-pitch-movement] Fetching: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/csv,application/csv,text/plain",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from Baseball Savant`);
  }

  const text = await res.text();
  return text;
}

function aggregateByPitchType(rows) {
  /** { pitchType: { pfx_x_sum, pfx_z_sum, speed_sum, spin_sum, count } } */
  const buckets = {};

  for (const row of rows) {
    const pt = row["pitch_type"];
    if (!pt || pt === "null" || pt === "") continue;

    const pfxX = parseFloat(row["pfx_x"]);
    const pfxZ = parseFloat(row["pfx_z"]);
    const speed = parseFloat(row["release_speed"]);
    const spin = parseFloat(row["release_spin_rate"]);

    // 有効値チェック
    if (isNaN(pfxX) || isNaN(pfxZ) || isNaN(speed)) continue;

    if (!buckets[pt]) {
      buckets[pt] = { pfx_x_sum: 0, pfx_z_sum: 0, speed_sum: 0, spin_sum: 0, spin_count: 0, count: 0 };
    }
    buckets[pt].pfx_x_sum += pfxX;
    buckets[pt].pfx_z_sum += pfxZ;
    buckets[pt].speed_sum += speed;
    if (!isNaN(spin)) {
      buckets[pt].spin_sum += spin;
      buckets[pt].spin_count += 1;
    }
    buckets[pt].count += 1;
  }

  const result = {};
  for (const [pt, b] of Object.entries(buckets)) {
    if (b.count < 5) continue; // サンプル数5未満は除外

    // Statcast の pfx_x / pfx_z はフィート単位 → インチに変換（×12）
    result[pt] = {
      pfx_x_avg: parseFloat(((b.pfx_x_sum / b.count) * 12).toFixed(2)),
      pfx_z_avg: parseFloat(((b.pfx_z_sum / b.count) * 12).toFixed(2)),
      speed_avg: parseFloat((b.speed_sum / b.count).toFixed(1)),
      spin_avg: b.spin_count > 0
        ? Math.round(b.spin_sum / b.spin_count)
        : null,
      count: b.count,
      label: PITCH_LABELS[pt] ?? pt,
    };
  }
  return result;
}

async function main() {
  const season = new Date().getFullYear();

  let csvText;
  try {
    csvText = await fetchStatcastCsv(season);
  } catch (err) {
    console.error(`[fetch-pitch-movement] Fetch failed: ${err.message}`);

    // 既存ファイルがあれば変更せず終了
    if (existsSync(OUTPUT_FILE)) {
      console.log("[fetch-pitch-movement] Using existing file.");
      process.exit(0);
    }
    process.exit(1);
  }

  const rows = parseCsv(csvText);
  console.log(`[fetch-pitch-movement] Parsed ${rows.length} pitches.`);

  if (rows.length === 0) {
    console.warn("[fetch-pitch-movement] No data rows. Skipping write.");
    process.exit(0);
  }

  const aggregated = aggregateByPitchType(rows);
  const pitchTypes = Object.keys(aggregated);
  console.log(`[fetch-pitch-movement] Pitch types: ${pitchTypes.join(", ")}`);

  const output = {
    season,
    generatedAt: new Date().toISOString(),
    totalPitches: rows.length,
    pitches: aggregated,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(`[fetch-pitch-movement] Written to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
