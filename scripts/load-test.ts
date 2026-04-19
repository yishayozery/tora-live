/**
 * Simple load test — fires N concurrent requests against key pages.
 * Usage: node --env-file=.env --import tsx scripts/load-test.ts [concurrency] [total]
 */
const BASE = process.env.TORA_LIVE_URL || "http://localhost:3000";
const PAGES = [
  "/",
  "/lessons",
  "/rabbis",
  "/rabbi/eliezer-melamed",
  "/rabbi/aharon-cohen",
  "/about",
  "/donate",
];

type Result = { url: string; status: number; ms: number; ok: boolean };

async function hit(url: string): Promise<Result> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { "User-Agent": "tora-load-test" } });
    await res.text();  // drain body
    return { url, status: res.status, ms: Date.now() - t0, ok: res.ok };
  } catch (e: any) {
    return { url, status: 0, ms: Date.now() - t0, ok: false };
  }
}

async function main() {
  const concurrency = parseInt(process.argv[2] || "10", 10);
  const total = parseInt(process.argv[3] || "100", 10);
  console.log(`🔥 Load test against ${BASE}`);
  console.log(`   Concurrency: ${concurrency}, Total requests: ${total}`);

  const jobs: Promise<Result>[] = [];
  const pending = new Set<Promise<Result>>();
  const results: Result[] = [];
  const t0 = Date.now();

  for (let i = 0; i < total; i++) {
    const page = PAGES[i % PAGES.length];
    const p = hit(BASE + page).then((r) => { pending.delete(p); return r; });
    pending.add(p);
    jobs.push(p);
    if (pending.size >= concurrency) {
      const r = await Promise.race(pending);
      results.push(r);
    }
  }
  const remaining = await Promise.all(jobs.filter(j => pending.has(j) || !results.includes({} as any)));
  results.push(...remaining.filter(r => !results.includes(r)));

  const total_ms = Date.now() - t0;

  // Stats per page
  const byPage: Record<string, Result[]> = {};
  for (const r of results) {
    const path = r.url.replace(BASE, "");
    (byPage[path] ||= []).push(r);
  }

  console.log(`\n📊 סיכום (${total_ms}ms סה״כ, ${(total / (total_ms / 1000)).toFixed(1)} req/s):\n`);
  console.log("דף                              | n   | min   | avg   | max   | p95   | ok%");
  console.log("─".repeat(82));
  for (const [path, rs] of Object.entries(byPage)) {
    const times = rs.map(r => r.ms).sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const p95 = times[Math.floor(times.length * 0.95)];
    const ok = (rs.filter(r => r.ok).length / rs.length * 100).toFixed(0);
    console.log(`${path.padEnd(31)} | ${String(rs.length).padStart(3)} | ${String(min).padStart(4)}ms | ${String(avg).padStart(4)}ms | ${String(max).padStart(4)}ms | ${String(p95).padStart(4)}ms | ${ok}%`);
  }

  const allTimes = results.map(r => r.ms).sort((a, b) => a - b);
  const allOk = results.filter(r => r.ok).length;
  console.log("─".repeat(82));
  console.log(`\n📈 כולל:`);
  console.log(`   Total:     ${results.length}`);
  console.log(`   Successful: ${allOk} (${(allOk / results.length * 100).toFixed(0)}%)`);
  console.log(`   Failed:    ${results.length - allOk}`);
  console.log(`   Avg:       ${Math.round(allTimes.reduce((a,b)=>a+b,0) / allTimes.length)}ms`);
  console.log(`   p50:       ${allTimes[Math.floor(allTimes.length * 0.5)]}ms`);
  console.log(`   p95:       ${allTimes[Math.floor(allTimes.length * 0.95)]}ms`);
  console.log(`   p99:       ${allTimes[Math.floor(allTimes.length * 0.99)]}ms`);

  // Errors
  const errors = results.filter(r => !r.ok);
  if (errors.length) {
    console.log(`\n❌ שגיאות (${errors.length}):`);
    const byStatus: Record<number, number> = {};
    for (const e of errors) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    for (const [s, n] of Object.entries(byStatus)) {
      console.log(`   HTTP ${s || "(network)"}: ${n}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
