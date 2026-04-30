// End-to-end-ish sanity test: replicate war-source.ts's fallback logic
// using JS-only imports to confirm both branches behave correctly.

import * as cheerio from "cheerio";
import manual from "../src/data/current-season-war.json" with { type: "json" };

const USER_AGENT = "OhtaniCompleteDatabase/1.0 (+verify-pipeline)";

async function fetchWAR(year) {
  const url = `https://nobita-retire.com/${year}-mlb-war/`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  let currentHeading = "";
  const tables = [];
  $("body").find("h1, h2, h3, h4, table").each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (/^h[1-4]$/.test(tag)) { currentHeading = $(el).text().trim(); return; }
    if (tag !== "table") return;
    const $t = $(el);
    const $rows = $t.find("tr");
    const headerRow = $rows.filter((__, tr) => $(tr).find("th").length > 0).first();
    const $h = headerRow.length > 0 ? headerRow : $rows.first();
    const headerCells = $h.find("th, td").map((__, c) => $(c).text().trim()).get();
    const rows = [];
    $rows.each((__, tr) => {
      const $tr = $(tr);
      if ($tr.find("th").length > 0) return;
      const cells = $tr.find("td").map((___, c) => $(c).text().trim()).get();
      if (cells.length === 0) return;
      rows.push({ cells, rowText: $tr.text() });
    });
    tables.push({ heading: currentHeading, headerCells, rows });
  });

  let batting = { fWAR: null, rWAR: null };
  let pitching = { fWAR: null, rWAR: null };
  for (const t of tables) {
    if (!t.headerCells.some((h) => /大谷/.test(h) && /内訳/.test(h))) continue;
    for (const r of t.rows) {
      const f = parseFloat(r.cells[1]);
      const rb = parseFloat(r.cells[2]);
      if (r.cells[0]?.includes("野手")) batting = { fWAR: f, rWAR: rb };
      else if (r.cells[0]?.includes("投手")) pitching = { fWAR: f, rWAR: rb };
    }
  }
  return { batting, pitching, year };
}

async function getCurrentWAR(year) {
  try {
    const live = await fetchWAR(year);
    if (live.batting.fWAR !== null || live.pitching.fWAR !== null) {
      return { source: "live", snapshot: live };
    }
  } catch {}
  return { source: "manual", snapshot: manual };
}

const liveResult = await getCurrentWAR(2026);
console.log("[2026 live path] source =", liveResult.source);
console.log("  batting:", liveResult.snapshot.batting);
console.log("  pitching:", liveResult.snapshot.pitching);

const fallbackResult = await getCurrentWAR(9999);
console.log("\n[9999 fallback path] source =", fallbackResult.source);
console.log("  total:", fallbackResult.snapshot.total);
console.log("  sourceUpdatedAt:", fallbackResult.snapshot.sourceUpdatedAt);
