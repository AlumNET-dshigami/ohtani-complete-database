// Standalone test for parseUpdatedDate.
//
// The repo doesn't yet have vitest/jest configured, so we mirror the
// approach used by scripts/verify-pipeline.mjs: re-implement the small
// pure function in JS and assert the same set of cases the production
// TS code is expected to handle. parseUpdatedDate is exported from
// app/src/lib/war-scraper.ts (kept in sync with this file) so once a
// real test runner lands the cases below can be ported verbatim.
//
// Run: `node --test app/scripts/test-parse-updated-date.mjs`

import { test } from "node:test";
import assert from "node:assert/strict";

// Mirror of parseUpdatedDate from app/src/lib/war-scraper.ts.
// If the regex changes there, update both — the assertions below are
// the spec for what callers can rely on.
function parseUpdatedDate(text) {
  if (!text) return null;
  const m = text.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

test("parses standard '※YYYY年M月D日更新' marker", () => {
  assert.equal(parseUpdatedDate("※2026年4月29日更新。"), "2026-04-29");
});

test("zero-pads two-digit months", () => {
  assert.equal(parseUpdatedDate("2026年12月1日"), "2026-12-01");
});

test("handles bare 'YYYY年M月D日' without the leading marker", () => {
  assert.equal(parseUpdatedDate("2026年4月29日"), "2026-04-29");
});

test("tolerates whitespace between number and unit", () => {
  assert.equal(parseUpdatedDate("2026年 4月 29日"), "2026-04-29");
});

test("returns null when no date is present", () => {
  assert.equal(parseUpdatedDate("日付なし"), null);
});

test("returns null on empty input", () => {
  assert.equal(parseUpdatedDate(""), null);
});
