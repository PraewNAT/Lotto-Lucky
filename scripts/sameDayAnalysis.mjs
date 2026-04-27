/**
 * วิเคราะห์: มีเลขอะไรที่ออกใน "วันที่เดียวกันของเดือน" ซ้ำบ้าง?
 * (ไม่สนใจว่าเดือน/ปีไหน ขอแค่เลขวันตรงกัน เช่น ทุกวันที่ 1 หรือ ทุกวันที่ 16)
 *
 * run: node scripts/sameDayAnalysis.mjs
 */

const BASE = "https://lotto.api.rayriffy.com";

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": "SameDayAnalysis/1.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function idToIso(id) {
  const dd = id.slice(0, 2), mm = id.slice(2, 4), by = +id.slice(4, 8);
  return `${by - 543}-${mm}-${dd}`;
}

async function fetchAllIds() {
  const ids = [];
  for (let p = 1; p <= 30; p++) {
    const d = await fetchJSON(`${BASE}/list/${p}`);
    const batch = (d.response || []).map((x) => x.id).filter((id) => /^\d{8}$/.test(id));
    if (!batch.length) break;
    ids.push(...batch);
    await new Promise((r) => setTimeout(r, 60));
  }
  return ids;
}

async function fetchDraw(id) {
  try {
    const d = await fetchJSON(`${BASE}/lotto/${id}`);
    const r = d.response;
    if (!r) return null;
    const find = (arr, k) => (arr || []).find((p) => p.id === k)?.number ?? [];
    return {
      date: idToIso(id),
      first: find(r.prizes, "prizeFirst")[0] ?? "",
      front3: find(r.runningNumbers, "runningNumberFrontThree"),
      back3: find(r.runningNumbers, "runningNumberBackThree"),
      back2: find(r.runningNumbers, "runningNumberBackTwo")[0] ?? "",
    };
  } catch {
    return null;
  }
}

function dayOfMonth(iso) {
  const [, , dd] = iso.split("-");
  return parseInt(dd);
}

function analyzeRepeats(draws, key, label, formatNumber = (n) => n) {
  // group by day-of-month → collect numbers + occurrences
  const byDay = new Map(); // day → Map(number → [{date}, ...])
  for (const d of draws) {
    const day = dayOfMonth(d.date);
    if (!byDay.has(day)) byDay.set(day, new Map());
    const dayMap = byDay.get(day);
    const numbers = Array.isArray(d[key]) ? d[key] : [d[key]];
    for (const n of numbers) {
      if (!n) continue;
      if (!dayMap.has(n)) dayMap.set(n, []);
      dayMap.get(n).push(d.date);
    }
  }

  // find duplicates
  const duplicates = [];
  for (const [day, dayMap] of byDay) {
    for (const [num, dates] of dayMap) {
      if (dates.length >= 2) duplicates.push({ day, num, dates });
    }
  }
  duplicates.sort((a, b) => b.dates.length - a.dates.length || a.day - b.day);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`📊 ${label}`);
  console.log(`═══════════════════════════════════════════`);
  if (duplicates.length === 0) {
    console.log("ไม่มีเลขซ้ำในวันที่เดียวกัน");
    return;
  }
  console.log(`พบเลขซ้ำในวันที่เดียวกัน: ${duplicates.length} เคส\n`);
  console.log(
    `${"วันที่".padEnd(8)} | ${"เลข".padEnd(8)} | ${"จำนวนครั้ง".padEnd(10)} | วันที่ออก`,
  );
  console.log("─".repeat(80));
  for (const d of duplicates.slice(0, 30)) {
    console.log(
      `วันที่ ${d.day.toString().padStart(2)} | ${formatNumber(d.num).padEnd(8)} | ${d.dates.length.toString().padStart(2)} ครั้ง   | ${d.dates.join("  ")}`,
    );
  }
  if (duplicates.length > 30) console.log(`...และอีก ${duplicates.length - 30} เคส`);
}

async function main() {
  console.log("📥 กำลังดึงข้อมูลจาก API...");
  const ids = await fetchAllIds();
  console.log(`พบทั้งหมด ${ids.length} งวด\n`);

  const draws = [];
  for (let i = 0; i < ids.length; i++) {
    const d = await fetchDraw(ids[i]);
    if (d) draws.push(d);
    if ((i + 1) % 30 === 0) process.stdout.write(`  ดึงมาแล้ว ${i + 1}/${ids.length}\r`);
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`\n✅ ใช้งานได้ ${draws.length} งวด`);

  // กระจายตามวันที่
  const dayCounts = {};
  draws.forEach((d) => {
    const day = dayOfMonth(d.date);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  console.log("\nกระจายตามวันที่:");
  Object.keys(dayCounts).sort((a, b) => +a - +b).forEach((d) =>
    console.log(`  วันที่ ${d.toString().padStart(2)}: ${dayCounts[d]} งวด`),
  );

  analyzeRepeats(draws, "first", "รางวัลที่ 1 (6 หลัก) — ออกซ้ำในวันที่เดียวกัน");
  analyzeRepeats(draws, "back2", "เลขท้าย 2 ตัว — ออกซ้ำในวันที่เดียวกัน");
  analyzeRepeats(draws, "back3", "เลขท้าย 3 ตัว (รวมทั้ง 2 ชุด/งวด) — ออกซ้ำในวันที่เดียวกัน");
  analyzeRepeats(draws, "front3", "เลขหน้า 3 ตัว (รวมทั้ง 2 ชุด/งวด) — ออกซ้ำในวันที่เดียวกัน");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
