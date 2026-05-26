/**
 * fetch-daily-snapshot.mjs
 * MLB Stats API からタイトル争い順位を取得し、title-snapshots.json に追記する。
 * GitHub Actions から毎日21:00 JST (12:00 UTC) に実行される。
 *
 * 対象カテゴリ（NLスコープ）:
 *   homeRuns / runsBattedIn / battingAverage / earnedRunAverage / strikeouts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OHTANI_PLAYER_ID = 660271;
const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
// NLリーグID（大谷はドジャース所属）
const NL_LEAGUE_ID = 104;
const MAX_SNAPSHOTS = 90;

const SNAPSHOT_FILE = join(__dirname, "../public/data/title-snapshots.json");

const CATEGORIES = [
  { key: "homeRuns",          group: "hitting",  lowerIsBetter: false },
  { key: "runsBattedIn",      group: "hitting",  lowerIsBetter: false },
  { key: "battingAverage",    group: "hitting",  lowerIsBetter: false },
  { key: "earnedRunAverage",  group: "pitching", lowerIsBetter: true  },
  { key: "strikeouts",        group: "pitching", lowerIsBetter: false },
];

async function fetchLeaderboard(statGroup, statType, season) {
  const url =
    `${MLB_API_BASE}/stats/leaders` +
    `?leaderCategories=${statType}` +
    `&season=${season}` +
    `&leagueId=${NL_LEAGUE_ID}` +
    `&statGroup=${statGroup}` +
    `&limit=300`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "ohtani-complete-database/1.0 (+https://github.com/AlumNET-dshigami/ohtani-complete-database)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.warn(`[WARN] ${statType}: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  const leaders = data.leagueLeaders?.[0]?.leaders ?? [];
  return leaders;
}

function parseValue(person) {
  // 打率系は小数、本塁打/三振/打点は整数、ERAは小数
  const raw = person?.value;
  if (raw == null) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

async function fetchSnapshot(season) {
  const snapshot = { date: new Date().toISOString().slice(0, 10) };

  for (const cat of CATEGORIES) {
    try {
      const leaders = await fetchLeaderboard(cat.group, cat.key, season);
      const idx = leaders.findIndex(
        (l) => l.person?.id === OHTANI_PLAYER_ID
      );
      if (idx === -1) {
        snapshot[cat.key] = { rank: null, value: null };
        console.log(`[INFO] ${cat.key}: Ohtani not ranked`);
      } else {
        const entry = leaders[idx];
        const rank = entry.rank ?? idx + 1;
        const value = parseValue(entry);
        snapshot[cat.key] = { rank, value };
        console.log(`[INFO] ${cat.key}: rank=${rank}, value=${value}`);
      }
    } catch (err) {
      console.warn(`[WARN] ${cat.key}: ${err.message}`);
      snapshot[cat.key] = { rank: null, value: null };
    }
  }

  return snapshot;
}

async function main() {
  const season = new Date().getFullYear();
  console.log(`[INFO] Fetching snapshot for season ${season} ...`);

  const newSnapshot = await fetchSnapshot(season);

  // 既存ファイル読み込み
  let existing = { snapshots: [] };
  try {
    const raw = readFileSync(SNAPSHOT_FILE, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    console.log("[INFO] No existing snapshot file, starting fresh.");
  }

  // 同じ日付のエントリがあれば上書き、なければ追加
  const snapshots = existing.snapshots ?? [];
  const todayIdx = snapshots.findIndex((s) => s.date === newSnapshot.date);
  if (todayIdx >= 0) {
    snapshots[todayIdx] = newSnapshot;
    console.log(`[INFO] Updated existing entry for ${newSnapshot.date}`);
  } else {
    snapshots.push(newSnapshot);
    console.log(`[INFO] Added new entry for ${newSnapshot.date}`);
  }

  // 最新MAX_SNAPSHOTS件のみ保持（古い順に削除）
  const trimmed = snapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_SNAPSHOTS);

  writeFileSync(SNAPSHOT_FILE, JSON.stringify({ snapshots: trimmed }, null, 2), "utf-8");
  console.log(`[INFO] Snapshot saved. Total: ${trimmed.length} days.`);
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
