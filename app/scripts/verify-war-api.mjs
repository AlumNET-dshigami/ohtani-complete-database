// Quick verification: hit /api/current-war and the homepage to confirm the
// 3-tier WAR pipeline is wired up. Run while `next dev` is up on port 3018.

const PORT = process.env.PORT ?? "3018";

async function hit(path) {
  const url = `http://localhost:${PORT}${path}`;
  const start = Date.now();
  const res = await fetch(url, { headers: { "User-Agent": "verify-script" } });
  const ms = Date.now() - start;
  const body = await res.text();
  return { url, status: res.status, ms, body };
}

const api = await hit("/api/current-war");
console.log("--- /api/current-war ---");
console.log("status:", api.status, `(${api.ms}ms)`);
try {
  const json = JSON.parse(api.body);
  console.log(JSON.stringify(json, null, 2));
} catch {
  console.log(api.body.slice(0, 500));
}

const home = await hit("/");
console.log("\n--- / (snippet) ---");
console.log("status:", home.status, `(${home.ms}ms)`);
const sourceLine = home.body.match(/出典: nobita-retire[\s\S]{0,200}/);
console.log("source attribution found:", sourceLine ? sourceLine[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200) : "NOT FOUND");
const warSection = home.body.match(/シーズン WAR[\s\S]{0,1500}/);
console.log("\nWAR section snippet:");
console.log(warSection ? warSection[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600) : "NOT FOUND");
